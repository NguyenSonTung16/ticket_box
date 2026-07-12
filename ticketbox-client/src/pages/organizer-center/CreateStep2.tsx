import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Stepper } from './components/Stepper';
import { TicketModal } from './components/TicketModal';
import { eventService, TicketTypeData } from '../../features/events/eventService';

export const CreateStep2: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State quản lý vé và thời gian
  const [startTime, setStartTime] = useState('');
  const [ticketTypes, setTicketTypes] = useState<TicketTypeData[]>([]);

  useEffect(() => {
    if (eventId) {
      const loadDraft = async () => {
        try {
          const draft = await eventService.getDraft(Number(eventId));
          if (draft.step_2) {
            if (draft.step_2.start_time) {
              const date = new Date(draft.step_2.start_time);
              const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                                      .toISOString().slice(0, 16);
              setStartTime(localDateTime);
            }
            if (draft.step_2.ticket_types && draft.step_2.ticket_types.length > 0) {
              setTicketTypes(draft.step_2.ticket_types);
            }
          }
        } catch (err) {
          console.error("Failed to load draft:", err);
        }
      };
      loadDraft();
    }
  }, [eventId]);

  const totalTicketTypes = ticketTypes.length;
  const totalTickets = ticketTypes.reduce((sum, type) => sum + type.total_quantity, 0);

  const handleSaveTicket = (ticket: TicketTypeData) => {
    setTicketTypes([...ticketTypes, ticket]);
    setIsModalOpen(false);
  };

  const handleRemoveTicket = (index: number) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    if (!eventId) {
      setError('Không tìm thấy Event ID, vui lòng quay lại bước 1');
      return;
    }
    if (!startTime) {
      setError('Vui lòng chọn thời gian bắt đầu sự kiện');
      return;
    }
    if (ticketTypes.length === 0) {
      setError('Vui lòng tạo ít nhất 1 loại vé');
      return;
    }

    try {
      setLoading(true);
      setError('');
      // Gửi string theo chuẩn ISO cho NestJS (hoặc parse ngày tùy thuộc backend)
      const isoTime = new Date(startTime).toISOString();
      await eventService.saveStep2(parseInt(eventId), {
        start_time: isoTime,
        ticket_types: ticketTypes
      });
      navigate(`/organizer/create/step-3?eventId=${eventId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg:ml-64 pt-24 md:pt-28 pb-32 px-4 md:px-6 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <Stepper currentStep={2} />

      {error && (
        <div className="bg-error-red/10 text-error-red px-4 py-3 mb-6 rounded-lg text-sm font-bold border border-error-red/20">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-headline-lg font-bold text-white mb-2">
            Cấu hình loại vé
          </h1>
          <p className="text-on-surface-variant text-sm">
            Tạo các hạng vé khác nhau để phù hợp với nhu cầu.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-5 md:px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-md hover:brightness-110 transition-all text-sm"
        >
          <span className="material-symbols-outlined">add</span>
          Thêm loại vé mới
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Ticket list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface-container p-4 md:p-6 rounded-xl border border-outline-variant/20 mb-6">
            <h3 className="font-bold text-white mb-4">Lịch trình</h3>
            <div>
              <label className="block text-xs font-bold text-text-medium-emphasis mb-2 uppercase">
                Thời gian mở cửa (Start Time) <span className="text-error-red">*</span>
              </label>
              <input
                className="w-full h-11 px-4 bg-input-level-2 border border-outline-variant rounded-lg text-white focus:ring-primary outline-none"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>
          
          <h3 className="font-bold text-white mt-8 mb-4">Danh sách hạng vé</h3>
          {ticketTypes.length === 0 && (
             <div className="text-center py-8 text-on-surface-variant bg-surface-container rounded-xl border border-dashed border-outline-variant/30">
               Chưa có loại vé nào. Vui lòng thêm loại vé mới.
             </div>
          )}
          {ticketTypes.map((ticket, index) => (
            <div key={index} className="bg-surface-container p-4 md:p-6 rounded-xl border border-outline-variant/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined">local_activity</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">{ticket.name}</h4>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Số lượng: {ticket.total_quantity} •{' '}
                    <span className="text-primary">
                      {ticket.is_free ? 'Miễn phí' : 'Có phí'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 md:gap-8 w-full sm:w-auto justify-between sm:justify-end">
                <div className="hidden sm:block">
                  <p className="text-xs text-on-surface-variant mb-1">Giá vé</p>
                  <p className="font-bold text-white">
                    {ticket.price.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRemoveTicket(index)} className="p-2 text-on-surface-variant hover:text-error-red transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-lowest p-6 md:p-8 rounded-xl border border-outline-variant/20">
            <h3 className="text-lg font-headline-lg font-bold text-white mb-6">
              Tổng quan vé
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                <span className="text-on-surface-variant text-sm">Tổng số hạng vé</span>
                <span className="font-bold text-white">
                  {totalTicketTypes.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-on-surface-variant text-sm">Tổng số vé</span>
                <span className="font-bold text-white">{totalTickets}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>

      {/* Modal */}
      <TicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTicket} />

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 lg:left-64 right-0 h-20 bg-surface-container border-t border-outline-variant/30 px-4 md:px-8 flex items-center justify-between z-40">
        <button
          onClick={() => navigate('/organizer/create/step-1')}
          className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors text-sm"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Quay lại
        </button>
        <button
          onClick={handleNext}
          disabled={loading}
          className={`px-6 md:px-8 py-3 rounded-xl font-bold shadow-md transition-all text-sm ${
            loading ? 'bg-surface-container-high text-text-medium-emphasis cursor-not-allowed' : 'bg-primary text-on-primary neon-glow hover:brightness-110'
          }`}
        >
          {loading ? 'Đang lưu...' : 'Bước tiếp theo: Tùy chỉnh URL'}
        </button>
      </footer>
    </div>
  );
};
