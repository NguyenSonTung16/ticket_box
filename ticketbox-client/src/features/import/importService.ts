import axiosClient from '../../utils/axiosClient';
import axios from 'axios';

export interface ImportJob {
  id: string;
  showId: string;
  sponsorId: string;
  fileKey: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED';
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errorDetails?: Array<{ row: number; seatNo: string; reason: string }>;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export const importService = {
  /** Lấy danh sách import jobs của một show (mới nhất trước). */
  listImports: async (showId: number | string): Promise<ImportJob[]> => {
    const response = await axiosClient.get(`/api/admin/imports?showId=${showId}`);
    return response.data;
  },

  /** Lấy trạng thái + tiến độ của một job (dùng cho polling). */
  getImportStatus: async (jobId: string): Promise<ImportJob> => {
    const response = await axiosClient.get(`/api/admin/imports/${jobId}`);
    return response.data;
  },

  /**
   * Lấy Pre-signed URL để upload file CSV trực tiếp lên MinIO.
   * Frontend upload thẳng lên MinIO, không qua backend server.
   */
  getUploadUrl: async (
    showId: number | string,
    sponsorId: number | string,
  ): Promise<{ presignedUrl: string; objectKey: string }> => {
    const response = await axiosClient.get(
      `/api/admin/guests/csv-upload-url?showId=${showId}&sponsorId=${sponsorId}`,
    );
    // Backend trả về: { presignedUrl, objectKey, expiresIn, maxSizeBytes }
    return {
      presignedUrl: response.data.presignedUrl,
      objectKey: response.data.objectKey,
    };
  },

  /** Upload file lên MinIO bằng presigned PUT URL (không đính kèm auth token). */
  uploadToMinIO: async (presignedUrl: string, file: File): Promise<void> => {
    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type || 'text/csv',
      },
    });
  },

  /**
   * Báo backend tạo import job sau khi upload MinIO thành công.
   * Returns 202 Accepted với { job_id, message }.
   *
   * Field names phải match TriggerImportDto của backend:
   *   fileKey (camelCase), showId, sponsorId
   */
  triggerImport: async (
    fileKey: string,
    showId: number | string,
    sponsorId: number | string,
  ): Promise<{ job_id: string; message: string }> => {
    const response = await axiosClient.post('/api/admin/guests/import', {
      fileKey,           // ✅ match backend TriggerImportDto (không phải file_key)
      showId: String(showId),
      sponsorId: String(sponsorId),
    });
    return response.data;
  },
};
