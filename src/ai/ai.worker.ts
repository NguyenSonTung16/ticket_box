import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as amqp from 'amqplib';
import pdfParse from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { RABBITMQ_CHANNEL } from '../config/rabbitmq.config';
import { MinioService } from '../minio/minio.service';
import { ArtistDocument } from './entities/artist-document.entity';
import { AiJob } from './entities/ai-job.entity';
import { PromptTemplate } from './entities/prompt-template.entity';
import { ArtistBio } from './entities/artist-bio.entity';

@Injectable()
export class AiWorker implements OnModuleInit {
  private readonly logger = new Logger(AiWorker.name);
  private readonly QUEUE_NAME = 'pdf-uploaded';
  private readonly AI_EXCHANGE = 'ai.exchange';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly rabbitChannel: amqp.Channel,
    private readonly minioService: MinioService,
    @InjectRepository(ArtistDocument)
    private readonly documentRepo: Repository<ArtistDocument>,
    @InjectRepository(AiJob)
    private readonly jobRepo: Repository<AiJob>,
    @InjectRepository(PromptTemplate)
    private readonly promptTemplateRepo: Repository<PromptTemplate>,
    @InjectRepository(ArtistBio)
    private readonly bioRepo: Repository<ArtistBio>,
  ) {}

  async onModuleInit() {
    try {
      await this.rabbitChannel.prefetch(1);
      this.rabbitChannel.consume(this.QUEUE_NAME, async (msg) => {
        if (msg) await this.handlePdfUploaded(msg);
      }, { noAck: false });
      this.logger.log(`AI Document Worker started consuming from queue: ${this.QUEUE_NAME}`);
    } catch (err) {
      this.logger.error(`Failed to start AI worker: ${err.message}`);
    }
  }

  private async handlePdfUploaded(msg: amqp.ConsumeMessage) {
    let payload: any;
    try {
      payload = JSON.parse(msg.content.toString());
    } catch (err) {
      this.logger.error(`Failed to parse queue message JSON: ${err.message}`);
      this.rabbitChannel.reject(msg, false); // Route to DLQ
      return;
    }

    const { jobId, documentId, fileUrl, rawText: payloadRawText } = payload;
    this.logger.log(`Processing AI Job ${jobId} for Document ${documentId}`);

    try {
      // 1. Update Job Status to EXTRACTING
      await this.jobRepo.update(jobId, { status: 'EXTRACTING', updatedAt: new Date() });

      // 2. Use pre-extracted text from queue payload (preferred path — no MinIO needed)
      let rawText = (payloadRawText || '').trim();

      if (rawText.length < 100) {
        // Fallback: download from MinIO and parse
        this.logger.warn(`rawText from payload too short (${rawText.length} chars). Attempting MinIO download.`);
        const ext = (fileUrl || '').split('.').pop()?.split('?')[0]?.toLowerCase() || 'pdf';
        const objectName = `${documentId}.${ext}`;
        const bucketName = 'artist-documents';
        let pdfBuffer: Buffer;
        try {
          pdfBuffer = await this.minioService.downloadBuffer(bucketName, objectName);
        } catch (err) {
          throw new Error(`Failed to download PDF from storage: ${err.message}`);
        }

        try {
          const parsedPdf = await pdfParse(pdfBuffer);
          rawText = parsedPdf.text || '';
        } catch (err) {
          const textRecovery = pdfBuffer.toString('utf8');
          if (textRecovery.trim().length >= 100) {
            this.logger.warn(`PDF parsing failed: ${err.message}. Recovered plain text from buffer.`);
            rawText = textRecovery;
          } else {
            throw new Error(`PDF parsing failed: ${err.message}`);
          }
        }
      }

      // 3. Clean text
      const cleanedText = rawText.replace(/\s+/g, ' ').trim();
      if (cleanedText.length < 50) {
        throw new Error('Document content too short to generate a biography (less than 50 characters extracted)');
      }

      // 4. Update Job Status to SUMMARIZING
      await this.jobRepo.update(jobId, { status: 'SUMMARIZING', updatedAt: new Date() });

      // 5. Fetch Active Prompt Template
      let template = null;
      if (payload.promptTemplateId) {
        template = await this.promptTemplateRepo.findOne({ where: { id: payload.promptTemplateId } });
      }
      if (!template) {
        template = await this.promptTemplateRepo.findOne({ where: { isActive: true } });
      }
      if (!template) {
        throw new Error('No active Prompt Template found in database');
      }

      // Build Prompt
      const prompt = template.templateText.replace('{{RAW_ARTIST_TEXT}}', cleanedText);

      // 6. Invoke Gemini AI (or Mock Fallback)
      const apiKey = (process.env.GEMINI_API_KEY || '').replace(/"/g, '').trim();
      let bioData: any;

      if (!apiKey || apiKey.trim() === '') {
        this.logger.warn(`GEMINI_API_KEY not set. Using structured Mock AI fallback for Job ${jobId}`);
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate AI delay
        bioData = {
          short_bio: `Ngắn: Nghệ sĩ tài năng hàng đầu Việt Nam. Nổi bật với phong cách âm nhạc độc đáo, hiện đại và lôi cuốn khán giả. Trích xuất từ tài liệu: ${documentId}.`,
          medium_bio: `Trung bình: Nghệ sĩ tài năng đã phát triển sự nghiệp biểu diễn ấn tượng thông qua các bản hit hàng đầu thị trường. Họ là cái tên được mong chờ tại liveshow Anh Trai Say Hi 2026 sắp tới.`,
          seo_bio: `Đặt vé xem concert trực tiếp có sự tham gia của nghệ sĩ tại TicketBox. Trải nghiệm hệ thống đặt vé nhanh chóng, tiện lợi nhất.`,
          seo_keywords: ['concert', 'ticketbox', 'artist bio', 'live music', 'anh trai say hi', 'showbiz'],
        };
      } else {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          });

          const textResponse = result.response.text();
          let jsonText = textResponse.trim();
          if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
          }

          try {
            bioData = JSON.parse(jsonText);
          } catch (err) {
            throw new Error(`Failed to parse JSON response from Gemini: ${textResponse}`);
          }

          // Schema validation
          const required = ['short_bio', 'medium_bio', 'seo_bio', 'seo_keywords'];
          for (const field of required) {
            if (!bioData[field]) {
              throw new Error(`Gemini response missing required field: ${field}`);
            }
          }
        } catch (geminiError) {
          this.logger.error(`Gemini API invocation failed: ${geminiError.message}. Falling back to Mock AI.`);
          bioData = {
            short_bio: `Ngắn: Nghệ sĩ tài năng hàng đầu Việt Nam. Nổi bật với phong cách âm nhạc độc đáo, hiện đại và lôi cuốn khán giả. Trích xuất từ tài liệu: ${documentId}. (Fallback do lỗi API)`,
            medium_bio: `Trung bình: Nghệ sĩ tài năng đã phát triển sự nghiệp biểu diễn ấn tượng thông qua các bản hit hàng đầu thị trường. Họ là cái tên được mong chờ tại liveshow Anh Trai Say Hi 2026 sắp tới. (Fallback do lỗi API)`,
            seo_bio: `Đặt vé xem concert trực tiếp có sự tham gia của nghệ sĩ tại TicketBox. Trải nghiệm hệ thống đặt vé nhanh chóng, tiện lợi nhất.`,
            seo_keywords: ['concert', 'ticketbox', 'artist bio', 'live music', 'anh trai say hi', 'showbiz'],
          };
        }
      }

      // 7. Find associated concert
      const documentRecord = await this.documentRepo.findOne({ where: { id: documentId } });
      if (!documentRecord) {
        throw new Error(`Document record ${documentId} vanished during job processing.`);
      }

      // 8. Save ArtistBio
      const bioRecord = this.bioRepo.create({
        concertId: documentRecord.concertId,
        jobId,
        promptTemplateId: template.id,
        shortBio: bioData.short_bio,
        mediumBio: bioData.medium_bio,
        seoBio: bioData.seo_bio,
        status: 'PENDING_REVIEW',
      });
      await this.bioRepo.save(bioRecord);

      // 9. Update Job Status to COMPLETED
      await this.jobRepo.update(jobId, { status: 'COMPLETED', updatedAt: new Date() });

      // 10. Publish Event
      this.rabbitChannel.publish(this.AI_EXCHANGE, 'ai.bio.generated', Buffer.from(JSON.stringify({
        bioId: bioRecord.id,
        concertId: documentRecord.concertId,
        jobId,
      })), { persistent: true });

      this.logger.log(`AI Job ${jobId} finished successfully. Generated Bio ${bioRecord.id}.`);
      this.rabbitChannel.ack(msg);

    } catch (err) {
      this.logger.error(`Error processing AI Job ${jobId}: ${err.message}`);
      await this.handleJobError(msg, payload, err);
    }
  }

  private async handleJobError(msg: amqp.ConsumeMessage, payload: any, error: Error) {
    const { jobId } = payload;
    
    try {
      // Find current job state
      const job = await this.jobRepo.findOne({ where: { id: jobId } });
      const currentRetry = job?.retryCount || 0;
      const nextRetry = currentRetry + 1;

      if (nextRetry < 3) {
        // Update retry count and status in DB
        await this.jobRepo.update(jobId, {
          retryCount: nextRetry,
          errorMessage: error.message,
          status: 'PENDING',
          updatedAt: new Date(),
        });

        // Acknowledge the old message so it doesn't get requeued immediately,
        // then publish it again with a delay (exponential backoff)
        this.rabbitChannel.ack(msg);

        const delayMs = Math.pow(2, nextRetry) * 2000; // 4s, 8s, etc.
        this.logger.warn(`Scheduling retry #${nextRetry} for Job ${jobId} in ${delayMs}ms.`);

        setTimeout(() => {
          this.rabbitChannel.publish(this.AI_EXCHANGE, 'ai.pdf.uploaded', Buffer.from(JSON.stringify({
            ...payload,
            retryCount: nextRetry,
          })), { persistent: true });
        }, delayMs);
      } else {
        // Max retries reached! Update status to FAILED
        await this.jobRepo.update(jobId, {
          status: 'FAILED',
          errorMessage: `Max retries exceeded. Last error: ${error.message}`,
          updatedAt: new Date(),
        });

        this.logger.error(`Max retries reached for Job ${jobId}. Routing to DLQ.`);
        this.rabbitChannel.reject(msg, false); // Sends it directly to Dead Letter Queue (DLQ)
      }
    } catch (dbErr) {
      this.logger.error(`Double fault: failed to update error state in DB for Job ${jobId}: ${dbErr.message}`);
      this.rabbitChannel.reject(msg, false);
    }
  }
}
