import React, { useState, useEffect, useRef } from 'react';
import { importService, ImportJob } from '../../features/import/importService';

export const FilesPage: React.FC = () => {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hardcode tạm thời (Trong thực tế sẽ lấy từ Context hoặc URL params)
  const SHOW_ID = 1;
  const SPONSOR_ID = 1;

  const fetchJobs = async () => {
    try {
      const data = await importService.listImports(SHOW_ID);
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    }
  };

  useEffect(() => {
    fetchJobs();
    
    // Polling định kỳ mỗi 5s để cập nhật trạng thái PROCESSING
    const interval = setInterval(() => {
      fetchJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      
      // 1. Lấy Pre-signed URL
      const { upload_url, file_key } = await importService.getUploadUrl(SHOW_ID, SPONSOR_ID);
      
      // 2. Upload file trực tiếp lên MinIO
      await importService.uploadToMinIO(upload_url, file);

      // 3. Kích hoạt trigger Import (Tạo job cho Worker xử lý)
      await importService.triggerImport(file_key, SHOW_ID, SPONSOR_ID);

      // Fetch lại danh sách ngay lập tức
      await fetchJobs();
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Có lỗi xảy ra khi upload file!');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  return (
    <div className="flex-grow lg:ml-64 px-4 md:px-6 lg:px-10 pb-10 pt-24 md:pt-28 lg:pt-32">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl md:text-3xl font-headline-lg font-bold text-white mb-2">
            Quản lý file
          </h1>
          <p className="text-text-medium-emphasis">
            Lưu trữ và tổ chức các báo cáo dữ liệu của bạn.
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 md:p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                className="w-full bg-surface-container-high border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-primary focus:border-primary outline-none"
                placeholder="Tìm kiếm file .csv..."
                type="text"
              />
            </div>
            <div className="flex gap-3 sm:gap-4">
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <button 
                onClick={handleUploadClick}
                disabled={loading}
                className="px-4 sm:px-6 py-2 border border-primary text-primary rounded-lg font-bold hover:bg-primary/10 transition-all text-sm disabled:opacity-50"
              >
                {loading ? 'Đang Upload...' : 'Upload .csv'}
              </button>
              <button className="bg-primary text-on-primary px-4 sm:px-6 py-2 rounded-lg font-bold flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Xuất file báo cáo
              </button>
            </div>
          </div>
        </div>

        {/* Files Table */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-bold text-white">Lịch sử Import File Khách Mời</h3>
            <span className="text-xs text-text-medium-emphasis">
              Hiển thị các kết quả gần nhất
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="bg-surface-container-high/50 border-b border-outline-variant">
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-text-medium-emphasis uppercase">
                    Tên file
                  </th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-text-medium-emphasis uppercase">
                    Ngày yêu cầu
                  </th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-text-medium-emphasis uppercase">
                    Trạng thái
                  </th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-text-medium-emphasis uppercase text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-surface-container-highest/30 transition-colors">
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-surface-container-highest rounded flex items-center justify-center text-primary flex-shrink-0">
                          <span className="material-symbols-outlined">description</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate" title={job.file_key}>
                            {job.file_key.split('/').pop()}
                          </p>
                          <p className="text-[10px] text-text-medium-emphasis">
                            {job.success_count} / {job.total_records} bản ghi hợp lệ
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm text-on-surface-variant">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                        job.status === 'COMPLETED'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : job.status === 'PROCESSING' || job.status === 'PENDING'
                          ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <button className="text-primary hover:underline text-xs font-bold" disabled={job.status !== 'FAILED'} style={{ opacity: job.status !== 'FAILED' ? 0.5 : 1 }} title={job.status === 'FAILED' ? JSON.stringify(job.error_details) : 'Tải log chi tiết'}>
                        {job.status === 'FAILED' ? 'Xem lỗi' : 'Tải về'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
