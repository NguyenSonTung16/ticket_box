import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import { useAuth } from '../context/AuthContext';

export const AdminApprovalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search input
  const [searchId, setSearchId] = useState('1'); // defaults to seeded concert ID

  // Bio state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bio, setBio] = useState<{
    id: string;
    concertId: number;
    shortBio: string;
    mediumBio: string;
    seoBio: string;
    status: string;
    createdAt?: string;
  } | null>(null);

  // Edit fields
  const [shortBioEdit, setShortBioEdit] = useState('');
  const [mediumBioEdit, setMediumBioEdit] = useState('');
  const [seoBioEdit, setSeoBioEdit] = useState('');

  // Submit status
  const [isApproving, setIsApproving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Check auth - redirect if not admin or organizer
  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'ORGANIZER')) {
      alert('Bạn không có quyền truy cập trang kiểm duyệt.');
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch bio details
  const handleFetchBio = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchId) return;

    setIsLoading(true);
    setError(null);
    setBio(null);
    setMessage(null);

    try {
      const res = await axiosClient.get(`/artist/bio/${searchId}`);
      if (res.data.status && res.data.status !== 'COMPLETED') {
        // If it's a job, it hasn't generated the bio yet
        setError(`Dữ liệu đang được xử lý bởi AI. Trạng thái Job hiện tại: ${res.data.status}`);
      } else {
        setBio(res.data);
        setShortBioEdit(res.data.shortBio || '');
        setMediumBioEdit(res.data.mediumBio || '');
        setSeoBioEdit(res.data.seoBio || '');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tìm thấy thông tin tiểu sử nghệ sĩ hoặc Job nào.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch default bio on load
  useEffect(() => {
    handleFetchBio();
  }, []);

  // Approve bio
  const handleApproveBio = async () => {
    if (!bio) return;

    setIsApproving(true);
    setMessage(null);

    try {
      const res = await axiosClient.put(`/artist/bio/${bio.id || searchId}/approve`, {
        shortBio: shortBioEdit,
        mediumBio: mediumBioEdit,
        seoBio: seoBioEdit
      });

      setBio({
        ...bio,
        shortBio: shortBioEdit,
        mediumBio: mediumBioEdit,
        seoBio: seoBioEdit,
        status: 'APPROVED'
      });

      setMessage('Đã phê duyệt tiểu sử nghệ sĩ thành công! Nội dung đã được xuất bản trực tiếp lên MongoDB và trang sự kiện.');
    } catch (err: any) {
      alert(`Phê duyệt thất bại: ${err.response?.data?.message || 'Lỗi server.'}`);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white p-6 font-sans">
      
      {/* Header bar */}
      <header className="flex justify-between items-center pb-6 border-b border-white/10 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 hover:text-primary transition-colors text-sm">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Trang chủ
          </button>
          <div className="h-6 w-[1px] bg-white/20"></div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            TRUNG TÂM KIỂM DUYỆT TIỂU SỬ NGHỆ SĨ (AI BIO MODERATION)
          </h1>
        </div>
        <span className="bg-white/10 px-3 py-1 rounded-full text-xs text-white/80">
          Tài khoản: <strong className="text-white">{user?.email}</strong>
        </span>
      </header>

      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        {/* Search bar card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleFetchBio} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-xs text-white/60 block mb-1">Nhập Mã Concert, Job ID, hoặc Bio ID</label>
              <input 
                type="text" 
                value={searchId} 
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Ví dụ: 1..."
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 w-full text-sm text-white focus:outline-none focus:border-primary"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-primary hover:brightness-110 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              Tra cứu
            </button>
          </form>
        </div>

        {/* Message alerts */}
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm flex gap-2 items-start">
            <span className="material-symbols-outlined">check_circle</span>
            <span>{message}</span>
          </div>
        )}

        {/* Status display */}
        {isLoading && (
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-white/60">Đang tìm kiếm dữ liệu từ hệ thống...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex gap-2 items-start">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Main Review Card */}
        {bio && !isLoading && (
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
            
            {/* Bio Metadata Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <div>
                <h3 className="text-lg font-bold">Concert ID: {bio.concertId}</h3>
                <p className="text-xs text-white/40 mt-0.5">Khởi tạo: {bio.createdAt ? new Date(bio.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                bio.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {bio.status === 'APPROVED' ? 'Đã Xuất Bản (APPROVED)' : 'Chờ Phê Duyệt (PENDING REVIEW)'}
              </span>
            </div>

            {/* Inputs */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-white/60 block mb-1">Short Bio (Ngắn - Dùng cho preview)</label>
                <textarea 
                  value={shortBioEdit} 
                  onChange={(e) => setShortBioEdit(e.target.value)}
                  rows={2}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Medium Bio (Bản Vừa - Sẽ hiển thị chính thức trên trang mua vé)</label>
                <textarea 
                  value={mediumBioEdit} 
                  onChange={(e) => setMediumBioEdit(e.target.value)}
                  rows={6}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">SEO Bio (Tối ưu hóa công cụ tìm kiếm)</label>
                <textarea 
                  value={seoBioEdit} 
                  onChange={(e) => setSeoBioEdit(e.target.value)}
                  rows={3}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button 
                onClick={() => navigate('/')} 
                className="bg-white/10 hover:bg-white/15 px-6 py-2.5 rounded-xl font-bold transition-all text-sm"
              >
                Hủy bỏ
              </button>
              
              <button 
                onClick={handleApproveBio} 
                disabled={isApproving}
                className="bg-primary hover:brightness-110 disabled:opacity-50 text-white font-bold py-2.5 px-8 rounded-xl flex items-center gap-2 transition-all shadow-md text-sm"
              >
                <span className="material-symbols-outlined text-[20px]">{isApproving ? 'sync' : 'publish'}</span>
                {isApproving ? 'Đang xuất bản...' : 'DUYỆT & ĐĂNG TẢI'}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
