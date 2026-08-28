import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';
import { useAuth } from '../../context/AuthContext';

interface ScanLog {
  id: string;
  ticketId: string;
  concertId: string;
  seatInfo: string;
  deviceId: string;
  scannedAt: string;
  syncStatus: 'SUCCESS' | 'CONFLICT' | 'FAILED';
  isOffline: boolean;
}

const CONCERT_OPTIONS = [
  { id: '1', name: 'Anh Trai Say Hi - Live Concert' },
  { id: '2', name: 'Rap Việt All Star' },
  { id: '3', name: 'Đen Vâu - Show Của Đen' },
  { id: '4', name: 'Anh Trai "Say Hi" 2025' },
];

export const OrganizerCheckinHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Selected Concert
  const [selectedConcertId, setSelectedConcertId] = useState('1');

  // Logs state
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'CONFLICT'>('ALL');

  // Enforce access control: Organizer or Staff
  useEffect(() => {
    if (!user || (user.role !== 'ORGANIZER' && user.role !== 'CHECKIN_STAFF')) {
      alert('Bạn không có quyền truy cập trang lịch sử soát vé.');
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch logs
  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(`/checkin/history`, {
        params: {
          concertId: selectedConcertId,
          page,
          limit: 100, // Fetch more for local client-side filtering and rendering
        },
      });
      setLogs(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch checkin history:', err);
      setError(err.response?.data?.message || 'Không thể lấy dữ liệu lịch sử soát vé.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'ORGANIZER' || user.role === 'CHECKIN_STAFF')) {
      fetchLogs();
    }
  }, [selectedConcertId, page]);

  // Client-side filtration
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.seatInfo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.deviceId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || log.syncStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalScans = filteredLogs.length;
  const successScans = filteredLogs.filter(l => l.syncStatus === 'SUCCESS').length;
  const conflictScans = filteredLogs.filter(l => l.syncStatus === 'CONFLICT').length;
  const offlineScans = filteredLogs.filter(l => l.isOffline).length;

  return (
    <div className="flex-grow lg:ml-64 px-4 md:px-6 lg:px-10 pb-36 pt-24 md:pt-28 lg:pt-32 bg-[#0d0d0f] text-white font-sans min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">history</span>
              LỊCH SỬ SOÁT VÉ (CHECK-IN LOGS)
            </h1>
            <p className="text-text-medium-emphasis text-xs mt-1">
              Xem chi tiết toàn bộ lượt quét vé, trạng thái đồng bộ và thông tin thiết bị tại các cổng soát vé.
            </p>
          </div>

          {/* Refresh & Select Concert */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedConcertId}
              onChange={(e) => {
                setSelectedConcertId(e.target.value);
                setPage(1);
              }}
              className="bg-surface-container-high border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-white outline-none cursor-pointer focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              {CONCERT_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="bg-primary hover:brightness-110 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all shadow-md text-sm"
            >
              <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>sync</span>
              Làm mới
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 shadow-lg">
            <span className="text-xs text-white/50 block">Tổng lượt quét</span>
            <strong className="text-2xl font-bold block mt-1">{totalScans}</strong>
            <span className="text-[10px] text-white/30 block mt-0.5">Dữ liệu hiển thị</span>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 shadow-lg">
            <span className="text-xs text-emerald-400 block">Thành công (SUCCESS)</span>
            <strong className="text-2xl font-bold text-emerald-400 block mt-1">{successScans}</strong>
            <span className="text-[10px] text-emerald-400/50 block mt-0.5">Vé hợp lệ & hợp pháp</span>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 shadow-lg">
            <span className="text-xs text-amber-400 block">Xung đột (CONFLICT)</span>
            <strong className="text-2xl font-bold text-amber-400 block mt-1">{conflictScans}</strong>
            <span className="text-[10px] text-amber-400/50 block mt-0.5">Vé đã dùng hoặc giả mạo</span>
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-5 shadow-lg">
            <span className="text-xs text-indigo-400 block">Quét ngoại tuyến (Offline)</span>
            <strong className="text-2xl font-bold text-indigo-400 block mt-1">{offlineScans}</strong>
            <span className="text-[10px] text-indigo-400/50 block mt-0.5">Đồng bộ từ bộ nhớ tạm</span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 justify-between shadow-md">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm mã vé, số ghế, thiết bị..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 w-full text-xs text-white focus:outline-none focus:border-primary placeholder:text-white/30"
            />
          </div>

          {/* Status Filter Tab Buttons */}
          <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
            {(['ALL', 'SUCCESS', 'CONFLICT'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === filter
                    ? 'bg-primary text-white shadow'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                {filter === 'ALL' ? 'Tất cả' : filter === 'SUCCESS' ? 'Hợp lệ' : 'Xung đột'}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {isLoading ? (
            <div className="text-center py-20 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-white/50">Đang tải danh sách lịch sử soát vé...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-400 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[40px]">warning</span>
              <p className="text-sm font-semibold">{error}</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20 text-white/30 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[40px]">history</span>
              <p className="text-sm font-semibold">Không tìm thấy lượt quét vé nào.</p>
              <p className="text-xs text-white/20">Hãy kiểm tra các bộ lọc hoặc tiến hành quét vé thử nghiệm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-xs text-white/60 uppercase font-bold tracking-wider">
                    <th className="px-6 py-4">Mã Vé (Ticket ID)</th>
                    <th className="px-6 py-4">Thông tin ghế</th>
                    <th className="px-6 py-4">Thiết bị quét</th>
                    <th className="px-6 py-4 text-center">Phương thức</th>
                    <th className="px-6 py-4">Thời gian quét</th>
                    <th className="px-6 py-4 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-white/90">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono select-all text-white/80">
                        {log.ticketId}
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        {log.seatInfo}
                      </td>
                      <td className="px-6 py-4 text-white/70">
                        {log.deviceId}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${log.isOffline
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                          {log.isOffline ? 'Offline' : 'Online'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60">
                        {new Date(log.scannedAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-block ${log.syncStatus === 'SUCCESS'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : log.syncStatus === 'CONFLICT'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/15 text-red-400 border border-red-500/20'
                          }`}>
                          {log.syncStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
