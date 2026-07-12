import React, { useState, useEffect, useRef } from 'react';
import { importService, ImportJob } from '../../features/import/importService';

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Animated progress bar shown for PENDING / PROCESSING jobs */
const ProgressBar: React.FC<{ processed: number; total: number }> = ({ processed, total }) => {
  const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : null;

  return (
    <div className="mt-2">
      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
        {pct !== null ? (
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        ) : (
          /* Indeterminate shimmer while totalRows not yet known */
          <div className="h-full w-1/2 bg-yellow-400/60 rounded-full animate-pulse" />
        )}
      </div>
      <p className="text-[10px] text-yellow-400/80 mt-0.5">
        {pct !== null ? `${pct}% (${processed.toLocaleString()} / ${total.toLocaleString()} dòng)` : 'Đang xử lý...'}
      </p>
    </div>
  );
};

/** Status badge with colour per status */
const StatusBadge: React.FC<{ status: ImportJob['status'] }> = ({ status }) => {
  const styles: Record<ImportJob['status'], string> = {
    COMPLETED:             'bg-primary/10 text-primary border-primary/20',
    COMPLETED_WITH_ERRORS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    PROCESSING:            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    PENDING:               'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    FAILED:                'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const labels: Record<ImportJob['status'], string> = {
    COMPLETED:             'Hoàn thành',
    COMPLETED_WITH_ERRORS: 'Xong (có lỗi)',
    PROCESSING:            'Đang xử lý',
    PENDING:               'Đang chờ',
    FAILED:                'Thất bại',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${styles[status] ?? 'bg-surface-container-highest text-on-surface-variant border-outline-variant'}`}>
      {labels[status] ?? status}
    </span>
  );
};

/** Inline error detail panel (toggled per-row) */
const ErrorPanel: React.FC<{ errors: ImportJob['errorDetails'] }> = ({ errors }) => {
  if (!errors || errors.length === 0) return null;
  return (
    <div className="mt-3 bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-xs max-h-48 overflow-y-auto">
      <p className="text-red-400 font-bold mb-2">{errors.length} dòng lỗi:</p>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-red-400/70 border-b border-red-500/20">
            <th className="pb-1 pr-3 font-semibold">Dòng</th>
            <th className="pb-1 pr-3 font-semibold">Ghế</th>
            <th className="pb-1 font-semibold">Lý do</th>
          </tr>
        </thead>
        <tbody>
          {errors.slice(0, 50).map((e, i) => (
            <tr key={i} className="border-b border-red-500/10 text-on-surface-variant">
              <td className="py-1 pr-3">{e.row}</td>
              <td className="py-1 pr-3">{e.seatNo || '—'}</td>
              <td className="py-1 text-red-400/80">{e.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {errors.length > 50 && (
        <p className="text-on-surface-variant mt-2">... và {errors.length - 50} lỗi khác</p>
      )}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export const FilesPage: React.FC = () => {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hardcode tạm thời (trong thực tế lấy từ AuthContext / URL params)
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
  }, []);

  useEffect(() => {
    const hasActiveJobs = jobs.some(j => j.status === 'PENDING' || j.status === 'PROCESSING');
    if (!hasActiveJobs) return;

    // Chỉ polling nếu có job đang xử lý
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [jobs]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      // Step 1: Lấy Pre-signed URL từ backend
      const { presignedUrl, objectKey } = await importService.getUploadUrl(SHOW_ID, SPONSOR_ID);

      // Step 2: Upload file thẳng lên MinIO (không qua backend server)
      await importService.uploadToMinIO(presignedUrl, file);

      // Step 3: Báo backend tạo import job (202 Accepted)
      await importService.triggerImport(objectKey, SHOW_ID, SPONSOR_ID);

      // Refresh danh sách ngay lập tức
      await fetchJobs();
    } catch (error: unknown) {
      console.error('Upload failed:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Có lỗi xảy ra khi upload file!\n${msg}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleErrors = (jobId: string) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      next.has(jobId) ? next.delete(jobId) : next.add(jobId);
      return next;
    });
  };

  const isActive = (status: ImportJob['status']) =>
    status === 'PENDING' || status === 'PROCESSING';

  const hasErrors = (job: ImportJob) =>
    job.status === 'FAILED' ||
    job.status === 'COMPLETED_WITH_ERRORS' ||
    (job.errorDetails && job.errorDetails.length > 0);

  return (
    <div className="flex-grow lg:ml-64 px-4 md:px-6 lg:px-10 pb-10 pt-24 md:pt-28 lg:pt-32">
      <div className="max-w-[1200px] mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl md:text-3xl font-headline-lg font-bold text-white mb-2">
            Quản lý file
          </h1>
          <p className="text-text-medium-emphasis">
            Đồng bộ danh sách khách mời VIP từ file CSV.
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
                id="csv-file-input"
              />
              <button
                id="csv-upload-btn"
                onClick={handleUploadClick}
                disabled={loading}
                className="px-4 sm:px-6 py-2 border border-primary text-primary rounded-lg font-bold hover:bg-primary/10 transition-all text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    Đang Upload...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    Upload .csv
                  </>
                )}
              </button>
              <button className="bg-primary text-on-primary px-4 sm:px-6 py-2 rounded-lg font-bold flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Xuất file báo cáo
              </button>
            </div>
          </div>
        </div>

        {/* Import Jobs Table */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-bold text-white">Lịch sử Import File Khách Mời VIP</h3>
            <div className="flex items-center gap-2">
              {jobs.some(j => isActive(j.status)) && (
                <span className="flex items-center gap-1 text-yellow-400 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" />
                  Đang xử lý
                </span>
              )}
              <span className="text-xs text-text-medium-emphasis">
                Hiển thị {jobs.length} kết quả gần nhất
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]" id="import-jobs-table">
              <thead>
                <tr className="bg-surface-container-high/50 border-b border-outline-variant">
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-text-medium-emphasis uppercase">Tên file</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-text-medium-emphasis uppercase">Ngày yêu cầu</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-text-medium-emphasis uppercase">Trạng thái</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-text-medium-emphasis uppercase text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-text-medium-emphasis text-sm">
                      <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">folder_open</span>
                      Chưa có file nào được upload
                    </td>
                  </tr>
                )}
                {jobs.map((job) => (
                  <React.Fragment key={job.id}>
                    <tr className="hover:bg-surface-container-highest/30 transition-colors">
                      {/* File info + progress bar */}
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-surface-container-highest rounded flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                            <span className="material-symbols-outlined">description</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white truncate" title={job.fileKey}>
                              {job.fileKey?.split('/').pop() ?? job.fileKey}
                            </p>
                            <p className="text-[10px] text-text-medium-emphasis mt-0.5">
                              {job.successCount.toLocaleString()} bản ghi hợp lệ
                              {job.errorCount > 0 && (
                                <span className="text-amber-400 ml-1">· {job.errorCount.toLocaleString()} lỗi</span>
                              )}
                            </p>

                            {/* Progress bar — only for active jobs */}
                            {isActive(job.status) && (
                              <ProgressBar
                                processed={job.processedRows}
                                total={job.totalRows}
                              />
                            )}

                            {/* Error panel (inline expand) */}
                            {expandedErrors.has(job.id) && (
                              <ErrorPanel errors={job.errorDetails} />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 md:px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                        {new Date(job.createdAt).toLocaleString('vi-VN')}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 md:px-6 py-4">
                        <StatusBadge status={job.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 md:px-6 py-4 text-right">
                        {hasErrors(job) ? (
                          <button
                            id={`view-errors-btn-${job.id}`}
                            onClick={() => toggleErrors(job.id)}
                            className="text-amber-400 hover:underline text-xs font-bold"
                          >
                            {expandedErrors.has(job.id) ? 'Ẩn lỗi' : 'Xem lỗi'}
                          </button>
                        ) : (
                          <button
                            className="text-primary/40 text-xs font-bold cursor-default"
                            disabled
                          >
                            Tải về
                          </button>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
