import React, { useState } from 'react';
import { ZoneData } from '../../../features/events/eventService';

interface ZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (zone: ZoneData) => void;
}

export const TicketModal: React.FC<ZoneModalProps> = ({ isOpen, onClose, onSave }) => {
  const [zoneName, setZoneName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [ticketLimit, setTicketLimit] = useState('4');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!zoneName.trim()) {
      setError('Vui lòng nhập tên hạng vé');
      return;
    }
    const parsedPrice = parseInt(price) || 0;
    const parsedQuantity = parseInt(quantity) || 0;
    const parsedLimit = parseInt(ticketLimit) || 4;

    if (parsedQuantity <= 0) {
      setError('Số lượng phải lớn hơn 0');
      return;
    }
    if (parsedLimit <= 0) {
      setError('Giới hạn vé/đơn phải lớn hơn 0');
      return;
    }

    onSave({
      zone: zoneName.trim(),
      price: parsedPrice,
      totalCapacity: parsedQuantity,
      ticketLimit: parsedLimit,
    });

    // Reset form
    setZoneName('');
    setPrice('');
    setQuantity('');
    setTicketLimit('4');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-container w-full max-w-2xl rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-6 md:px-8 py-6 flex justify-between items-center border-b border-outline-variant/20">
          <h2 className="text-xl font-headline-lg font-bold">Thêm hạng vé mới</h2>
          <button
            onClick={onClose}
            className="material-symbols-outlined p-2 hover:bg-surface-variant rounded-full transition-colors"
          >
            close
          </button>
        </div>
        <div className="p-6 md:p-8 space-y-6">
          {error && <p className="text-error-red text-sm font-bold">{error}</p>}
          <div>
            <label className="block text-sm font-bold mb-2">
              Tên hạng vé / khu vực <span className="text-error-red">*</span>
            </label>
            <input
              className="w-full h-11 px-4 bg-surface-container-high border border-outline-variant/30 rounded-lg text-white focus:ring-primary focus:border-primary outline-none"
              placeholder="VD: VIP, Normal, SVIP..."
              type="text"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Giá vé (VNĐ)</label>
              <input
                className="w-full h-11 px-4 bg-surface-container-high border border-outline-variant/30 rounded-lg text-white focus:ring-primary focus:border-primary outline-none"
                placeholder="0 cho vé miễn phí"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Số lượng <span className="text-error-red">*</span></label>
              <input
                className="w-full h-11 px-4 bg-surface-container-high border border-outline-variant/30 rounded-lg text-white focus:ring-primary focus:border-primary outline-none"
                placeholder="100"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                Giới hạn vé/đơn <span className="text-error-red">*</span>
              </label>
              <input
                className="w-full h-11 px-4 bg-surface-container-high border border-outline-variant/30 rounded-lg text-white focus:ring-primary focus:border-primary outline-none"
                placeholder="4"
                type="number"
                min="1"
                max="20"
                value={ticketLimit}
                onChange={(e) => setTicketLimit(e.target.value)}
              />
              <p className="text-xs text-on-surface-variant mt-1">Tối đa vé/đơn hàng (mặc định: 4)</p>
            </div>
          </div>
        </div>
        <div className="p-6 md:p-8 border-t border-outline-variant/20 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="bg-primary text-on-primary px-8 py-2.5 rounded-lg font-bold hover:brightness-110 transition-all"
          >
            Lưu hạng vé
          </button>
        </div>
      </div>
    </div>
  );
};
