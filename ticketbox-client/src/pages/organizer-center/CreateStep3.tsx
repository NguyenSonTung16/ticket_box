import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Stepper } from './components/Stepper';
import { eventService } from '../../features/events/eventService';

export const CreateStep3: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 3 (Backend): Slug & Privacy
  const [slug, setSlug] = useState('');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [seatingChartUrl, setSeatingChartUrl] = useState('');

  // Step 4 (Backend): Payment & VAT
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  
  const [vatBusinessType, setVatBusinessType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');
  const [vatFullName, setVatFullName] = useState('');
  const [vatAddress, setVatAddress] = useState('');
  const [vatTaxCode, setVatTaxCode] = useState('');

  const handleNext = async () => {
    if (!eventId) {
      setError('Không tìm thấy Event ID. Vui lòng quay lại bước 1.');
      return;
    }
    if (!slug || !bankAccountName || !bankAccountNumber || !bankName) {
      setError('Vui lòng điền đầy đủ Đường dẫn và thông tin tài khoản ngân hàng.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const id = parseInt(eventId);
      
      // Gọi Step 3 API (Slug & Privacy)
      await eventService.saveStep3(id, {
        slug,
        privacy,
        seating_chart_url: seatingChartUrl,
      });

      // Truyền dữ liệu Step 4 sang trang cuối cùng để Publish
      const bankInfo = {
        bank_account_name: bankAccountName,
        bank_account_number: bankAccountNumber,
        bank_name: bankName,
        bank_branch: bankBranch,
        vat_business_type: vatBusinessType,
        vat_full_name: vatFullName,
        vat_address: vatAddress,
        vat_tax_code: vatTaxCode,
      };

      navigate(`/organizer/create/step-4?eventId=${eventId}`, { state: { bankInfo } });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg:ml-64 pt-24 md:pt-28 pb-32 px-4 md:px-6 min-h-screen">
      <div className="max-w-[1000px] mx-auto">
        <Stepper currentStep={3} />

      {error && (
        <div className="bg-error-red/10 text-error-red px-4 py-3 mb-6 rounded-lg text-sm font-bold border border-error-red/20">
          {error}
        </div>
      )}

      <div className="bg-surface-container-low p-6 md:p-10 rounded-xl border border-outline-variant/30 text-sm mb-6">
        <h2 className="text-xl md:text-2xl font-headline-lg font-bold text-white mb-4">Thiết lập URL & Hiển thị</h2>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-40 flex-shrink-0 font-bold text-white sm:text-right">Đường dẫn sự kiện:</label>
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">ticketbox.vn/</span>
              <input type="text" className="w-full h-11 bg-white text-black pl-24 pr-4 rounded-md focus:outline-none" 
                     placeholder="ten-su-kien-123"
                     value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-40 flex-shrink-0 font-bold text-white sm:text-right">Trạng thái:</label>
            <div className="relative flex-1">
              <select className="w-full h-11 bg-white text-black px-4 rounded-md focus:outline-none appearance-none"
                      value={privacy} onChange={(e) => setPrivacy(e.target.value as 'PUBLIC' | 'PRIVATE')}>
                <option value="PUBLIC">Công khai (Ai cũng có thể xem)</option>
                <option value="PRIVATE">Riêng tư (Chỉ người có link)</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-40 flex-shrink-0 font-bold text-white sm:text-right">Sơ đồ vé:</label>
            <div className="relative flex-1 flex gap-2">
              <input type="text" className="flex-1 h-11 bg-white text-black px-4 rounded-md focus:outline-none" 
                     placeholder="URL sơ đồ vé (VD: /screenshot_seat.png)"
                     value={seatingChartUrl} onChange={(e) => setSeatingChartUrl(e.target.value)} />
              <button 
                type="button" 
                onClick={() => setSeatingChartUrl('/screenshot_seat.png')}
                className="px-4 py-2 bg-surface-container-high rounded text-sm text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                Dùng mặc định
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low p-6 md:p-10 rounded-xl border border-outline-variant/30 text-sm">
        <h2 className="text-xl md:text-2xl font-headline-lg font-bold text-white mb-4">Thông tin thanh toán</h2>
        <p className="text-on-surface-variant mb-1">Ticketbox sẽ chuyển tiền bán vé đến tài khoản của bạn</p>
        <p className="text-on-surface-variant mb-10 leading-relaxed">
          Tiền bán vé (sau khi trừ phí dịch vụ cho Ticketbox) sẽ vào tài khoản của bạn sau khi xác nhận sale report từ 7 - 10 ngày. Nếu bạn muốn nhận được tiền sớm hơn, vui lòng liên hệ chúng tôi qua số 1900.6408 hoặc info@ticketbox.vn
        </p>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-40 flex-shrink-0 font-bold text-white sm:text-right">Chủ tài khoản:</label>
            <div className="relative flex-1">
              <input type="text" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} className="w-full h-11 bg-white text-black px-4 pr-16 rounded-md focus:outline-none" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-40 flex-shrink-0 font-bold text-white sm:text-right">Số tài khoản:</label>
            <div className="relative flex-1">
              <input type="text" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} className="w-full h-11 bg-white text-black px-4 pr-16 rounded-md focus:outline-none" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-40 flex-shrink-0 font-bold text-white sm:text-right">Tên ngân hàng:</label>
            <div className="relative flex-1">
              <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full h-11 bg-white text-black px-4 pr-16 rounded-md focus:outline-none" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-40 flex-shrink-0 font-bold text-white sm:text-right">Chi nhánh:</label>
            <div className="relative flex-1">
              <input type="text" value={bankBranch} onChange={e => setBankBranch(e.target.value)} className="w-full h-11 bg-white text-black px-4 pr-16 rounded-md focus:outline-none" />
            </div>
          </div>
        </div>

        <h3 className="text-lg md:text-xl font-headline-lg font-bold text-white mt-12 mb-8">Hoá đơn đỏ</h3>
        
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-40 flex-shrink-0 font-bold text-white sm:text-right">Loại hình kinh doanh:</label>
            <div className="relative flex-1">
              <select value={vatBusinessType} onChange={(e) => setVatBusinessType(e.target.value as 'INDIVIDUAL' | 'COMPANY')} className="w-full h-11 bg-white text-black px-4 pr-12 rounded-md focus:outline-none appearance-none">
                <option value="INDIVIDUAL">Cá nhân</option>
                <option value="COMPANY">Doanh nghiệp</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-40 flex-shrink-0 font-bold text-white sm:text-right">Họ tên/Công ty:</label>
            <div className="relative flex-1">
              <input type="text" value={vatFullName} onChange={e => setVatFullName(e.target.value)} className="w-full h-11 bg-white text-black px-4 pr-16 rounded-md focus:outline-none" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-40 flex-shrink-0 font-bold text-white sm:text-right">Địa chỉ:</label>
            <div className="relative flex-1">
              <input type="text" value={vatAddress} onChange={e => setVatAddress(e.target.value)} className="w-full h-11 bg-white text-black px-4 pr-16 rounded-md focus:outline-none" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-40 flex-shrink-0 font-bold text-white sm:text-right">Mã số thuế:</label>
            <div className="relative flex-1">
              <input type="text" value={vatTaxCode} onChange={e => setVatTaxCode(e.target.value)} className="w-full h-11 bg-white text-black px-4 rounded-md focus:outline-none" />
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 lg:left-64 right-0 h-20 bg-surface-container border-t border-outline-variant/30 px-4 md:px-8 flex items-center justify-between z-40">
        <button
          onClick={() => navigate('/organizer/create/step-2')}
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
          {loading ? 'Đang lưu...' : 'Bước cuối cùng: Review'}
        </button>
      </footer>
    </div>
  );
};
