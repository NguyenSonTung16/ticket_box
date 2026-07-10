import React, { useState } from 'react';
import { TicketTypeData } from '../../../features/events/eventService';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ticket: TicketTypeData) => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name) {
      setError('Vui lòng nhập tên loại vé');
      return;
    }
    const parsedPrice = parseInt(price) || 0;
    const parsedQuantity = parseInt(quantity) || 0;
    
    if (parsedQuantity <= 0) {
      setError('Số lượng phải lớn hơn 0');
      return;
    }

    onSave({
      name,
      price: parsedPrice,
      total_quantity: parsedQuantity,
      is_free: parsedPrice === 0
    });
    
    // Reset form
    setName('');
    setPrice('');
    setQuantity('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-container w-full max-w-2xl rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-6 md:px-8 py-6 flex justify-between items-center border-b border-outline-variant/20">
          <h2 className="text-xl font-headline-lg font-bold">Cấu hình loại vé mới</h2>
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
              Tên loại vé <span className="text-error-red">*</span>
            </label>
            <input
              className="w-full h-11 px-4 bg-surface-container-high border border-outline-variant/30 rounded-lg text-white focus:ring-primary focus:border-primary outline-none"
              placeholder="VD: Vé VIP sớm..."
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Giá (VNĐ)</label>
              <input
                className="w-full h-11 px-4 bg-surface-container-high border border-outline-variant/30 rounded-lg text-white focus:ring-primary focus:border-primary outline-none"
                placeholder="0 cho vé miễn phí"
                type="number"
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
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
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
            Lưu loại vé
          </button>
        </div>
      </div>
    </div>
  );
};
