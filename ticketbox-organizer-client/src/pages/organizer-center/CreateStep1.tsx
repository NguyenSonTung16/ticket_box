import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Stepper } from './components/Stepper';
import { eventService, EventData } from '../../features/events/eventService';
import { ArtistSelect } from './components/ArtistSelect';

export const CreateStep1: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existingEventId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Image upload states
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States cho form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Âm nhạc');
  const [addressType, setAddressType] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [venueName, setVenueName] = useState('');
  const [province, setProvince] = useState('');
  const [description, setDescription] = useState('');
  const [artistIds, setArtistIds] = useState<string[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [existingAttachmentUrls, setExistingAttachmentUrls] = useState<string[]>([]);

  // Giả lập organizer (trong thực tế có thể lấy từ UserProfile API)
  const organizer_name = 'TicketBox Organizer';

  useEffect(() => {
    if (existingEventId) {
      const loadDraft = async () => {
        try {
          const draft = await eventService.getDraft(Number(existingEventId));
          if (draft.step_1) {
            setName(draft.step_1.name || '');
            setCategory(draft.step_1.category || 'Âm nhạc');
            setAddressType(draft.step_1.address_type || 'OFFLINE');
            setVenueName(draft.step_1.venue_name || '');
            setProvince(draft.step_1.province || '');
            setDescription(draft.step_1.description || '');
            setArtistIds(draft.step_1.artist_ids || []);
            setExistingAttachmentUrls(draft.step_1.attachment_urls || []);
            if (draft.step_1.cover_image_url) {
              setCoverImagePreview(draft.step_1.cover_image_url);
            }
          }
        } catch (error) {
          console.error("Failed to load draft", error);
        }
      };
      loadDraft();
    }
  }, [existingEventId]);

  const handleNext = async () => {
    if (!name || !venueName || !province) {
      setError('Vui lòng điền các trường bắt buộc (*)');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      // Bước 0: Khởi tạo draft lấy ID hoặc dùng ID có sẵn
      const event_id = existingEventId ? Number(existingEventId) : (await eventService.createDraft()).event_id;
      
      let finalCoverImageUrl = '';

      // Upload ảnh cover nếu có thay đổi
      if (coverImageFile) {
        const ext = coverImageFile.name.split('.').pop() || 'jpg';
        const { presignedUrl } = await eventService.getImageUploadUrl(event_id, 'cover_image_url', ext);
        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          body: coverImageFile,
          headers: { 'Content-Type': coverImageFile.type },
        });
        if (!uploadRes.ok) throw new Error(`Upload ảnh cover thất bại: ${uploadRes.statusText}`);
        finalCoverImageUrl = presignedUrl.split('?')[0];
      }
      
      // Upload các ảnh đính kèm mới
      const newAttachmentUrls: string[] = [];
      for (let i = 0; i < attachmentFiles.length; i++) {
        const file = attachmentFiles[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const { presignedUrl } = await eventService.getImageUploadUrl(event_id, `attachment_${Date.now()}_${i}`, ext);
        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        if (!uploadRes.ok) throw new Error(`Upload ảnh đính kèm thất bại: ${uploadRes.statusText}`);
        newAttachmentUrls.push(presignedUrl.split('?')[0]);
      }
      
      const allAttachmentUrls = [...existingAttachmentUrls, ...newAttachmentUrls];

      // Bước 1: Lưu thông tin
      const step1Data: EventData = {
        name,
        category,
        address_type: addressType,
        venue_name: venueName,
        province,
        organizer_name,
        description,
        artist_ids: artistIds,
        attachment_urls: allAttachmentUrls,
        ...(finalCoverImageUrl && {
          cover_image_url: finalCoverImageUrl,
          image_url: finalCoverImageUrl,
        })
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

          {/* Thông tin chi tiết */}
          <section className="bg-card-level-1 rounded-xl border border-outline-variant">
            <div className="px-4 md:px-6 py-4 border-b border-outline-variant">
              <h2 className="text-lg md:text-xl font-headline-lg font-bold text-on-surface">
                Thông tin chi tiết
              </h2>
            </div>
            <div className="p-4 md:p-6">
              <label className="block text-xs font-bold text-text-medium-emphasis mb-2 uppercase">
                Mô tả sự kiện
              </label>
              <textarea
                className="w-full h-32 px-4 py-3 border border-outline-variant rounded-lg bg-input-level-2 text-on-surface outline-none resize-y"
                placeholder="Nhập thông tin chi tiết về sự kiện của bạn..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </section>

          {/* Nghệ sĩ tham gia */}
          <section className="bg-card-level-1 rounded-xl border border-outline-variant">
            <div className="px-4 md:px-6 py-4 border-b border-outline-variant">
              <h2 className="text-lg md:text-xl font-headline-lg font-bold text-on-surface">
                Lineup / Nghệ sĩ tham gia
              </h2>
            </div>
            <div className="p-4 md:p-6">
              <label className="block text-xs font-bold text-text-medium-emphasis mb-2 uppercase">
                Chọn nghệ sĩ (có thể chọn nhiều)
              </label>
              <ArtistSelect value={artistIds} onChange={setArtistIds} />
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
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg, image/png, image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      setError('Kích thước ảnh tối đa là 5MB');
                      return;
                    }
                    setError('');
                    setCoverImageFile(file);
                    setCoverImagePreview(URL.createObjectURL(file));
                  }
                }}
              />
              <div 
                className="relative group cursor-pointer border-2 border-dashed border-outline-variant rounded-xl h-48 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-all bg-input-level-2 overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {coverImagePreview ? (
                  <img src={coverImagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-4xl text-text-medium-emphasis">
                      add_photo_alternate
                    </span>
                    <p className="text-xs text-primary font-bold">Tải ảnh lên</p>
                    <p className="text-[10px] text-text-medium-emphasis mt-1">Khuyến nghị: 16:9, Tối đa 5MB</p>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="bg-card-level-1 rounded-xl border border-outline-variant overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-outline-variant">
              <h2 className="text-lg md:text-xl font-headline-lg font-bold text-on-surface">
                Hình ảnh đính kèm (Tối đa 5)
              </h2>
            </div>
            <div className="p-4 md:p-6">
              <input 
                type="file" 
                multiple
                className="hidden" 
                accept="image/jpeg, image/png, image/webp"
                id="attachments-upload"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const total = existingAttachmentUrls.length + attachmentFiles.length + files.length;
                  if (total > 5) {
                    setError('Chỉ được chọn tối đa 5 ảnh đính kèm.');
                    return;
                  }
                  setAttachmentFiles(prev => [...prev, ...files]);
                }}
              />
              <div className="grid grid-cols-2 gap-4 mb-4">
                {existingAttachmentUrls.map((url, i) => (
                  <div key={`existing-${i}`} className="relative group rounded overflow-hidden aspect-video border border-outline-variant">
                    <img src={url} alt={`Attachment ${i}`} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      className="absolute top-2 right-2 bg-error-red text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setExistingAttachmentUrls(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
                {attachmentFiles.map((file, i) => (
                  <div key={`new-${i}`} className="relative group rounded overflow-hidden aspect-video border border-outline-variant">
                    <img src={URL.createObjectURL(file)} alt={`New Attachment ${i}`} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      className="absolute top-2 right-2 bg-error-red text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setAttachmentFiles(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
              {(existingAttachmentUrls.length + attachmentFiles.length) < 5 && (
                <label 
                  htmlFor="attachments-upload"
                  className="cursor-pointer flex items-center justify-center gap-2 h-11 px-4 border border-outline-variant rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-sm font-bold text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  Thêm ảnh đính kèm
                </label>
              )}
            </div>
          </section>

          <section className="bg-card-level-1 rounded-xl border border-outline-variant overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-outline-variant">
              <h2 className="text-lg md:text-xl font-headline-lg font-bold text-on-surface">
                Hình ảnh đính kèm (Tối đa 5)
              </h2>
            </div>
            <div className="p-4 md:p-6">
              <input 
                type="file" 
                multiple
                className="hidden" 
                accept="image/jpeg, image/png, image/webp"
                id="attachments-upload"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const total = existingAttachmentUrls.length + attachmentFiles.length + files.length;
                  if (total > 5) {
                    setError('Chỉ được chọn tối đa 5 ảnh đính kèm.');
                    return;
                  }
                  setAttachmentFiles(prev => [...prev, ...files]);
                }}
              />
              <div className="grid grid-cols-2 gap-4 mb-4">
                {existingAttachmentUrls.map((url, i) => (
                  <div key={`existing-${i}`} className="relative group rounded overflow-hidden aspect-video border border-outline-variant">
                    <img src={url} alt={`Attachment ${i}`} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      className="absolute top-2 right-2 bg-error-red text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setExistingAttachmentUrls(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
                {attachmentFiles.map((file, i) => (
                  <div key={`new-${i}`} className="relative group rounded overflow-hidden aspect-video border border-outline-variant">
                    <img src={URL.createObjectURL(file)} alt={`New Attachment ${i}`} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      className="absolute top-2 right-2 bg-error-red text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setAttachmentFiles(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
              {(existingAttachmentUrls.length + attachmentFiles.length) < 5 && (
                <label 
                  htmlFor="attachments-upload"
                  className="cursor-pointer flex items-center justify-center gap-2 h-11 px-4 border border-outline-variant rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-sm font-bold text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  Thêm ảnh đính kèm
                </label>
              )}
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
