import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as amqp from 'amqplib';
import * as crypto from 'crypto';
import pdfParse from 'pdf-parse';

import { RABBITMQ_CHANNEL } from '../config/rabbitmq.config';
import { MinioService } from '../minio/minio.service';
import { Concert } from '../info/entities/concert.entity';
import { ShowInfo, ShowInfoDocument } from '../info/schemas/show-info.schema';
import { ArtistDocument } from './entities/artist-document.entity';
import { AiJob } from './entities/ai-job.entity';
import { PromptTemplate } from './entities/prompt-template.entity';
import { ArtistBio } from './entities/artist-bio.entity';

export const AI_PDF_UPLOADED_QUEUE = 'pdf-uploaded';
export const AI_EXCHANGE = 'ai.exchange';

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectRepository(Concert)
    private readonly concertRepo: Repository<Concert>,
    @InjectRepository(ArtistDocument)
    private readonly documentRepo: Repository<ArtistDocument>,
    @InjectRepository(AiJob)
    private readonly jobRepo: Repository<AiJob>,
    @InjectRepository(PromptTemplate)
    private readonly promptTemplateRepo: Repository<PromptTemplate>,
    @InjectRepository(ArtistBio)
    private readonly bioRepo: Repository<ArtistBio>,
    @InjectModel(ShowInfo.name)
    private readonly showInfoModel: Model<ShowInfoDocument>,
    private readonly minioService: MinioService,
    @Inject(RABBITMQ_CHANNEL)
    private readonly rabbitChannel: amqp.Channel,
  ) {}

  async onModuleInit() {
    try {
      // Assert queues & exchanges
      await this.rabbitChannel.assertExchange(AI_EXCHANGE, 'direct', { durable: true });
      await this.rabbitChannel.assertQueue(AI_PDF_UPLOADED_QUEUE, { durable: true });
      await this.rabbitChannel.bindQueue(AI_PDF_UPLOADED_QUEUE, AI_EXCHANGE, 'ai.pdf.uploaded');
      
      this.logger.log('Asserted AI exchange & queue successfully.');

      // Seed default prompt template if none exists
      const count = await this.promptTemplateRepo.count();
      if (count === 0) {
        const promptTemplateText = `System Role: Bạn là chuyên gia Marketing, Copywriter và Chuyên gia tối ưu hóa tìm kiếm (SEO) hàng đầu trong ngành công nghiệp âm nhạc và giải trí tại Việt Nam.

Nhiệm vụ: Dựa trên thông tin thô được cung cấp dưới đây về nghệ sĩ, hãy biên soạn và sinh ra 3 phiên bản giới thiệu (Bio) bao gồm: bản ngắn (short), bản vừa (medium) và bản tối ưu SEO (SEO).

Yêu cầu kỹ thuật chi tiết:
1. Short Bio (Ngắn): Dài từ 50-70 từ, giọng văn lôi cuốn, tập trung vào điểm nổi bật lớn nhất của nghệ sĩ. Thích hợp hiển thị ở banner hoặc phần preview nhanh.
2. Medium Bio (Vừa): Dài từ 150-200 từ, mô tả chi tiết hơn về phong cách âm nhạc, hành trình sự nghiệp và các bài hit/thành tựu nổi bật nhất.
3. SEO Bio: Bản tóm tắt tối ưu hóa công cụ tìm kiếm, dài từ 100-120 từ, chứa từ khóa liên quan đến concert và nghệ sĩ một cách tự nhiên.
4. SEO Keywords: Trích xuất danh sách 5-8 từ khóa SEO quan trọng nhất.

Dữ liệu thô của nghệ sĩ:
---
{{RAW_ARTIST_TEXT}}
---

Định dạng đầu ra bắt buộc: Phải trả về duy nhất chuỗi JSON hợp lệ theo Schema dưới đây, tuyệt đối không bao gồm markdown code blocks (như \`\`\`json) hay ký tự thừa ngoài JSON.`;

        const template = this.promptTemplateRepo.create({
          name: 'default_artist_bio_v1',
          templateText: promptTemplateText,
          isActive: true,
          version: 1,
        });
        await this.promptTemplateRepo.save(template);
        this.logger.log('Seeded default Prompt Template successfully.');
      }
    } catch (err) {
      this.logger.error(`AI Service init error: ${err.message}`);
    }
  }

  async uploadArtistDocument(file: any, concertId: number, userId: string) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Verify Concert exists
    const concert = await this.concertRepo.findOne({ where: { id: concertId } });
    if (!concert) {
      throw new BadRequestException('Concert not found');
    }

    // 1. Extract text from the buffer NOW while it is in memory
    //    This avoids needing to re-download from MinIO inside the worker.
    let rawText = '';
    try {
      const ext = (file.originalname || '').split('.').pop()?.toLowerCase();
      if (ext === 'pdf') {
        const parsed = await pdfParse(file.buffer);
        rawText = (parsed.text || '').replace(/\s+/g, ' ').trim();
      } else {
        // DOCX / DOC — treat raw buffer as UTF-8 text (best-effort)
        rawText = file.buffer.toString('utf8').replace(/\s+/g, ' ').trim();
      }
    } catch (parseErr) {
      this.logger.warn(`Text extraction at upload time failed: ${parseErr.message}. Worker will try again.`);
    }

    if (rawText.length < 50) {
      // Attempt raw UTF-8 recovery
      rawText = file.buffer.toString('utf8').replace(/\s+/g, ' ').trim();
    }

    const documentId = crypto.randomUUID();
    const ext = (file.originalname || 'document.pdf').split('.').pop()?.toLowerCase() || 'pdf';
    const objectName = `${documentId}.${ext}`;
    const bucketName = 'artist-documents';

    // 2. Upload to MinIO (non-fatal — worker uses rawText from queue instead)
    let fileUrl = `minio://${bucketName}/${objectName}`;
    try {
      fileUrl = await this.minioService.uploadBuffer(
        bucketName,
        objectName,
        file.buffer,
        file.mimetype || 'application/pdf',
      );
    } catch (err) {
      this.logger.warn(`MinIO upload skipped (non-fatal): ${err.message}. rawText will be used from queue payload.`);
    }

    // 3. Create database entries
    const doc = this.documentRepo.create({
      id: documentId,
      concertId,
      fileName: file.originalname || 'document.pdf',
      fileUrl,
      fileSize: file.size,
      uploadedBy: userId,
    });
    await this.documentRepo.save(doc);

    const job = this.jobRepo.create({
      documentId: doc.id,
      status: 'PENDING',
      retryCount: 0,
    });
    await this.jobRepo.save(job);

    // 4. Publish RabbitMQ Event — include rawText so worker skips MinIO download
    this.rabbitChannel.publish(AI_EXCHANGE, 'ai.pdf.uploaded', Buffer.from(JSON.stringify({
      jobId: job.id,
      documentId: doc.id,
      fileUrl,
      rawText,          // ← pre-extracted text, worker will use this directly
      promptTemplateId: undefined,
    })), { persistent: true });

    this.logger.log(`Document ${doc.id} uploaded. Initiated AI Job ${job.id}. Text length: ${rawText.length}`);

    return {
      jobId: job.id,
      documentId: doc.id,
      status: 'PENDING',
      message: 'File uploaded successfully. AI processing initiated.',
    };
  }


  async generateBio(documentId: string, promptTemplateId?: string) {
    const doc = await this.documentRepo.findOne({ where: { id: documentId } });
    if (!doc) {
      throw new BadRequestException('Document not found');
    }

    let activeTemplate = null;
    if (promptTemplateId) {
      activeTemplate = await this.promptTemplateRepo.findOne({ where: { id: promptTemplateId } });
      if (!activeTemplate) {
        throw new BadRequestException('Prompt template not found');
      }
    } else {
      activeTemplate = await this.promptTemplateRepo.findOne({ where: { isActive: true } });
      if (!activeTemplate) {
        throw new InternalServerErrorException('No active prompt template found');
      }
    }

    const job = this.jobRepo.create({
      documentId,
      status: 'SUMMARIZING',
      retryCount: 0,
    });
    await this.jobRepo.save(job);

    // Publish to AI queue
    this.rabbitChannel.publish(AI_EXCHANGE, 'ai.pdf.uploaded', Buffer.from(JSON.stringify({
      jobId: job.id,
      documentId,
      promptTemplateId: activeTemplate.id,
      fileUrl: doc.fileUrl,
    })), { persistent: true });

    this.logger.log(`Forced regeneration of bio for Doc: ${documentId}, Job: ${job.id}`);

    return {
      jobId: job.id,
      status: 'SUMMARIZING',
    };
  }

  async getBio(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    let bio = null;

    if (isUuid) {
      bio = await this.bioRepo.findOne({ where: { id } });
    }

    if (!bio) {
      const concertId = Number(id);
      const searchConditions: any[] = [];
      if (!isNaN(concertId)) {
        searchConditions.push({ concertId });
      }
      if (isUuid) {
        searchConditions.push({ jobId: id });
      }

      if (searchConditions.length > 0) {
        bio = await this.bioRepo.findOne({
          where: searchConditions,
          order: { createdAt: 'DESC' },
        });
      }
    }

    if (bio) {
      return {
        id: bio.id,
        concertId: bio.concertId,
        shortBio: bio.shortBio,
        mediumBio: bio.mediumBio,
        seoBio: bio.seoBio,
        status: 'COMPLETED',
        createdAt: bio.createdAt,
        artistName: bio.artistName,
        stageName: bio.stageName,
        category: bio.category,
        genres: bio.genres,
        country: bio.country,
        avatarUrl: bio.avatarUrl,
      };
    }

    // Try finding the active job if bio is not yet generated
    const searchJobs: any[] = [];
    if (isUuid) {
      searchJobs.push({ id });
      searchJobs.push({ documentId: id });
    }

    let job = null;
    if (searchJobs.length > 0) {
      job = await this.jobRepo.findOne({
        where: searchJobs,
        order: { createdAt: 'DESC' }
      });
    }

    if (job) {
      let clientStatus = job.status;
      if (clientStatus === 'EXTRACTING') {
        clientStatus = 'PARSING';
      }
      return {
        id: job.id,
        status: clientStatus,
        errorMessage: job.errorMessage,
      };
    }

    throw new NotFoundException('Artist Bio or Job not found');
  }

  async approveBio(
    id: string,
    shortBio: string,
    mediumBio: string,
    seoBio: string,
    userId: string,
    artistName?: string,
    stageName?: string,
    category?: string,
    avatarUrl?: string,
    genres?: string[],
    country?: string,
  ) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    let bio = null;

    if (isUuid) {
      bio = await this.bioRepo.findOne({ where: { id } });
    }

    if (!bio) {
      const concertId = Number(id);
      if (!isNaN(concertId)) {
        bio = await this.bioRepo.findOne({
          where: { concertId },
          order: { createdAt: 'DESC' },
        });
      }
    }

    if (!bio) {
      throw new NotFoundException('Artist Bio not found');
    }

    // Update bio status and content
    bio.shortBio = shortBio || bio.shortBio;
    bio.mediumBio = mediumBio || bio.mediumBio;
    bio.seoBio = seoBio || bio.seoBio;
    bio.status = 'APPROVED';
    bio.reviewedBy = userId;
    bio.reviewedAt = new Date();

    if (artistName) bio.artistName = artistName;
    if (stageName) bio.stageName = stageName;
    if (category) bio.category = category;
    if (avatarUrl) bio.avatarUrl = avatarUrl;
    if (genres) bio.genres = genres;
    if (country) bio.country = country;

    const updatedBio = await this.bioRepo.save(bio);

    // Publish to Concert details in MongoDB
    await this.showInfoModel.updateOne(
      { showId: bio.concertId },
      { $set: { artistBio: updatedBio.mediumBio } }
    );

    this.logger.log(`Concert ${bio.concertId} bio approved and published.`);

    return {
      id: updatedBio.id,
      status: 'APPROVED',
      publishedAt: updatedBio.reviewedAt,
    };
  }

  async getAllBios() {
    const bios = await this.bioRepo.find({
      order: { createdAt: 'DESC' },
    });

    return bios.map(bio => {
      return {
        id: bio.id,
        concertId: bio.concertId,
        artistName: bio.artistName || 'Nghệ sĩ chưa rõ',
        stageName: bio.stageName || 'Nghệ sĩ chưa rõ',
        category: bio.category || 'Singer',
        genres: bio.genres || ['V-Pop'],
        status: bio.status === 'APPROVED' ? 'published' : 'draft',
        shortBio: bio.shortBio,
        country: bio.country || 'Vietnam',
        avatarUrl: bio.avatarUrl || '',
        createdAt: bio.createdAt,
        updatedAt: bio.updatedAt,
        createdBy: 'Hệ thống',
      };
    });
  }

  async deleteBio(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    let bio = null;

    if (isUuid) {
      bio = await this.bioRepo.findOne({ where: { id } });
    } else {
      const concertId = Number(id);
      if (!isNaN(concertId)) {
        bio = await this.bioRepo.findOne({ where: { concertId } });
      }
    }

    if (!bio) {
      throw new NotFoundException('Artist Bio not found');
    }

    await this.bioRepo.remove(bio);

    await this.showInfoModel.updateOne(
      { showId: bio.concertId },
      { $unset: { artistBio: '' } }
    );

    return { message: 'Deleted biography successfully' };
  }


  async createManualBio(body: any, userId: string) {
    const bio = this.bioRepo.create({
      artistName: body.artistName,
      stageName: body.stageName || '',
      category: body.category || 'Singer',
      shortBio: body.shortBio || '',
      mediumBio: body.mediumBio || '',
      seoBio: body.seoBio || '',
      genres: body.genres || [],
      country: body.country || 'Vietnam',
      avatarUrl: body.avatarUrl || '',
      status: body.status || 'APPROVED',
      reviewedBy: userId,
      reviewedAt: new Date(),
    });

    return await this.bioRepo.save(bio);
  }
}