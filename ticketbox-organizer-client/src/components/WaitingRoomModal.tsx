import React, { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';

interface WaitingRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  concertId: number | string;
  onSuccess: () => void;
}

export const WaitingRoomModal: React.FC<WaitingRoomModalProps> = ({
  isOpen,
  onClose,
  concertId,
  onSuccess,
}) => {
  const [status, setStatus] = useState<'IDLE' | 'WAITING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [position, setPosition] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('Đang kiểm tra tình trạng hàng đợi...');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setStatus('IDLE');
      setPosition(null);
      return;
    }

    let isMounted = true;
    let timer: any = null;

    const checkQueue = async () => {
      try {
        const res = await axiosClient.post('/booking/enter-queue', {
          concert_id: Number(concertId),
        });

        if (!isMounted) return;

        if (res.data.status === 'SUCCESS') {
          setStatus('SUCCESS');
          setMessage('Chúc mừng! Bạn đã vào phòng chọn ghế. Đang chuyển hướng...');
          if (timer) clearInterval(timer);
          setTimeout(() => {
            if (isMounted) onSuccess();
          }, 1200);
        } else if (res.data.status === 'WAITING') {
          setStatus('WAITING');
          setPosition(res.data.position);
          setMessage(res.data.message || 'Phòng chọn ghế đang đầy. Vui lòng giữ trình duyệt...');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('ERROR');
        setErrorMessage(
          err.response?.data?.message || 'Có lỗi xảy ra khi kiểm tra hàng đợi. Vui lòng thử lại.'
        );
        if (timer) clearInterval(timer);
      }
    };

    // Gọi lần đầu ngay lập tức
    checkQueue();

    // Polling định kỳ mỗi 3 giây
    timer = setInterval(checkQueue, 3000);

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
    };
  }, [isOpen, concertId, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity animate-fadeIn p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-b from-surface-container-high to-surface-container border border-white/10 p-8 shadow-2xl text-center">
        
        {/* Glowing Background Effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        {/* Close Button (Only show if Error or Manual exit needed) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        {/* Content Section */}
        <div className="relative z-10 flex flex-col items-center space-y-6">
          {status === 'WAITING' || status === 'IDLE' ? (
            <>
              {/* Spinner & Queue Icon */}
              <div className="relative flex items-center justify-center w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-4xl animate-pulse">group</span>
                </div>
              </div>

              {/* Position Display */}
              {position !== null && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 w-full">
                  <p className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold mb-1">
                    Vị trí của bạn trong hàng đợi
                  </p>
                  <p className="text-4xl font-extrabold text-primary animate-bounce">
                    #{position}
                  </p>
                </div>
              )}

              {/* Message */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Phòng Chờ Ảo TicketBox</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Warning Notice */}
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3.5 py-2.5 rounded-lg w-full text-left">
                <span className="material-symbols-outlined text-sm shrink-0">info</span>
                <span>Vui lòng không tắt hoặc làm mới trang web để giữ nguyên vị trí xếp hàng.</span>
              </div>
            </>
          ) : status === 'SUCCESS' ? (
            <>
              {/* Success Icon */}
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-2 animate-bounce">
                <span className="material-symbols-outlined text-5xl">check_circle</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Đến Lượt Bạn!</h3>
              <p className="text-sm text-green-300">
                {message}
              </p>
            </>
          ) : (
            <>
              {/* Error State */}
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 text-red-400 mb-2">
                <span className="material-symbols-outlined text-4xl">error</span>
              </div>
              <h3 className="text-xl font-bold text-white">Không Thể Tham Gia</h3>
              <p className="text-sm text-red-300">
                {errorMessage}
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Đóng và thử lại
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
