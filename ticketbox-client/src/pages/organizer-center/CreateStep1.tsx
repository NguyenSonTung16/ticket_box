import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stepper } from './components/Stepper';
import { eventService, EventData } from '../../features/events/eventService';

export const CreateStep1: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // States cho form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Âm nhạc');
  const [addressType, setAddressType] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [venueName, setVenueName] = useState('');
  const [province, setProvince] = useState('');
  // Giả lập organizer (trong thực tế có thể lấy từ UserProfile API)
  const organizer_name = 'TicketBox Organizer';

  const handleNext = async () => {
    if (!name || !venueName || !province) {
      setError('Vui lòng điền các trường bắt buộc (*)');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      // Bước 0: Khởi tạo draft lấy ID
      const { event_id } = await eventService.createDraft();
      
      // Bước 1: Lưu thông tin
      const step1Data: EventData = {
        name,
        category,
        address_type: addressType,
        venue_name: venueName,
        province,
        organizer_name
      };
      
      await eventService.saveStep1(event_id, step1Data);
      
      // Thành công, chuyển sang step 2 với eventId
      navigate(`/organizer/create/step-2?eventId=${event_id}`);
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
        <Stepper currentStep={1} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-2 flex flex-col gap-6 lg:gap-8">
          {/* Thông tin cơ bản */}
          <section className="bg-card-level-1 rounded-xl border border-outline-variant overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-outline-variant">
              <h2 className="text-lg md:text-xl font-headline-lg font-bold text-on-surface">
                Thông tin cơ bản
              </h2>
            </div>
            {error && (
              <div className="bg-error-red/10 text-error-red px-4 py-3 mx-4 mt-4 rounded-lg text-sm font-bold border border-error-red/20">
                {error}
              </div>
            )}
            <div className="p-4 md:p-6 flex flex-col gap-6">
              <div>
                <label className="block text-xs font-bold text-text-medium-emphasis mb-2 uppercase">
                  Tên sự kiện <span className="text-error-red">*</span>
                </label>
                <input
                  className="w-full h-11 px-4 border border-outline-variant rounded-lg bg-input-level-2 text-on-surface focus:ring-primary focus:border-primary outline-none"
                  placeholder="Nhập tên sự kiện hấp dẫn của bạn"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-text-medium-emphasis mb-2 uppercase">
                    Thể loại
                  </label>
                  <select 
                    className="w-full h-11 px-4 border border-outline-variant rounded-lg bg-input-level-2 text-on-surface focus:ring-primary outline-none"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Âm nhạc">Âm nhạc</option>
                    <option value="Thể thao">Thể thao</option>
                    <option value="Hội thảo">Hội thảo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-medium-emphasis mb-2 uppercase">
                    Hashtag
                  </label>
                  <input
                    className="w-full h-11 px-4 border border-outline-variant rounded-lg bg-input-level-2 text-on-surface focus:ring-primary outline-none"
                    placeholder="#music #concert"
                    type="text"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Thời gian & Địa điểm */}
          <section className="bg-card-level-1 rounded-xl border border-outline-variant overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-outline-variant">
              <h2 className="text-lg md:text-xl font-headline-lg font-bold text-on-surface">
                Thời gian & Địa điểm
              </h2>
            </div>
            <div className="p-4 md:p-6 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-text-medium-emphasis mb-2 uppercase">
                    Hình thức
                  </label>
                  <select 
                    className="w-full h-11 px-4 border border-outline-variant rounded-lg bg-input-level-2 text-on-surface outline-none"
                    value={addressType}
                    onChange={(e) => setAddressType(e.target.value as 'OFFLINE'|'ONLINE')}
                  >
                    <option value="OFFLINE">Offline (Trực tiếp)</option>
                    <option value="ONLINE">Online (Trực tuyến)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-medium-emphasis mb-2 uppercase">
                    Thành phố / Tỉnh <span className="text-error-red">*</span>
                  </label>
                  <input
                    className="w-full h-11 px-4 border border-outline-variant rounded-lg bg-input-level-2 text-on-surface outline-none"
                    placeholder="VD: TP. Hồ Chí Minh"
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-medium-emphasis mb-2 uppercase">
                  Địa điểm cụ thể <span className="text-error-red">*</span>
                </label>
                <input
                  className="w-full h-11 px-4 border border-outline-variant rounded-lg bg-input-level-2 text-on-surface outline-none"
                  placeholder="Nhà thi đấu Quân Khu 7..."
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right: Image upload */}
        <div className="flex flex-col gap-6 lg:gap-8">
          <section className="bg-card-level-1 rounded-xl border border-outline-variant overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-outline-variant">
              <h2 className="text-lg md:text-xl font-headline-lg font-bold text-on-surface">
                Hình ảnh sự kiện
              </h2>
            </div>
            <div className="p-4 md:p-6">
              <div className="relative group cursor-pointer border-2 border-dashed border-outline-variant rounded-xl h-48 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-all bg-input-level-2">
                <span className="material-symbols-outlined text-4xl text-text-medium-emphasis">
                  add_photo_alternate
                </span>
                <p className="text-xs text-primary font-bold">Tải ảnh lên</p>
              </div>
            </div>
          </section>
        </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="fixed bottom-0 left-0 right-0 lg:left-64 bg-card-level-1 border-t border-outline-variant shadow-2xl z-40">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <button className="flex items-center gap-2 text-text-medium-emphasis font-semibold text-sm hover:text-white transition-colors">
            <span className="material-symbols-outlined text-base">save</span>
            Lưu bản nháp
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className={`h-11 px-6 md:px-8 font-bold rounded-lg text-sm flex items-center gap-2 shadow-lg transition-all ${
              loading ? 'bg-surface-container-high text-text-medium-emphasis cursor-not-allowed' : 'bg-primary text-on-primary shadow-primary/20 hover:brightness-110'
            }`}
          >
            {loading ? 'Đang lưu...' : 'Bước tiếp theo'}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
