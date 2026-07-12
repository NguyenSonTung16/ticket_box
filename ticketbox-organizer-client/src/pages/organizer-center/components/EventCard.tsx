import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface EventCardProps {
  title: string;
  date: string;
  location: string;
  image: string;
  status: 'selling' | 'draft' | 'CANCELLED';
  ticketsSold: number;
  totalTickets: number;
  id: number;
  onCancel?: (id: number) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  title,
  date,
  location,
  image,
  status,
  ticketsSold,
  totalTickets,
  id,
  onCancel,
}) => {
  const statusLabel = status === 'selling' ? 'Đang bán' : status === 'CANCELLED' ? 'Đã hủy' : 'Nháp';
  const statusClass =
    status === 'selling'
      ? 'bg-primary text-on-primary'
      : status === 'CANCELLED'
      ? 'bg-error text-on-error'
      : 'bg-outline-variant text-on-surface';

  const [imgError, setImgError] = useState(false);

  return (
    <div className="group bg-surface-container rounded-xl overflow-hidden flex flex-col sm:flex-row border border-transparent hover:border-primary/30 transition-all duration-300 ticket-notch">
      <Link to={`/event.html?id=${id}&preview=true`} className="sm:w-2/5 relative h-48 sm:h-auto overflow-hidden bg-surface-container-highest block">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={imgError ? 'https://images.unsplash.com/photo-1540039155733-d7696d487346?q=80&w=600&auto=format&fit=crop' : image}
          onError={() => setImgError(true)}
          alt={title}
        />
        <div
          className={`absolute top-4 left-4 ${statusClass} px-3 py-1 rounded text-[10px] font-bold`}
        >
          {statusLabel}
        </div>
      </Link>
      <div className="sm:w-3/5 p-6 flex flex-col justify-between">
        <Link to={`/event.html?id=${id}&preview=true`} className="block">
          <h3 className="text-lg font-headline-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span className="text-xs">{date}</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-4">
            <span className="material-symbols-outlined text-sm">location_on</span>
            <span className="text-xs">{location}</span>
          </div>
        </Link>
        <div className="flex items-center justify-between border-t border-outline-variant pt-4">
          <div className={`flex flex-col ${status === 'draft' ? 'opacity-50' : ''}`}>
            <span className="text-on-surface-variant text-[10px] uppercase font-bold">
              Vé đã bán
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-white font-bold">
                {ticketsSold.toLocaleString()}
              </span>
              <span className="text-on-surface-variant text-xs">
                / {totalTickets.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/organizer/stats/${id}`}
              className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-sm text-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">bar_chart</span>
              Thống kê
            </Link>
            {onCancel && status !== 'CANCELLED' && (
              <button
                onClick={() => onCancel(id)}
                className="px-3 py-1.5 bg-surface-container-high hover:bg-error/20 rounded-lg text-sm text-error transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                Hủy sự kiện
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
