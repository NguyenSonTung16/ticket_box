import { S3Client } from '@aws-sdk/client-s3';

/**
 * Injection token for the MinIO S3Client.
 * Use @Inject(MINIO_CLIENT) to inject into services.
 */
export const MINIO_CLIENT = 'MINIO_CLIENT';

/**
 * Factory function that creates and returns a configured S3Client
 * pointed at the MinIO instance.
 *
 * CRITICAL: forcePathStyle MUST be true for MinIO.
 * Without it the SDK uses virtual-hosted-style URLs
 * (bucket.host:9000) which MinIO does not support.
 */
export function createMinioClient(): S3Client {
  let endpoint = (process.env.MINIO_ENDPOINT || 'http://localhost:9000').replace(/"/g, '');
  if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    const port = (process.env.MINIO_PORT || '9000').replace(/"/g, '');
    endpoint = `http://${endpoint}:${port}`;
  }

  const accessKeyId = (process.env.MINIO_ROOT_USER || process.env.MINIO_ACCESS_KEY || 'ticketbox_admin').replace(/"/g, '');
  const secretAccessKey = (process.env.MINIO_ROOT_PASSWORD || process.env.MINIO_SECRET_KEY || 'ticketbox_secret_2026').replace(/"/g, '');

  return new S3Client({
    endpoint,
    region: 'us-east-1', // MinIO ignores region but the SDK requires a value
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true, // MANDATORY for MinIO — do not remove
  });
}
