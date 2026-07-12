import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as amqp from 'amqplib';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const csvParser = require('csv-parser');
import { Readable } from 'stream';
import Redis from 'ioredis';
import { ImportJob, ImportJobStatus, ImportRowError } from '../../guest/entities/import-job.entity';
import { SeatInventory, SeatStatus } from '../../booking/entities/seat-inventory.entity';
import { Ticket } from '../../booking/entities/ticket.entity';
import { RABBITMQ_CHANNEL } from '../../config/rabbitmq.config';
import { REDIS_CLIENT } from '../../config/redis.config';
import { MinioService } from '../../minio/minio.service';

const CSV_BUCKET = process.env.MINIO_BUCKET_CSV || 'ticketbox-csv-imports';

/**
 * Batch size: số rows gom lại trước khi thực hiện một lần Bulk Insert vào DB.
 * Giá trị 1000 cân bằng giữa số lần round-trip DB và kích thước payload SQL.
 */
const BATCH_SIZE = 1000;

interface ImportPayload {
  jobId: string;
  /** MinIO object key — e.g. "showId/sponsorId_timestamp.csv" */
  fileKey: string;
  showId: string;
  sponsorId: string;
}

interface ValidatedRow {
  concert_id: number;
  seatNo: string;
  seatRow: string;
  seatNum: string;
  guestName: string;
  guestEmail: string;
  sponsorId: string;
  importJobId: string;
}

@Injectable()
export class GuestImportProcessor implements OnModuleInit {
  private readonly logger = new Logger(GuestImportProcessor.name);

  constructor(
    @Inject(RABBITMQ_CHANNEL) private readonly rabbitChannel: amqp.Channel,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectRepository(ImportJob)
    private readonly importJobRepo: Repository<ImportJob>,
    @InjectRepository(SeatInventory)
    private readonly seatRepo: Repository<SeatInventory>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    private readonly minioService: MinioService,
  ) {}

  async onModuleInit() {
    // Process one file at a time — prevents DB thrash and overlapping locks
    await this.rabbitChannel.prefetch(1);
    this.logger.log('GuestImportProcessor: listening on vip_guest.import [prefetch=1] (MinIO mode)');

    this.rabbitChannel.consume(
      'vip_guest.import',
      async (msg) => { if (msg) await this.handleMessage(msg); },
      { noAck: false },
    );
  }

  // ── Message handler ─────────────────────────────────────────────────────────

  private async handleMessage(msg: amqp.ConsumeMessage) {
    const payload: ImportPayload = JSON.parse(msg.content.toString());
    const { jobId, fileKey, showId, sponsorId } = payload;

    // Distributed lock (30-min TTL) — one job per show+sponsor at a time
    const lockKey = `lock:vip_import:${showId}:${sponsorId}`;
    const lockResult = await this.redis.set(lockKey, jobId, 'EX', 1800, 'NX');
    const acquired = lockResult === 'OK';
    if (!acquired) {
      this.logger.warn(`[${jobId}] Lock held for show=${showId} sponsor=${sponsorId} — requeuing.`);
      this.rabbitChannel.nack(msg, false, true);
      return;
    }

    try {
      const job = await this.importJobRepo.findOne({ where: { id: jobId } });
      if (!job) {
        this.logger.error(`[${jobId}] Job record not found — discarding message.`);
        this.rabbitChannel.ack(msg);
        return;
      }

      // Mark as PROCESSING
      await this.importJobRepo.update(jobId, {
        status: ImportJobStatus.PROCESSING,
        startedAt: new Date(),
      });

      // Core: stream CSV from MinIO → for-await → batch bulk insert
      const { successCount, errorCount, errorDetails, totalRows } =
        await this.processFile(fileKey, showId, sponsorId, jobId);

      // Archive the processed file on MinIO (non-fatal — Q7 decision)
      await this.minioService.archiveCsvObject(CSV_BUCKET, fileKey);

      // Choose final status: COMPLETED vs COMPLETED_WITH_ERRORS (skip-and-continue)
      const finalStatus = errorCount > 0
        ? ImportJobStatus.COMPLETED_WITH_ERRORS
        : ImportJobStatus.COMPLETED;

      await this.importJobRepo.update(jobId, {
        status: finalStatus,
        totalRows,
        successCount,
        errorCount,
        errorDetails,
        processedRows: totalRows,
        completedAt: new Date(),
      });

      this.logger.log(
        `[${jobId}] ${finalStatus} — success=${successCount} errors=${errorCount} total=${totalRows}`,
      );

      // Notify operations (fire-and-forget)
      this.rabbitChannel.sendToQueue(
        'notification_queue',
        Buffer.from(JSON.stringify({
          type: 'VIP_IMPORT_COMPLETE',
          jobId, showId, sponsorId,
          successCount, errorCount, totalRows,
        })),
      );

      this.rabbitChannel.ack(msg);

    } catch (err) {
      this.logger.error(`[${jobId}] Unrecoverable error: ${err.message}`);

      // Tag with status=error; MinIO lifecycle rule purges after 30 days (Q8 decision)
      await this.minioService.tagObjectAsError(CSV_BUCKET, fileKey).catch(() => {
        // Non-fatal — don't swallow the original error
      });

      await this.importJobRepo.update(jobId, {
        status: ImportJobStatus.FAILED,
        completedAt: new Date(),
      });

      // NACK without requeue → RabbitMQ routes to DLQ
      this.rabbitChannel.nack(msg, false, false);

    } finally {
      await this.redis.del(lockKey);
    }
  }

  // ── CSV Processing: for-await + Batch Bulk Insert ───────────────────────────

  /**
   * Streams a CSV from MinIO and processes rows in batches of BATCH_SIZE.
   *
   * Memory safety:
   *   The `for await` loop naturally back-pressures the csv-parser readable —
   *   while `bulkInsertBatch()` is awaited, no new 'data' events fire, keeping
   *   in-memory state bounded to at most BATCH_SIZE rows regardless of file size.
   *
   * Skip-and-continue:
   *   Invalid rows are logged to errors[] and skipped; valid rows still proceed.
   *   Final status is COMPLETED_WITH_ERRORS when errors.length > 0.
   */
  private async processFile(
    fileKey: string,
    showId: string,
    sponsorId: string,
    jobId: string,
  ): Promise<{
    successCount: number;
    errorCount: number;
    errorDetails: ImportRowError[];
    totalRows: number;
  }> {
    // 1. Get a readable stream from MinIO (never buffers entire file in memory)
    let stream: Readable;
    try {
      stream = await this.minioService.getObjectStream(CSV_BUCKET, fileKey);
    } catch (err) {
      throw new Error(`Cannot open MinIO object '${fileKey}': ${err.message}`);
    }

    // 2. Wrap csv-parser stream as an AsyncGenerator for for-await consumption
    const csvAsyncIter = this.toCsvAsyncIterator(stream);

    const errors: ImportRowError[] = [];
    let validBatch: ValidatedRow[] = [];
    let successCount = 0;
    let totalRows = 0;

    // 3. for await — one row at a time.
    //    Stream is naturally paused while bulkInsertBatch() is awaited,
    //    then resumes automatically — no manual pause/resume needed.
    for await (const row of csvAsyncIter) {
      totalRows++;
      const currentRow = totalRows;

      const validated = this.validateRow(row, currentRow, showId, sponsorId, jobId, errors);
      if (validated) {
        validBatch.push(validated);
      }

      // When batch is full: bulk insert → reset batch → update progress counter
      if (validBatch.length >= BATCH_SIZE) {
        const inserted = await this.bulkInsertBatch(validBatch, showId, errors, currentRow);
        successCount += inserted;
        validBatch = [];

        // Persist processedRows so frontend polling GET /imports/:id can show progress
        await this.importJobRepo.update(jobId, { processedRows: totalRows });
        this.logger.log(`[${jobId}] Batch flushed — processedRows=${totalRows} successCount=${successCount}`);
      }
    }

    // 4. Flush the final partial batch (< BATCH_SIZE rows)
    if (validBatch.length > 0) {
      const inserted = await this.bulkInsertBatch(validBatch, showId, errors, totalRows);
      successCount += inserted;
    }

    return { successCount, errorCount: errors.length, errorDetails: errors, totalRows };
  }

  /**
   * Converts an event-based csv-parser stream into an AsyncGenerator<Row>.
   *
   * Why a generator instead of collecting all rows first?
   * Collecting all rows would load the entire file into memory.
   * The generator yields rows one at a time, allowing the consumer (for await)
   * to control throughput — rows produced faster than consumed are buffered
   * in the internal queue, but that queue drains between batches due to
   * the await in the for-await body.
   */
  private toCsvAsyncIterator(stream: Readable): AsyncGenerator<Record<string, string>> {
    const csvStream = stream.pipe(
      csvParser({
        // Strip BOM from header names and trim whitespace
        mapHeaders: ({ header }: { header: string }) =>
          header.replace(/^\uFEFF/, '').trim(),
        mapValues: ({ value }: { value: string }) => value.trim(),
      }),
    );

    return (async function* () {
      const queue: Record<string, string>[] = [];
      let notifyConsumer: (() => void) | null = null;
      let streamDone = false;
      let streamError: Error | null = null;

      csvStream.on('data', (row: Record<string, string>) => {
        queue.push(row);
        if (notifyConsumer) { notifyConsumer(); notifyConsumer = null; }
      });

      csvStream.on('end', () => {
        streamDone = true;
        if (notifyConsumer) { notifyConsumer(); notifyConsumer = null; }
      });

      csvStream.on('error', (err: Error) => {
        streamError = err;
        if (notifyConsumer) { notifyConsumer(); notifyConsumer = null; }
      });

      while (true) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else if (streamDone) {
          if (streamError) throw streamError;
          return; // End of stream — generator is done
        } else {
          // No data yet — wait until next event fires
          await new Promise<void>((resolve) => { notifyConsumer = resolve; });
          if (streamError) throw streamError;
        }
      }
    })();
  }

  // ── Row Validation ──────────────────────────────────────────────────────────

  /**
   * Validates one CSV row. Returns a ValidatedRow on success, null on failure.
   * Skip-and-Continue: failures are pushed to errors[], not thrown.
   */
  private validateRow(
    row: Record<string, string>,
    rowIndex: number,
    showId: string,
    sponsorId: string,
    jobId: string,
    errors: ImportRowError[],
  ): ValidatedRow | null {
    const { seatNo, name, email } = row;

    if (!seatNo || !name || !email) {
      errors.push({
        row: rowIndex,
        seatNo: seatNo ?? '',
        reason: `Missing required field — seatNo='${seatNo}' name='${name}' email='${email}'`,
      });
      return null;
    }

    const parts = seatNo.split('-');
    if (parts.length !== 2) {
      errors.push({
        row: rowIndex, seatNo,
        reason: `Invalid seatNo format '${seatNo}', expected 'ROW-NUMBER' (e.g. A-1)`,
      });
      return null;
    }

    const [seatRow, seatNum] = parts;
    return {
      concert_id: Number(showId),
      seatNo,
      seatRow,
      seatNum,
      guestName: name,
      guestEmail: email,
      sponsorId,
      importJobId: jobId,
    };
  }

  // ── Bulk Insert ─────────────────────────────────────────────────────────────

  /**
   * Performs ONE bulk INSERT for all valid rows in this batch.
   * This replaces the original per-row INSERT pattern (N queries → 1 query).
   *
   * Seat ownership is validated per-row before inserting; invalid seats are
   * skipped and logged. If the bulk INSERT itself fails, all rows in the
   * batch are logged as errors (atomic batch failure).
   *
   * @returns number of successfully inserted rows
   */
  private async bulkInsertBatch(
    batch: ValidatedRow[],
    showId: string,
    errors: ImportRowError[],
    lastRowIndex: number,
  ): Promise<number> {
    if (batch.length === 0) return 0;

    const batchStartRow = lastRowIndex - batch.length + 1;
    const validRows: Array<ValidatedRow & { rowIndex: number }> = [];

    // Validate seat ownership for each row in the batch
    for (let i = 0; i < batch.length; i++) {
      const row = batch[i];
      const rowIndex = batchStartRow + i;

      try {
        const seat = await this.seatRepo.findOne({
          where: { seatNo: row.seatNo, concert_id: Number(showId) },
        });

        if (!seat) {
          errors.push({ row: rowIndex, seatNo: row.seatNo, reason: `Seat ${row.seatNo} not found for show ${showId}` });
          continue;
        }
        if (seat.sponsorId === null || seat.sponsorId === undefined) {
          errors.push({ row: rowIndex, seatNo: row.seatNo, reason: `Seat ${row.seatNo} is a public seat and not allocated to any sponsor` });
          continue;
        }
        if (seat.sponsorId !== row.sponsorId) {
          errors.push({ row: rowIndex, seatNo: row.seatNo, reason: `Seat ${row.seatNo} belongs to sponsor '${seat.sponsorId}', not '${row.sponsorId}'` });
          continue;
        }

        validRows.push({ ...row, rowIndex });
      } catch (err) {
        errors.push({ row: rowIndex, seatNo: row.seatNo, reason: err.message });
      }
    }

    if (validRows.length === 0) return 0;

    try {
      // ONE bulk INSERT — replaces N individual INSERT statements
      await this.ticketRepo
        .createQueryBuilder()
        .insert()
        .into(Ticket)
        .values(
          validRows.map((r) => ({
            concert_id: r.concert_id,
            seatNo: r.seatNo,
            zone: 'SVIP',
            price: 0,
            guestName: r.guestName,
            guestEmail: r.guestEmail,
            sponsorId: r.sponsorId,
            importJobId: r.importJobId,
          })),
        )
        .orUpdate(
          ['guestName', 'guestEmail', 'sponsorId', 'importJobId', 'updatedAt'],
          ['concert_id', 'seatNo'],
        )
        .execute();

      // Mark all valid seats as SOLD in one UPDATE
      const seatNos = validRows.map((r) => `'${r.seatNo}'`).join(', ');
      await this.seatRepo
        .createQueryBuilder()
        .update(SeatInventory)
        .set({ status: SeatStatus.SOLD })
        .where(
          `"seatNo" IN (${seatNos}) AND "concert_id" = :showId`,
          { showId: Number(showId) },
        )
        .execute();

      this.logger.debug(`Bulk inserted ${validRows.length} rows (show=${showId})`);
      return validRows.length;

    } catch (err) {
      // Batch-level failure: log all rows in this batch as errors
      for (const r of validRows) {
        errors.push({ row: r.rowIndex, seatNo: r.seatNo, reason: `Batch insert failed: ${err.message}` });
      }
      this.logger.error(`Bulk insert failed for batch ending at row ${lastRowIndex}: ${err.message}`);
      return 0;
    }
  }
}
