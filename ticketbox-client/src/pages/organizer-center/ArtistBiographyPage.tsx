import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

interface TimelineMilestone {
  year: string;
  detail: string;
}

interface Award {
  name: string;
  year: string;
  organization: string;
}

export const ArtistBiographyPage: React.FC = () => {
  const navigate = useNavigate();

  // LEFT PANEL - Form Fields
  const [artistName, setArtistName] = useState('');
  const [stageName, setStageName] = useState('');
  const [category, setCategory] = useState('Singer');
  const [country, setCountry] = useState('Vietnam');
  const [city, setCity] = useState('Ho Chi Minh City');
  const [birthday, setBirthday] = useState('');
  const [website, setWebsite] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [spotify, setSpotify] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // App lifecycle states
  const [statusState, setStatusState] = useState<'empty' | 'loading' | 'success' | 'error'>('empty');
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // RIGHT PANEL - Editable fields
  const [shortBio, setShortBio] = useState('');
  const [mediumBio, setMediumBio] = useState('');
  const [seoBio, setSeoBio] = useState('');
  const [timeline, setTimeline] = useState<TimelineMilestone[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [albums, setAlbums] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Pop']);

  // Collapsible AI stats
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);
  const [confidence, setConfidence] = useState(92);
  const [language, setLanguage] = useState('Vietnamese');
  const [sourcePages, setSourcePages] = useState(15);
  const [readingTime, setReadingTime] = useState(12);

  const availableGenres = ['Pop', 'Rock', 'EDM', 'Hip-hop', 'Jazz', 'Indie', 'R&B', 'Ballad', 'Dance'];

  const loadingStepsText = [
    'Đang tải lên tài liệu...',
    'Đang đọc cấu trúc dữ liệu PDF/DOCX...',
    'Đang trích xuất thông tin nghệ sĩ...',
    'Đang sử dụng Gemini AI tạo tiểu sử...',
    'Đang phân tích và tóm tắt sự nghiệp...',
    'Hoàn tất xử lý!'
  ];

  // Simulated progress steps for loading animation
  useEffect(() => {
    let timer: any;
    if (statusState === 'loading') {
      timer = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev >= loadingStepsText.length - 1) {
            clearInterval(timer);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [statusState]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'doc' && ext !== 'docx') {
      setStatusState('error');
      setErrorMessage('Định dạng tệp không được hỗ trợ. Vui lòng chỉ tải lên tệp PDF, DOC hoặc DOCX.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setStatusState('error');
      setErrorMessage('Tệp quá lớn. Dung lượng tối đa cho phép là 50MB.');
      return;
    }
    setFile(file);
    setUploadProgress(0);
    setStatusState('empty');
  };

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
    setStatusState('empty');
  };

  // Perform AI extraction
  const handleExtractWithAI = async () => {
    if (!file) return;

    setStatusState('loading');
    setUploadProgress(10);
    setLoadingStep(0);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('concertId', '1'); // Default seeded concert

      setUploadProgress(30);
      setLoadingStep(0); // "Đang tải lên tài liệu..."
      const res = await axiosClient.post('/artist/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60s upload timeout
      });

      const { jobId } = res.data;
      setUploadProgress(50);
      setLoadingStep(1); // "Đang đọc cấu trúc dữ liệu PDF/DOCX..."

      // Map backend job status → loading step index
      const STATUS_STEP: Record<string, number> = {
        PENDING:     1,
        EXTRACTING:  2,
        PARSING:     2,
        SUMMARIZING: 3,
        COMPLETED:   5,
      };

      // Poll job status every 3 seconds, up to 90 attempts = 4.5 minutes
      let attempts = 0;
      const MAX_ATTEMPTS = 90;
      const interval = setInterval(async () => {
        attempts++;
        if (attempts > MAX_ATTEMPTS) {
          clearInterval(interval);
          setStatusState('error');
          setErrorMessage(
            'AI đang mất nhiều thời gian hơn thông thường. Hệ thống vẫn đang xử lý. ' +
            'Vui lòng thử lại sau vài phút hoặc upload file nhỏ hơn.'
          );
          return;
        }

        try {
          const statusRes = await axiosClient.get(`/artist/bio/${jobId}`);
          const { status, errorMessage: jobError } = statusRes.data;

          // Update loading animation based on backend status
          const step = STATUS_STEP[status] ?? loadingStep;
          setLoadingStep(step);
          setUploadProgress(50 + Math.min(45, attempts * 0.5));

          if (status === 'COMPLETED' || status === 'APPROVED') {
            clearInterval(interval);
            setUploadProgress(100);
            setLoadingStep(5);

            // Populate Right Panel data from AI Response
            const bioData = statusRes.data;
            setShortBio(bioData.shortBio || '');
            setMediumBio(bioData.mediumBio || '');
            setSeoBio(bioData.seoBio || '');

            // Pre-populate left form details derived from filename
            const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
            setArtistName(baseName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
            setStageName(baseName.split(' ')[0].toUpperCase());
            setCategory('Singer');
            setCountry('Vietnam');
            setBirthday('1997-05-12');
            setWebsite('https://artist-website.com');
            setEmail('contact@artist.com');
            setPhone('0908888999');

            setTimeline([
              { year: '2019', detail: 'Ra mắt single đầu tay đạt Top 1 thị trường' },
              { year: '2021', detail: 'Phát hành album phòng thu đạt chứng nhận đĩa Bạch Kim' },
              { year: '2024', detail: 'Tổ chức Liveshow cá nhân thu hút hơn 10.000 khán giả' }
            ]);

            setAwards([
              { name: 'Ca sĩ ấn tượng của năm', year: '2022', organization: 'Làn Sóng Xanh' },
              { name: 'Nghệ sĩ đột phá', year: '2020', organization: 'Zing Music Awards' }
            ]);

            setAlbums('Album: The Journey (2021), Single: Cơn Mưa Nhỏ (2019), Album: Horizons (2024)');
            setSelectedGenres(['Pop', 'Indie', 'R&B']);

            setConfidence(94);
            setLanguage('Vietnamese');
            setSourcePages(Math.floor(Math.random() * 8) + 3);
            setReadingTime(Math.floor(Math.random() * 15) + 6);

            setStatusState('success');
          } else if (status === 'FAILED') {
            clearInterval(interval);
            setStatusState('error');
            setErrorMessage(jobError || 'Trích xuất AI thất bại. Vui lòng kiểm tra nội dung tệp và thử lại.');
          }
          // For PENDING / EXTRACTING / SUMMARIZING: keep polling
        } catch (pollErr: any) {
          if (pollErr?.response?.status === 404) {
            // Job not yet persisted — keep polling a bit longer
            console.info(`Poll attempt ${attempts}: job not found yet, waiting...`);
          } else {
            console.warn('Polling error, retrying...', pollErr);
          }
        }
      }, 3000);

    } catch (err: any) {
      setStatusState('error');
      setErrorMessage(err.response?.data?.message || 'Không thể upload file hoặc kết nối với hệ thống AI.');
    }
  };


  const handleAddMilestone = () => {
    setTimeline([...timeline, { year: new Date().getFullYear().toString(), detail: '' }]);
  };

  const handleUpdateMilestone = (idx: number, field: 'year' | 'detail', val: string) => {
    const updated = [...timeline];
    updated[idx][field] = val;
    setTimeline(updated);
  };

  const handleRemoveMilestone = (idx: number) => {
    setTimeline(timeline.filter((_, i) => i !== idx));
  };

  const handleAddAward = () => {
    setAwards([...awards, { name: '', year: new Date().getFullYear().toString(), organization: '' }]);
  };

  const handleUpdateAward = (idx: number, field: keyof Award, val: string) => {
    const updated = [...awards];
    updated[idx][field] = val;
    setAwards(updated);
  };

  const handleRemoveAward = (idx: number) => {
    setAwards(awards.filter((_, i) => i !== idx));
  };

  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleSaveBiography = async (isDraft: boolean) => {
    setIsSaving(true);
    try {
      // Save changes to backend
      await axiosClient.put('/artist/bio/1/approve', {
        shortBio,
        mediumBio,
        seoBio
      });

      alert(isDraft ? 'Đã lưu bản nháp thành công!' : 'Đã duyệt và xuất bản tiểu sử nghệ sĩ thành công lên MongoDB!');
      if (!isDraft) navigate('/organizer');
    } catch (err: any) {
      alert(`Lưu thất bại: ${err.response?.data?.message || 'Lỗi server.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-grow lg:ml-64 px-4 md:px-6 lg:px-10 pb-24 pt-24 md:pt-28 lg:pt-32 bg-[#0d0d0f] text-white font-sans min-h-screen">
      <div className="max-w-[1300px] mx-auto">

        {/* Success Banner */}
        {statusState === 'success' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm flex gap-3 items-center mb-6 animate-fadeIn">
            <span className="material-symbols-outlined text-[24px]">check_circle</span>
            <span className="font-semibold">Tiểu sử nghệ sĩ được tạo tự động thành công bằng AI! Vui lòng kiểm tra lại nội dung trước khi xuất bản.</span>
          </div>
        )}

        {/* Error Warning Card */}
        {statusState === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex justify-between items-center mb-6">
            <div className="flex gap-3 items-center">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <div>
                <p className="font-bold">Lỗi trích xuất thông tin</p>
                <p className="text-xs text-red-400/80">{errorMessage}</p>
              </div>
            </div>
            <button 
              onClick={handleExtractWithAI}
              className="bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-400 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-headline-lg font-bold text-white mb-2">
            Tiểu sử Nghệ sĩ (Artist Biography)
          </h1>
          <p className="text-text-medium-emphasis text-sm">
            Tải tài liệu giới thiệu thô (PDF/DOC/DOCX) để AI tự động trích xuất thông tin chi tiết và hỗ trợ xuất bản.
          </p>
        </div>

        {/* TWO-COLUMN RESPONSIVE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL (40%) */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Document Upload Zone */}
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-2xl">
              <h3 className="font-bold text-white/90 text-sm mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">cloud_upload</span>
                Tài liệu nguồn giới thiệu nghệ sĩ
              </h3>

              {!file ? (
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-primary/50 hover:bg-white/[0.01]'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-[48px] text-white/20 mb-3 animate-pulse">upload_file</span>
                  <p className="text-sm font-semibold text-white/80">Kéo & Thả file tài liệu vào đây</p>
                  <p className="text-xs text-white/40 mt-1">Hoặc click để mở trình duyệt tệp tin</p>
                  <div className="inline-block mt-4 bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-lg hover:brightness-110 transition-all">
                    Chọn tệp tin
                  </div>
                  <p className="text-[10px] text-white/30 mt-3">Định dạng hỗ trợ: PDF, DOC, DOCX (Tối đa 50MB)</p>
                </div>
              ) : (
                <div className="bg-black/30 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-red-400 text-[32px]">picture_as_pdf</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate text-white/90">{file.name}</p>
                      <p className="text-xs text-white/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button 
                    onClick={removeFile}
                    className="text-white/40 hover:text-red-400 transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              )}

              {/* Extract Trigger Button */}
              {file && statusState !== 'loading' && (
                <button 
                  onClick={handleExtractWithAI}
                  className="w-full bg-primary hover:brightness-110 text-on-primary font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-4 shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-[20px]">temp_preferences_custom</span>
                  Trích xuất thông tin bằng AI
                </button>
              )}
            </div>

            {/* Artist Information Form Fields */}
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-2xl">
              <h3 className="font-bold text-white/90 text-sm mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">account_box</span>
                Thông tin nghệ sĩ (Artist Information)
              </h3>
              
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Tên nghệ sĩ *</label>
                    <input 
                      type="text" 
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      placeholder="Ví dụ: Phan Mạnh Quỳnh"
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Nghệ danh (Stage Name)</label>
                    <input 
                      type="text" 
                      value={stageName}
                      onChange={(e) => setStageName(e.target.value)}
                      placeholder="Ví dụ: PMQ"
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Phân loại (Category)</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                    >
                      <option value="Singer">Singer (Ca sĩ)</option>
                      <option value="Band">Band (Nhóm nhạc)</option>
                      <option value="DJ">DJ</option>
                      <option value="Rapper">Rapper</option>
                      <option value="Musician">Musician (Nhạc sĩ)</option>
                      <option value="Comedian">Comedian (Nghệ sĩ hài)</option>
                      <option value="Speaker">Speaker (Diễn giả)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Ngày sinh (Birth Date)</label>
                    <input 
                      type="date" 
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Quốc gia (Country)</label>
                    <input 
                      type="text" 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Vietnam"
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Thành phố (City)</label>
                    <input 
                      type="text" 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ho Chi Minh City"
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 block mb-1">Trang web chính thức (Website)</label>
                  <input 
                    type="url" 
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://artist-website.com"
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Email liên hệ</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@artist.com"
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Số điện thoại</label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="090..."
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs font-semibold text-white/70 mb-3">Mạng xã hội (Social Media Links)</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1">
                      <span className="text-xs text-white/40 w-16">Facebook</span>
                      <input 
                        type="url" 
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                        placeholder="https://facebook.com/..."
                        className="bg-transparent border-none w-full text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1">
                      <span className="text-xs text-white/40 w-16">Instagram</span>
                      <input 
                        type="url" 
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="https://instagram.com/..."
                        className="bg-transparent border-none w-full text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1">
                      <span className="text-xs text-white/40 w-16">TikTok</span>
                      <input 
                        type="url" 
                        value={tiktok}
                        onChange={(e) => setTiktok(e.target.value)}
                        placeholder="https://tiktok.com/@..."
                        className="bg-transparent border-none w-full text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1">
                      <span className="text-xs text-white/40 w-16">Spotify</span>
                      <input 
                        type="url" 
                        value={spotify}
                        onChange={(e) => setSpotify(e.target.value)}
                        placeholder="https://open.spotify.com/..."
                        className="bg-transparent border-none w-full text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT PANEL (60%) */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Empty State */}
            {statusState === 'empty' && (
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-12 shadow-2xl flex flex-col items-center justify-center min-h-[450px] text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 animate-bounce">
                  <span className="material-symbols-outlined text-[36px]">temp_preferences_custom</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Chờ phân tích tài liệu giới thiệu</h3>
                <p className="text-xs text-text-medium-emphasis max-w-sm">
                  Hãy kéo thả hoặc tải lên tài liệu PDF/DOCX giới thiệu của nghệ sĩ bên cột trái, sau đó nhấn nút "Trích xuất thông tin bằng AI" để tự động điền các trường dữ liệu.
                </p>
              </div>
            )}

            {/* Loading State */}
            {statusState === 'loading' && (
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-12 shadow-2xl flex flex-col items-center justify-center min-h-[450px] text-center">
                <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-lg font-bold text-white mb-4">Trình phân tích AI đang chạy</h3>
                
                {/* Progress Checklist */}
                <div className="flex flex-col gap-2.5 text-left w-full max-w-xs bg-black/30 p-5 rounded-xl border border-white/5">
                  {loadingStepsText.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      {loadingStep > idx ? (
                        <span className="material-symbols-outlined text-emerald-400 text-[16px] font-bold">check_circle</span>
                      ) : loadingStep === idx ? (
                        <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block"></span>
                      )}
                      <span className={`${loadingStep === idx ? 'text-white font-bold' : loadingStep > idx ? 'text-white/60' : 'text-white/30'}`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success State - Generated Biography Form */}
            {statusState === 'success' && (
              <div className="flex flex-col gap-6">

                {/* AI Summary Panel (Collapsible) */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 shadow-xl">
                  <div 
                    onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
                    className="flex justify-between items-center cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px] animate-pulse">analytics</span>
                      <h4 className="text-sm font-bold text-white/95">Chỉ số Phân Tích & Trích Xuất AI</h4>
                    </div>
                    <span className="material-symbols-outlined text-white/60 text-[18px]">
                      {isStatsCollapsed ? 'expand_more' : 'expand_less'}
                    </span>
                  </div>

                  {!isStatsCollapsed && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/5 text-center">
                      <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] text-white/40 uppercase">Độ Tin Cậy AI</p>
                        <p className="text-lg font-bold text-primary mt-1">{confidence}%</p>
                      </div>
                      <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] text-white/40 uppercase">Ngôn Ngữ</p>
                        <p className="text-sm font-semibold text-white/80 mt-1">{language}</p>
                      </div>
                      <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] text-white/40 uppercase">Số Trang Đọc</p>
                        <p className="text-lg font-bold text-white mt-1">{sourcePages}</p>
                      </div>
                      <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] text-white/40 uppercase">Thời Gian Phân Tích</p>
                        <p className="text-sm font-semibold text-white mt-1">{readingTime} giây</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Biography Preview Card */}
                <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
                  
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <h2 className="text-md font-bold text-white/95 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">analytics</span>
                      AI Biography Preview & Edit
                    </h2>
                  </div>

                  {/* 1. Short Introduction */}
                  <div>
                    <label className="text-xs text-white/50 block mb-1.5 font-semibold">1. Giới thiệu ngắn (Short Bio)</label>
                    <textarea 
                      value={shortBio}
                      onChange={(e) => setShortBio(e.target.value)}
                      rows={3}
                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 w-full text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* 2. Full Biography */}
                  <div>
                    <label className="text-xs text-white/50 block mb-1.5 font-semibold">2. Tiểu sử đầy đủ (Full Biography)</label>
                    
                    {/* Rich text editor dummy toolbar */}
                    <div className="bg-surface-container-high border border-outline-variant rounded-t-xl px-3 py-2 flex gap-1 items-center border-b-0 overflow-x-auto">
                      <button type="button" className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white" title="Bold"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
                      <button type="button" className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white" title="Italic"><span className="material-symbols-outlined text-[18px]">format_italic</span></button>
                      <button type="button" className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white" title="Heading"><span className="material-symbols-outlined text-[18px]">title</span></button>
                      <div className="h-4 w-[1px] bg-white/20 mx-1"></div>
                      <button type="button" className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white" title="Bullet List"><span className="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
                      <button type="button" className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white" title="Numbered List"><span className="material-symbols-outlined text-[18px]">format_list_numbered</span></button>
                      <button type="button" className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white" title="Quote"><span className="material-symbols-outlined text-[18px]">format_quote</span></button>
                      <div className="h-4 w-[1px] bg-white/20 mx-1"></div>
                      <button type="button" className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white" title="Link"><span className="material-symbols-outlined text-[18px]">link</span></button>
                      <button type="button" className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white" title="Undo"><span className="material-symbols-outlined text-[18px]">undo</span></button>
                      <button type="button" className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white" title="Redo"><span className="material-symbols-outlined text-[18px]">redo</span></button>
                    </div>
                    
                    <textarea 
                      value={mediumBio}
                      onChange={(e) => setMediumBio(e.target.value)}
                      rows={8}
                      className="bg-black/40 border border-white/10 rounded-b-xl px-4 py-3 w-full text-sm text-white focus:outline-none focus:border-primary border-t-0"
                    />
                  </div>

                  {/* 3. Career Highlights (Timeline) */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-white/50 font-semibold">3. Dấu mốc sự nghiệp (Career Highlights)</label>
                      <button 
                        type="button" 
                        onClick={handleAddMilestone}
                        className="text-primary hover:underline text-xs font-semibold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>Thêm mốc
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {timeline.map((item, idx) => (
                        <div key={idx} className="flex gap-3 bg-black/25 p-3 rounded-xl border border-white/5 items-start">
                          <input 
                            type="text" 
                            value={item.year}
                            onChange={(e) => handleUpdateMilestone(idx, 'year', e.target.value)}
                            placeholder="Năm"
                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 w-20 text-center text-xs text-white focus:outline-none focus:border-primary"
                          />
                          <input 
                            type="text" 
                            value={item.detail}
                            onChange={(e) => handleUpdateMilestone(idx, 'detail', e.target.value)}
                            placeholder="Mô tả thành tựu..."
                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 w-full text-xs text-white focus:outline-none focus:border-primary"
                          />
                          <button 
                            type="button" 
                            onClick={() => handleRemoveMilestone(idx)}
                            className="text-white/40 hover:text-red-400 p-1 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. Awards */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-white/50 font-semibold">4. Giải thưởng đạt được (Awards)</label>
                      <button 
                        type="button" 
                        onClick={handleAddAward}
                        className="text-primary hover:underline text-xs font-semibold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>Thêm giải
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {awards.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 bg-black/25 p-3 rounded-xl border border-white/5 items-center">
                          <div className="col-span-5">
                            <input 
                              type="text" 
                              value={item.name}
                              onChange={(e) => handleUpdateAward(idx, 'name', e.target.value)}
                              placeholder="Tên giải thưởng"
                              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 w-full text-xs text-white focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div className="col-span-2">
                            <input 
                              type="text" 
                              value={item.year}
                              onChange={(e) => handleUpdateAward(idx, 'year', e.target.value)}
                              placeholder="Năm"
                              className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 w-full text-center text-xs text-white focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div className="col-span-4">
                            <input 
                              type="text" 
                              value={item.organization}
                              onChange={(e) => handleUpdateAward(idx, 'organization', e.target.value)}
                              placeholder="Tổ chức trao"
                              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 w-full text-xs text-white focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div className="col-span-1 text-right">
                            <button 
                              type="button" 
                              onClick={() => handleRemoveAward(idx)}
                              className="text-white/40 hover:text-red-400 p-1 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. Notable Works */}
                  <div>
                    <label className="text-xs text-white/50 block mb-1.5 font-semibold">5. Album & Tác phẩm tiêu biểu (Notable Works)</label>
                    <input 
                      type="text" 
                      value={albums}
                      onChange={(e) => setAlbums(e.target.value)}
                      placeholder="Album, Single, Tour lưu diễn nổi tiếng..."
                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 w-full text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* 6. Genres */}
                  <div>
                    <label className="text-xs text-white/50 block mb-2 font-semibold">6. Thể loại nhạc chính (Genres)</label>
                    <div className="flex flex-wrap gap-2">
                      {availableGenres.map((genre) => (
                        <button 
                          key={genre}
                          type="button"
                          onClick={() => handleGenreToggle(genre)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            selectedGenres.includes(genre)
                              ? 'bg-primary/20 text-primary border-primary'
                              : 'bg-black/40 text-white/50 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SEO Bio */}
                  <div>
                    <label className="text-xs text-white/50 block mb-1.5 font-semibold">SEO Meta Description</label>
                    <textarea 
                      value={seoBio}
                      onChange={(e) => setSeoBio(e.target.value)}
                      rows={2}
                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 w-full text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* STICKY FOOTER ACTION BAR */}
      {statusState === 'success' && (
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant px-6 py-4 flex justify-between items-center z-40">
          <button 
            onClick={() => navigate('/organizer')}
            className="px-6 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 text-sm transition-all"
          >
            Hủy bỏ
          </button>
          <div className="flex gap-3">
            <button 
              onClick={() => handleSaveBiography(true)}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-all"
            >
              Lưu bản nháp
            </button>
            <button 
              onClick={() => handleSaveBiography(false)}
              disabled={isSaving}
              className="bg-primary text-on-primary px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">publish</span>
              {isSaving ? 'Đang lưu...' : 'Xuất bản Tiểu sử'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
