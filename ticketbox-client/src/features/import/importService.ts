import axiosClient from '../../utils/axiosClient';
import axios from 'axios';

export interface ImportJob {
  id: string;
  show_id: number;
  sponsor_id: number;
  file_key: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  total_records: number;
  processed_records: number;
  success_count: number;
  error_count: number;
  error_details?: any[];
  created_at: string;
  updated_at: string;
}

export const importService = {
  // Lấy danh sách các bản ghi import của một sự kiện
  listImports: async (showId: number): Promise<ImportJob[]> => {
    const response = await axiosClient.get(`/api/admin/imports?showId=${showId}`);
    return response.data;
  },

  // Xem chi tiết một job import
  getImportStatus: async (jobId: string): Promise<ImportJob> => {
    const response = await axiosClient.get(`/api/admin/imports/${jobId}`);
    return response.data;
  },

  // Lấy URL upload trực tiếp lên MinIO (Pre-signed URL)
  getUploadUrl: async (showId: number, sponsorId: number): Promise<{ upload_url: string; file_key: string }> => {
    const response = await axiosClient.get(`/api/admin/guests/csv-upload-url?showId=${showId}&sponsorId=${sponsorId}`);
    return response.data;
  },

  // Upload file lên MinIO bằng URL được cấp
  uploadToMinIO: async (presignedUrl: string, file: File): Promise<void> => {
    // Dùng axios mặc định (không đính kèm token auth) để put file lên S3/MinIO
    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type || 'text/csv',
      },
    });
  },

  // Kích hoạt worker bắt đầu xử lý file CSV đã upload
  triggerImport: async (fileKey: string, showId: number, sponsorId: number): Promise<{ job_id: string; message: string }> => {
    const response = await axiosClient.post('/api/admin/guests/import', {
      file_key: fileKey,
      show_id: showId,
      sponsor_id: sponsorId,
    });
    return response.data;
  },
};
