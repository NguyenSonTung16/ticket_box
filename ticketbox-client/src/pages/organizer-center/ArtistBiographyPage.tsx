import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
// ─── Manual Form Types ────────────────────────────────────────────────────────
interface TimelineItem { year: string; title: string; description: string; }
interface AwardItem    { name: string; organization: string; year: string; }
interface WorkItem     { title: string; year: string; }

const CATEGORY_OPTIONS  = ['Singer', 'Band', 'DJ', 'Rapper', 'Musician', 'Speaker', 'Comedian', 'Other'];
const GENRE_OPTIONS     = ['Pop', 'Rock', 'EDM', 'Hip-hop', 'Jazz', 'Indie', 'R&B', 'Ballad', 'Dance', 'Soul', 'Classical', 'Folk'];
const LANGUAGE_OPTIONS  = ['Tiếng Việt', 'English', '한국어', '日本語', 'Français', 'Español'];
const INSTRUMENT_OPTIONS= ['Guitar', 'Piano', 'Drums', 'Bass', 'Violin', 'Flute', 'Saxophone', 'Trumpet'];

// ─── Manual Form Components ───────────────────────────────────────────────────
const Section: React.FC<{
  icon: string; title: string; subtitle?: string;
  defaultOpen?: boolean; children: React.ReactNode;
}> = ({ icon, title, subtitle, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden mb-5">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-surface-container-high/30 transition-colors"
      >
        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-sm">{title}</h2>
          {subtitle && <p className="text-on-surface-variant text-xs mt-0.5">{subtitle}</p>}
        </div>
        <span className={`material-symbols-outlined text-on-surface-variant text-[20px] transition-transform ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      {open && <div className="px-6 pb-6 pt-2 border-t border-outline-variant/60">{children}</div>}
    </div>
  );
};

const Field: React.FC<{ label: string; required?: boolean; hint?: string; children: React.ReactNode }> = ({ label, required, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11px] text-text-medium-emphasis">{hint}</p>}
  </div>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`w-full bg-surface-container-high border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${props.className || ''}`}
  />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    className={`w-full bg-surface-container-high border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none ${props.className || ''}`}
  />
);

const SelectInput: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className={`w-full bg-surface-container-high border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer ${props.className || ''}`}
  />
);

const RichTextEditor: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => {
  const ref = useRef<HTMLDivElement>(null);
  const exec = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); ref.current?.focus(); };

  const toolbarBtns = [
    { icon: 'format_bold',          cmd: 'bold',          title: 'Bold' },
    { icon: 'format_italic',        cmd: 'italic',        title: 'Italic' },
    { icon: 'format_underlined',    cmd: 'underline',     title: 'Underline' },
    { icon: 'format_h1',            cmd: 'formatBlock',   val: 'h3', title: 'Heading' },
    { icon: 'format_list_bulleted', cmd: 'insertUnorderedList', title: 'Bullet List' },
    { icon: 'format_list_numbered', cmd: 'insertOrderedList',   title: 'Numbered List' },
    { icon: 'format_quote',         cmd: 'formatBlock',   val: 'blockquote', title: 'Quote' },
    { icon: 'link',                 cmd: 'createLink',    title: 'Link',
      action: () => { const url = prompt('URL:'); if (url) exec('createLink', url); } },
    { icon: 'undo',                 cmd: 'undo',          title: 'Undo' },
    { icon: 'redo',                 cmd: 'redo',          title: 'Redo' },
  ];

  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
      <div className="flex flex-wrap gap-0.5 px-2 py-2 bg-surface-container-high border-b border-outline-variant">
        {toolbarBtns.map(({ icon, cmd, val, title, action }) => (
          <button
            key={title}
            type="button"
            title={title}
            onMouseDown={e => { e.preventDefault(); action ? action() : exec(cmd, val); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={e => onChange((e.target as HTMLDivElement).innerHTML)}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder || 'Nhập nội dung tiểu sử đầy đủ...'}
        className="min-h-[200px] px-4 py-3 text-sm text-white bg-surface-container-high outline-none leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-on-surface-variant"
        style={{ direction: 'ltr' }}
      />
    </div>
  );
};

const MultiChips: React.FC<{
  options: string[]; selected: string[]; onChange: (v: string[]) => void;
}> = ({ options, selected, onChange }) => {
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            selected.includes(opt)
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-surface-container-high border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-white'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};

const SocialRow: React.FC<{ icon: string; label: string; value: string; onChange: (v: string) => void; placeholder: string }> =
  ({ icon, label: _label, value, onChange, placeholder }) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 bg-surface-container-high border border-outline-variant rounded-xl flex items-center justify-center flex-shrink-0">
      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      <TextInput value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  </div>
);


export const ArtistBiographyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>(
    location.state?.tab === 'manual' ? 'manual' : 'ai'
  );

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const editId = searchParams.get('id') || searchParams.get('concertId');
    if (!editId) return;

    let active = true;
    const loadBio = async () => {
      try {
        const bioRes = await axiosClient.get(`/artist/bio/${editId}`);
        if (!active) return;

        setBioId(bioRes.data.id || editId);
        setShortBio(bioRes.data.shortBio || '');
        setMediumBio(bioRes.data.mediumBio || '');
        setSeoBio(bioRes.data.seoBio || '');
        setStatusState('success');

        // Fetch corresponding concert info to populate Left Panel fields
        if (bioRes.data.concertId) {
          const concertRes = await axiosClient.get(`/info/show/${bioRes.data.concertId}`);
          if (active) {
            setArtistName(bioRes.data.artistName || concertRes.data.name || '');
            setStageName(bioRes.data.stageName || concertRes.data.name || '');
            setCategory(bioRes.data.category || concertRes.data.category || 'Singer');
            setCountry(bioRes.data.country || concertRes.data.province || 'Vietnam');
            setCity(concertRes.data.venue_name || '');
            setWebsite(concertRes.data.slug || '');
            
            // Populate manual form states as well
            setManualArtistName(bioRes.data.artistName || concertRes.data.name || '');
            setManualStageName(bioRes.data.stageName || concertRes.data.name || '');
            setManualCategory(bioRes.data.category || concertRes.data.category || 'Singer');
            setManualNationality(bioRes.data.country || concertRes.data.province || 'Vietnam');
            setManualCity(concertRes.data.venue_name || '');
            setManualShortBio(bioRes.data.shortBio || '');
            setManualFullBio(bioRes.data.mediumBio || '');
            setManualMetaDesc(bioRes.data.seoBio || '');
            setSelectedGenres(bioRes.data.genres || ['Pop', 'Indie', 'R&B']);
          }
        }
      } catch (err) {
        console.error('Failed to load bio/concert details:', err);
      }
    };
    loadBio();
    return () => {
      active = false;
    };
  }, [searchParams]);
  const [saved, setSaved] = useState(false);
  const [bioId, setBioId] = useState<string | null>(null);

  // MANUAL FORM STATES
  const [manualArtistName, setManualArtistName] = useState('');
  const [manualStageName, setManualStageName] = useState('');
  const [manualCategory, setManualCategory] = useState('Singer');
  const [manualBirthday, setManualBirthday] = useState('');
  const [manualNationality, setManualNationality] = useState('Vietnam');
  const [manualCity, setManualCity] = useState('');
  const [manualYearsActive, setManualYearsActive] = useState('');
  const [manualRecordLabel, setManualRecordLabel] = useState('');
  const [manualAvatarUrl, setManualAvatarUrl] = useState('');
  const avatarRef = useRef<HTMLInputElement>(null);

  const [manualShortBio, setManualShortBio] = useState('');
  const [manualFullBio, setManualFullBio] = useState('');

  const [manualGenres, setManualGenres] = useState<string[]>([]);
  const [manualPerfStyle, setManualPerfStyle] = useState('');
  const [manualLanguages, setManualLanguages] = useState<string[]>([]);
  const [manualInstruments, setManualInstruments] = useState<string[]>([]);

  const [manualTimeline, setManualTimeline] = useState<TimelineItem[]>([
    { year: '', title: '', description: '' }
  ]);

  const [manualAwards, setManualAwards] = useState<AwardItem[]>([
    { name: '', organization: '', year: '' }
  ]);

  const [manualAlbums, setManualAlbums] = useState<WorkItem[]>([{ title: '', year: '' }]);
  const [manualSingles, setManualSingles] = useState<WorkItem[]>([{ title: '', year: '' }]);
  const [manualEps, setManualEps] = useState<WorkItem[]>([]);
  const [manualTours, setManualTours] = useState<WorkItem[]>([]);
  const [openWorks, setOpenWorks] = useState<Record<string, boolean>>({ albums: true, singles: true });

  const [manualWebsite, setManualWebsite] = useState('');
  const [manualFacebook, setManualFacebook] = useState('');
  const [manualInstagram, setManualInstagram] = useState('');
  const [manualTiktok, setManualTiktok] = useState('');
  const [manualYoutube, setManualYoutube] = useState('');
  const [manualSpotify, setManualSpotify] = useState('');
  const [manualAppleMusic, setManualAppleMusic] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');

  const [manualGallery, setManualGallery] = useState<File[]>([]);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [manualDocFiles, setManualDocFiles] = useState<File[]>([]);
  const docRef = useRef<HTMLInputElement>(null);

  const [manualMetaTitle, setManualMetaTitle] = useState('');
  const [manualMetaDesc, setManualMetaDesc] = useState('');
  const [manualKeywords, setManualKeywords] = useState('');


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
  const [_youtube, _setYoutube] = useState('');
  const [spotify, setSpotify] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [_uploadProgress, setUploadProgress] = useState(0);
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
      formData.append('concertId', searchParams.get('concertId') || '1');

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
            setBioId(bioData.id || jobId);
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
      const targetId = bioId || searchParams.get('id') || searchParams.get('concertId') || '1';
      await axiosClient.put(`/artist/bio/${targetId}/approve`, {
        shortBio,
        mediumBio,
        seoBio,
        artistName,
        stageName,
        category,
        genres: selectedGenres,
        country
      });

      alert(isDraft ? 'Đã lưu bản nháp thành công!' : 'Đã duyệt và xuất bản tiểu sử nghệ sĩ thành công lên MongoDB!');
      if (!isDraft) navigate('/organizer');
    } catch (err: any) {
      alert(`Lưu thất bại: ${err.response?.data?.message || 'Lỗi server.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // MANUAL FORM HELPERS
  const addManualItem = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, blank: T) =>
    setter(prev => [...prev, blank]);

  const removeManualItem = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, idx: number) =>
    setter(prev => prev.filter((_, i) => i !== idx));

  const updateManualItem = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, idx: number, patch: Partial<T>) =>
    setter(prev => prev.map((item, i) => i === idx ? { ...item, ...patch } : item));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setManualAvatarUrl(URL.createObjectURL(file));
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setManualGallery(prev => [...prev, ...files].slice(0, 10));
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setManualDocFiles(prev => [...prev, ...files]);
  };

  const handleSaveManual = async (publish: boolean) => {
    if (!manualArtistName.trim()) {
      alert('Vui lòng nhập tên nghệ sĩ');
      return;
    }
    
    setIsSaving(true);
    try {
      const targetId = bioId || searchParams.get('id') || searchParams.get('concertId');
      
      const payload = {
        artistName: manualArtistName,
        stageName: manualStageName,
        category: manualCategory,
        shortBio: manualShortBio,
        mediumBio: manualFullBio,
        seoBio: manualMetaDesc || manualShortBio,
        genres: manualGenres,
        country: manualNationality,
        avatarUrl: manualAvatarUrl,
        status: publish ? 'APPROVED' : 'PENDING_REVIEW'
      };

      if (targetId) {
        await axiosClient.put(`/artist/bio/${targetId}/approve`, payload);
      } else {
        const res = await axiosClient.post('/artist/bio', payload);
        if (res.data?.id) {
          setBioId(res.data.id);
        }
      }

      setSaved(true);
      setTimeout(() => navigate('/organizer/artists'), 2000);
    } catch (err: any) {
      alert(`Lưu thất bại: ${err.response?.data?.message || 'Lỗi server.'}`);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="flex-grow lg:ml-64 px-4 md:px-6 lg:px-10 pb-36 pt-24 md:pt-28 lg:pt-32 bg-[#0d0d0f] text-white font-sans min-h-screen">
      
      {/* Success Banner for Manual Tab */}
      {activeTab === 'manual' && saved && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl font-bold text-sm animate-[fadeIn_0.3s_ease]">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          Tiểu sử nghệ sĩ đã được lưu thành công!
        </div>
      )}

      <div className="max-w-[1300px] mx-auto">

        {/* Success Banner for AI Tab */}
        {activeTab === 'ai' && statusState === 'success' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm flex gap-3 items-center mb-6 animate-fadeIn">
            <span className="material-symbols-outlined text-[24px]">check_circle</span>
            <span className="font-semibold">Tiểu sử nghệ sĩ được tạo tự động thành công bằng AI! Vui lòng kiểm tra lại nội dung trước khi xuất bản.</span>
          </div>
        )}

        {/* Error Warning Card for AI Tab */}
        {activeTab === 'ai' && statusState === 'error' && (
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
            {activeTab === 'ai' 
              ? 'Tải tài liệu giới thiệu thô (PDF/DOC/DOCX) để AI tự động trích xuất thông tin chi tiết và hỗ trợ xuất bản.' 
              : 'Tự nhập tay tất cả các thông tin chi tiết của nghệ sĩ thông qua biểu mẫu chuyên nghiệp.'}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 mb-8 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-[2px] ${
              activeTab === 'ai'
                ? 'border-primary text-primary'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            Trích xuất bằng AI (Nhập file)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-[2px] ${
              activeTab === 'manual'
                ? 'border-primary text-primary'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
            Nhập thủ công
          </button>
        </div>

        {activeTab === 'ai' ? (
          /* TWO-COLUMN RESPONSIVE LAYOUT (AI TAB) */
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
        ) : (
          /* STRUCTURED SINGLE COLUMN LAYOUT FOR MANUAL INPUT */
          <div className="max-w-[900px] mx-auto">
            {/* ── Section 1: Basic Info ── */}
            <Section icon="person" title="Thông tin cơ bản" subtitle="Tên, phân loại và thông tin nhận dạng nghệ sĩ">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6 mb-6 pt-2">
                <div
                  className="w-20 h-20 rounded-2xl border-2 border-dashed border-outline-variant flex items-center justify-center bg-surface-container-high cursor-pointer hover:border-primary transition-colors overflow-hidden flex-shrink-0"
                  onClick={() => avatarRef.current?.click()}
                >
                  {manualAvatarUrl
                    ? <img src={manualAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    : <span className="material-symbols-outlined text-4xl text-on-surface-variant">add_photo_alternate</span>
                  }
                </div>
                <div>
                  <p className="text-white font-semibold text-sm mb-1">Ảnh đại diện nghệ sĩ</p>
                  <p className="text-text-medium-emphasis text-xs mb-2">JPG, PNG hoặc WEBP. Tối đa 5MB.</p>
                  <button type="button" onClick={() => avatarRef.current?.click()} className="px-3 py-1.5 border border-outline-variant text-on-surface-variant rounded-lg text-xs font-semibold hover:bg-surface-container-high hover:text-white transition-all">
                    Chọn ảnh
                  </button>
                  <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Tên nghệ sĩ" required>
                  <TextInput value={manualArtistName} onChange={e => setManualArtistName(e.target.value)} placeholder="Nguyễn Văn A..." />
                </Field>
                <Field label="Nghệ danh">
                  <TextInput value={manualStageName} onChange={e => setManualStageName(e.target.value)} placeholder="Stage name..." />
                </Field>
                <Field label="Phân loại">
                  <SelectInput value={manualCategory} onChange={e => setManualCategory(e.target.value)}>
                    {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Ngày sinh">
                  <TextInput type="date" value={manualBirthday} onChange={e => setManualBirthday(e.target.value)} />
                </Field>
                <Field label="Quốc tịch">
                  <SelectInput value={manualNationality} onChange={e => setManualNationality(e.target.value)}>
                    {['Vietnam', 'USA', 'Korea', 'Japan', 'UK', 'France', 'Australia', 'Other'].map(c => <option key={c}>{c}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Thành phố">
                  <TextInput value={manualCity} onChange={e => setManualCity(e.target.value)} placeholder="TP. Hồ Chí Minh..." />
                </Field>
                <Field label="Năm hoạt động">
                  <TextInput value={manualYearsActive} onChange={e => setManualYearsActive(e.target.value)} placeholder="2015 – nay" />
                </Field>
                <Field label="Hãng đĩa">
                  <TextInput value={manualRecordLabel} onChange={e => setManualRecordLabel(e.target.value)} placeholder="TNTT Entertainment..." />
                </Field>
              </div>
            </Section>

            {/* ── Section 2: Biography ── */}
            <Section icon="description" title="Tiểu sử" subtitle="Nội dung giới thiệu và tiểu sử đầy đủ">
              <div className="flex flex-col gap-5 pt-2">
                <Field label="Giới thiệu ngắn" hint={`${manualShortBio.length}/500 ký tự`}>
                  <TextArea
                    rows={3}
                    maxLength={500}
                    value={manualShortBio}
                    onChange={e => setManualShortBio(e.target.value)}
                    placeholder="Mô tả ngắn gọn về nghệ sĩ (50–500 ký tự)..."
                  />
                </Field>
                <Field label="Tiểu sử đầy đủ">
                  <RichTextEditor value={manualFullBio} onChange={setManualFullBio} placeholder="Viết tiểu sử chi tiết về nghệ sĩ..." />
                </Field>
              </div>
            </Section>

            {/* ── Section 3: Performance ── */}
            <Section icon="music_note" title="Thông tin biểu diễn" subtitle="Thể loại nhạc, phong cách và nhạc cụ">
              <div className="flex flex-col gap-5 pt-2">
                <Field label="Thể loại nhạc">
                  <MultiChips options={GENRE_OPTIONS} selected={manualGenres} onChange={setManualGenres} />
                </Field>
                <Field label="Phong cách biểu diễn">
                  <TextArea rows={2} value={manualPerfStyle} onChange={e => setManualPerfStyle(e.target.value)} placeholder="Mô tả phong cách biểu diễn..." />
                </Field>
                <Field label="Ngôn ngữ">
                  <MultiChips options={LANGUAGE_OPTIONS} selected={manualLanguages} onChange={setManualLanguages} />
                </Field>
                <Field label="Nhạc cụ">
                  <MultiChips options={INSTRUMENT_OPTIONS} selected={manualInstruments} onChange={setManualInstruments} />
                </Field>
              </div>
            </Section>

            {/* ── Section 4: Career Highlights ── */}
            <Section icon="timeline" title="Sự kiện sự nghiệp" subtitle="Các cột mốc quan trọng trong sự nghiệp">
              <div className="flex flex-col gap-3 pt-2">
                {manualTimeline.map((item, i) => (
                  <div key={i} className="grid grid-cols-[80px_1fr_2fr_auto] gap-2 items-start bg-surface-container-high border border-outline-variant rounded-xl p-3">
                    <TextInput value={item.year} onChange={e => updateManualItem(setManualTimeline, i, { year: e.target.value })} placeholder="2020" className="text-center" />
                    <TextInput value={item.title} onChange={e => updateManualItem(setManualTimeline, i, { title: e.target.value })} placeholder="Tiêu đề..." />
                    <TextInput value={item.description} onChange={e => updateManualItem(setManualTimeline, i, { description: e.target.value })} placeholder="Mô tả sự kiện..." />
                    <button type="button" onClick={() => removeManualItem(setManualTimeline, i)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addManualItem(setManualTimeline, { year: '', title: '', description: '' })}
                  className="flex items-center gap-2 text-primary text-xs font-bold hover:underline w-fit">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  Thêm cột mốc
                </button>
              </div>
            </Section>

            {/* ── Section 5: Awards ── */}
            <Section icon="emoji_events" title="Giải thưởng" subtitle="Các giải thưởng và danh hiệu đã đạt được">
              <div className="flex flex-col gap-3 pt-2">
                {manualAwards.length > 0 && (
                  <div className="grid grid-cols-[2fr_2fr_80px_auto] gap-2 px-1">
                    {['Tên giải thưởng', 'Tổ chức', 'Năm', ''].map(h => (
                      <p key={h} className="text-[10px] font-bold text-text-medium-emphasis uppercase tracking-wide">{h}</p>
                    ))}
                  </div>
                )}
                {manualAwards.map((award, i) => (
                  <div key={i} className="grid grid-cols-[2fr_2fr_80px_auto] gap-2 items-center bg-surface-container-high border border-outline-variant rounded-xl p-3">
                    <TextInput value={award.name} onChange={e => updateManualItem(setManualAwards, i, { name: e.target.value })} placeholder="Nghệ sĩ xuất sắc..." />
                    <TextInput value={award.organization} onChange={e => updateManualItem(setManualAwards, i, { organization: e.target.value })} placeholder="Zing Music Awards..." />
                    <TextInput value={award.year} onChange={e => updateManualItem(setManualAwards, i, { year: e.target.value })} placeholder="2023" className="text-center" />
                    <button type="button" onClick={() => removeManualItem(setManualAwards, i)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addManualItem(setManualAwards, { name: '', organization: '', year: '' })}
                  className="flex items-center gap-2 text-primary text-xs font-bold hover:underline w-fit">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  Thêm giải thưởng
                </button>
              </div>
            </Section>

            {/* ── Section 6: Notable Works ── */}
            <Section icon="library_music" title="Tác phẩm nổi bật" subtitle="Album, single, EP, tour và hợp tác">
              <div className="flex flex-col gap-3 pt-2">
                {([
                  { key: 'albums',  label: 'Albums',   state: manualAlbums,  setter: setManualAlbums,  icon: 'album' },
                  { key: 'singles', label: 'Singles',  state: manualSingles, setter: setManualSingles, icon: 'music_note' },
                  { key: 'eps',     label: 'EP',       state: manualEps,     setter: setManualEps,     icon: 'queue_music' },
                  { key: 'tours',   label: 'Tours',    state: manualTours,   setter: setManualTours,   icon: 'tour' },
                ] as const).map(({ key, label, state, setter, icon: ic }) => {
                  const isOpen = !!openWorks[key];
                  return (
                    <div key={key} className="border border-outline-variant rounded-xl overflow-hidden">
                      <button type="button" onClick={() => setOpenWorks(p => ({ ...p, [key]: !p[key] }))}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-container-high/30 transition-colors">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{ic}</span>
                        <span className="text-sm font-semibold text-white flex-1">{label}</span>
                        <span className="text-xs text-on-surface-variant">{state.length} mục</span>
                        <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-outline-variant/60 flex flex-col gap-2 pt-3">
                          {state.map((item, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <TextInput value={item.title} onChange={e => updateManualItem(setter as any, i, { title: e.target.value })} placeholder={`Tên ${label.toLowerCase()}...`} className="flex-1" />
                              <TextInput value={item.year} onChange={e => updateManualItem(setter as any, i, { year: e.target.value })} placeholder="Năm" className="w-20 text-center" />
                              <button type="button" onClick={() => removeManualItem(setter as any, i)} className="w-8 h-8 flex-shrink-0 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-all flex items-center justify-center">
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                            </div>
                          ))}
                          <button type="button" onClick={() => addManualItem(setter as any, { title: '', year: '' })}
                            className="flex items-center gap-1.5 text-primary text-xs font-bold hover:underline w-fit mt-1">
                            <span className="material-symbols-outlined text-[15px]">add_circle</span>
                            Thêm {label.toLowerCase()}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* ── Section 7: Social Links ── */}
            <Section icon="link" title="Mạng xã hội & Liên hệ" subtitle="Website, mạng xã hội và thông tin liên hệ">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <SocialRow icon="language"     label="Website"     value={manualWebsite}    onChange={setManualWebsite}    placeholder="https://artist-website.com" />
                <SocialRow icon="groups"       label="Facebook"    value={manualFacebook}   onChange={setManualFacebook}   placeholder="https://facebook.com/..." />
                <SocialRow icon="photo_camera" label="Instagram"   value={manualInstagram}  onChange={setManualInstagram}  placeholder="https://instagram.com/..." />
                <SocialRow icon="smartphone"   label="TikTok"      value={manualTiktok}     onChange={setManualTiktok}     placeholder="https://tiktok.com/@..." />
                <SocialRow icon="play_circle"  label="YouTube"     value={manualYoutube}    onChange={setManualYoutube}    placeholder="https://youtube.com/..." />
                <SocialRow icon="equalizer"    label="Spotify"     value={manualSpotify}    onChange={setManualSpotify}    placeholder="https://open.spotify.com/..." />
                <SocialRow icon="music_note"   label="Apple Music" value={manualAppleMusic} onChange={setManualAppleMusic} placeholder="https://music.apple.com/..." />
                <SocialRow icon="mail"         label="Email"       value={manualEmail}      onChange={setManualEmail}      placeholder="contact@artist.com" />
                <SocialRow icon="phone"        label="Điện thoại"  value={manualPhone}      onChange={setManualPhone}      placeholder="+84 90 xxx xxxx" />
              </div>
            </Section>

            {/* ── Section 8: Gallery ── */}
            <Section icon="photo_library" title="Thư viện ảnh" subtitle="Ảnh biểu diễn và hình ảnh nghệ sĩ" defaultOpen={false}>
              <div className="pt-2">
                <div
                  className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary/50 transition-colors cursor-pointer text-center"
                  onClick={() => galleryRef.current?.click()}
                  onDrop={e => { e.preventDefault(); setManualGallery(prev => [...prev, ...Array.from(e.dataTransfer.files)].slice(0, 10)); }}
                  onDragOver={e => e.preventDefault()}
                >
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">add_photo_alternate</span>
                  <div>
                    <p className="text-white font-semibold text-sm">Kéo thả ảnh vào đây</p>
                    <p className="text-text-medium-emphasis text-xs mt-1">Hoặc click để chọn. Tối đa 10 ảnh.</p>
                  </div>
                  <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryChange} />
                </div>
                {manualGallery.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-4">
                    {manualGallery.map((f, i) => (
                      <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-outline-variant">
                        <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => setManualGallery(prev => prev.filter((_, j) => j !== i))}
                            className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>

            {/* ── Section 9: Attached Documents ── */}
            <Section icon="folder" title="Tài liệu đính kèm" subtitle="PDF, DOCX hoặc ZIP (tùy chọn)" defaultOpen={false}>
              <div className="pt-2 flex flex-col gap-3">
                <div
                  className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors cursor-pointer text-center"
                  onClick={() => docRef.current?.click()}
                >
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant">upload_file</span>
                  <p className="text-white font-semibold text-sm">Tải lên tài liệu</p>
                  <p className="text-text-medium-emphasis text-xs">PDF, DOCX, ZIP — Tối đa 50MB</p>
                  <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.zip" multiple className="hidden" onChange={handleDocChange} />
                </div>
                {manualDocFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-surface-container-high border border-outline-variant rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                    <span className="text-sm text-white flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-on-surface-variant">{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => setManualDocFiles(prev => prev.filter((_, j) => j !== i))}
                      className="w-7 h-7 hover:bg-red-500/10 rounded-lg text-on-surface-variant hover:text-red-400 transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Section 10: SEO ── */}
            <Section icon="search" title="Tối ưu hóa SEO" subtitle="Meta title, description và từ khóa" defaultOpen={false}>
              <div className="flex flex-col gap-4 pt-2">
                <Field label="Meta Title" hint={`${manualMetaTitle.length}/60 ký tự`}>
                  <TextInput maxLength={60} value={manualMetaTitle} onChange={e => setManualMetaTitle(e.target.value)} placeholder="Tiêu đề trang nghệ sĩ..." />
                </Field>
                <Field label="Meta Description" hint={`${manualMetaDesc.length}/160 ký tự`}>
                  <TextArea rows={2} maxLength={160} value={manualMetaDesc} onChange={e => setManualMetaDesc(e.target.value)} placeholder="Mô tả ngắn cho công cụ tìm kiếm..." />
                </Field>
                <Field label="Từ khóa" hint="Phân cách bởi dấu phẩy">
                  <TextInput value={manualKeywords} onChange={e => setManualKeywords(e.target.value)} placeholder="concert, ticketbox, nghệ sĩ, nhạc live..." />
                </Field>
              </div>
            </Section>
          </div>
        )}

      </div>

      {/* STICKY FOOTER ACTION BAR */}
      {activeTab === 'ai' ? (
        statusState === 'success' && (
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
        )
      ) : (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant px-6 py-4 z-40">
          <div className="max-w-[900px] mx-auto flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/organizer/artists')}
              className="px-5 py-2.5 border border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              Huỷ bỏ
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleSaveManual(false)}
                className="px-5 py-2.5 border border-primary text-primary hover:bg-primary/10 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                Lưu bản nháp
              </button>
              <button
                type="button"
                onClick={() => handleSaveManual(true)}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-md shadow-primary/25 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">publish</span>
                Xuất bản tiểu sử
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};