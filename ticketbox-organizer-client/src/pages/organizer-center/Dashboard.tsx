import React, { useState, useEffect } from 'react';
import { EventCard } from './components/EventCard';
import { eventService } from '../../features/events/eventService';

export const OrganizerDashboard: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'published' | 'draft' | 'cancelled'>('all');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  useEffect(() => {
    eventService.getOrganizerEvents().then(data => {
      setEvents(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const filters = [
    { key: 'all' as const, label: 'Tất cả' },
    { key: 'published' as const, label: 'Đã đăng' },
    { key: 'draft' as const, label: 'Bản nháp' },
    { key: 'cancelled' as const, label: 'Đã xóa' },
  ];

  const handleCancel = (id: number) => {
    setCancelingId(id);
  };

  const confirmCancel = async () => {
    if (!cancelingId) return;
    try {
      await eventService.cancelEvent(cancelingId);
      alert('Hủy sự kiện thành công');
      setEvents(events.map(e => e.id === cancelingId ? { ...e, status: 'CANCELLED' } : e));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi hủy sự kiện');
    } finally {
      setCancelingId(null);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (activeFilter === 'cancelled') return event.status === 'CANCELLED';
    if (event.status === 'CANCELLED') return false;
    
    if (activeFilter === 'all') return true;
    if (activeFilter === 'published') return event.status === 'selling';
    if (activeFilter === 'draft') return event.status === 'draft';
    return true;
  });

  return (
    <div className="flex-grow lg:ml-64 px-4 md:px-6 lg:px-10 pb-10 pt-24 md:pt-28 lg:pt-32">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-headline-lg font-bold text-white mb-2">
              Sự kiện của tôi
            </h1>
            <p className="text-text-medium-emphasis">
              Quản lý và theo dõi các trải nghiệm trực tiếp sắp tới của bạn.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                className="w-full bg-input-level-2 border border-outline-variant rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white"
                placeholder="Tìm kiếm sự kiện..."
                type="text"
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-colors ${
                activeFilter === f.key
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Event Cards Grid */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-text-medium-emphasis">Đang tải dữ liệu sự kiện...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredEvents.map((event) => (
              <EventCard 
                key={event.id}
                id={event.id}
                title={event.name}
                date={new Date(event.date).toLocaleDateString('vi-VN')}
                location={event.venue_name}
                image={event.image_url}
                status={event.status}
                ticketsSold={event.tickets_sold ?? 0}
                totalTickets={event.total_tickets ?? 0}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}

        {!loading && filteredEvents.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-text-medium-emphasis mb-4 block">
              event_busy
            </span>
            <p className="text-text-medium-emphasis">Không tìm thấy sự kiện nào.</p>
          </div>
        )}

        {/* Custom Confirm Modal */}
        {cancelingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface-container-high rounded-2xl p-6 max-w-sm w-full border border-outline-variant shadow-xl">
              <h3 className="text-xl font-bold text-white mb-2">Hủy sự kiện</h3>
              <p className="text-on-surface-variant mb-6">Bạn có chắc chắn muốn hủy sự kiện này? Hành động này không thể hoàn tác.</p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setCancelingId(null)}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-on-surface hover:bg-surface-container-highest transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={confirmCancel}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-error text-on-error hover:brightness-110 transition-colors"
                >
                  Xác nhận hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
