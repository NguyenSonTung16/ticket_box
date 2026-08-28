import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimelineItem { year: string; title: string; description: string; }
interface AwardItem { name: string; organization: string; year: string; }
interface WorkItem { title: string; year: string; }

const CATEGORY_OPTIONS = ['Singer', 'Band', 'DJ', 'Rapper', 'Musician', 'Speaker', 'Comedian', 'Other'];
const GENRE_OPTIONS = ['Pop', 'Rock', 'EDM', 'Hip-hop', 'Jazz', 'Indie', 'R&B', 'Ballad', 'Dance', 'Soul', 'Classical', 'Folk'];
const LANGUAGE_OPTIONS = ['Tiếng Việt', 'English', '한국어', '日本語', 'Français', 'Español'];
const INSTRUMENT_OPTIONS = ['Guitar', 'Piano', 'Drums', 'Bass', 'Violin', 'Flute', 'Saxophone', 'Trumpet'];

// ─── Section Card Wrapper ─────────────────────────────────────────────────────

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

// ─── Form Field Components ────────────────────────────────────────────────────

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

// ─── Rich Text Toolbar (lightweight, no dependencies) ─────────────────────────

const RichTextEditor: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => {
  const ref = useRef<HTMLDivElement>(null);
  const exec = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); ref.current?.focus(); };

  const toolbarBtns = [
    { icon: 'format_bold', cmd: 'bold', title: 'Bold' },
    { icon: 'format_italic', cmd: 'italic', title: 'Italic' },
    { icon: 'format_underlined', cmd: 'underline', title: 'Underline' },
    { icon: 'format_h1', cmd: 'formatBlock', val: 'h3', title: 'Heading' },
    { icon: 'format_list_bulleted', cmd: 'insertUnorderedList', title: 'Bullet List' },
    { icon: 'format_list_numbered', cmd: 'insertOrderedList', title: 'Numbered List' },
    { icon: 'format_quote', cmd: 'formatBlock', val: 'blockquote', title: 'Quote' },
    {
      icon: 'link', cmd: 'createLink', title: 'Link',
      action: () => { const url = prompt('URL:'); if (url) exec('createLink', url); }
    },
    { icon: 'undo', cmd: 'undo', title: 'Undo' },
    { icon: 'redo', cmd: 'redo', title: 'Redo' },
  ];

  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
      {/* Toolbar */}
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
      {/* Editable Area */}
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

// ─── MultiSelect Chips ────────────────────────────────────────────────────────

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
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selected.includes(opt)
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

// ─── Social Link Row ──────────────────────────────────────────────────────────

const SocialRow: React.FC<{ icon: string; label: string; value: string; onChange: (v: string) => void; placeholder: string }> =
  ({ icon, label, value, onChange, placeholder }) => (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-surface-container-high border border-outline-variant rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <TextInput value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      </div>
    </div>
  );

// ─── Main Page ────────────────────────────────────────────────────────────────

export const ArtistBioManualPage: React.FC = () => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  // ── Basic Info ──────────────────────────────────────────────────────────────
  const [artistName, setArtistName] = useState('');
  const [stageName, setStageName] = useState('');
  const [category, setCategory] = useState('Singer');
  const [birthday, setBirthday] = useState('');
  const [nationality, setNationality] = useState('Vietnam');
  const [city, setCity] = useState('');
  const [yearsActive, setYearsActive] = useState('');
  const [recordLabel, setRecordLabel] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const avatarRef = useRef<HTMLInputElement>(null);

  // ── Biography ───────────────────────────────────────────────────────────────
  const [shortBio, setShortBio] = useState('');
  const [fullBio, setFullBio] = useState('');

  // ── Performance ─────────────────────────────────────────────────────────────
  const [genres, setGenres] = useState<string[]>([]);
  const [perfStyle, setPerfStyle] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [instruments, setInstruments] = useState<string[]>([]);

  // ── Career Highlights ───────────────────────────────────────────────────────
  const [timeline, setTimeline] = useState<TimelineItem[]>([
    { year: '', title: '', description: '' }
  ]);

  // ── Awards ──────────────────────────────────────────────────────────────────
  const [awards, setAwards] = useState<AwardItem[]>([
    { name: '', organization: '', year: '' }
  ]);

  // ── Notable Works ───────────────────────────────────────────────────────────
  const [albums, setAlbums] = useState<WorkItem[]>([{ title: '', year: '' }]);
  const [singles, setSingles] = useState<WorkItem[]>([{ title: '', year: '' }]);
  const [eps, setEps] = useState<WorkItem[]>([]);
  const [tours, setTours] = useState<WorkItem[]>([]);
  const [openWorks, setOpenWorks] = useState<Record<string, boolean>>({ albums: true, singles: true });

  // ── Social Links ─────────────────────────────────────────────────────────────
  const [website, setWebsite] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [spotify, setSpotify] = useState('');
  const [appleMusic, setAppleMusic] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // ── Gallery ──────────────────────────────────────────────────────────────────
  const [gallery, setGallery] = useState<File[]>([]);
  const galleryRef = useRef<HTMLInputElement>(null);

  // ── Documents ────────────────────────────────────────────────────────────────
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const docRef = useRef<HTMLInputElement>(null);

  // ── SEO ──────────────────────────────────────────────────────────────────────
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [keywords, setKeywords] = useState('');

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const addItem = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, blank: T) =>
    setter(prev => [...prev, blank]);

  const removeItem = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, idx: number) =>
    setter(prev => prev.filter((_, i) => i !== idx));

  const updateItem = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, idx: number, patch: Partial<T>) =>
    setter(prev => prev.map((item, i) => i === idx ? { ...item, ...patch } : item));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatarUrl(URL.createObjectURL(file));
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setGallery(prev => [...prev, ...files].slice(0, 10));
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDocFiles(prev => [...prev, ...files]);
  };

  const handleSave = (publish: boolean) => {
    if (!artistName.trim()) { alert('Vui lòng nhập tên nghệ sĩ'); return; }
    setSaved(true);
    setTimeout(() => navigate('/organizer/artists'), 2000);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex-grow lg:ml-64 px-4 md:px-6 lg:px-10 pb-36 pt-24 md:pt-28 lg:pt-32">
      {/* Success Banner */}
      {saved && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl font-bold text-sm animate-[fadeIn_0.3s_ease]">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          Tiểu sử nghệ sĩ đã được lưu thành công!
        </div>
      )}

      <div className="max-w-[900px] mx-auto">
        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate('/organizer/artists')}
            className="w-10 h-10 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-white transition-all flex items-center justify-center flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Tạo tiểu sử thủ công</h1>
            <p className="text-text-medium-emphasis text-sm mt-1">Điền đầy đủ thông tin để tạo hồ sơ nghệ sĩ chuyên nghiệp.</p>
          </div>
        </div>

        {/* ── Section 1: Basic Info ── */}
        <Section icon="person" title="Thông tin cơ bản" subtitle="Tên, phân loại và thông tin nhận dạng nghệ sĩ">
          {/* Avatar Upload */}
          <div className="flex items-center gap-6 mb-6 pt-2">
            <div
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-outline-variant flex items-center justify-center bg-surface-container-high cursor-pointer hover:border-primary transition-colors overflow-hidden flex-shrink-0"
              onClick={() => avatarRef.current?.click()}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
              <TextInput value={artistName} onChange={e => setArtistName(e.target.value)} placeholder="Nguyễn Văn A..." />
            </Field>
            <Field label="Nghệ danh">
              <TextInput value={stageName} onChange={e => setStageName(e.target.value)} placeholder="Stage name..." />
            </Field>
            <Field label="Phân loại">
              <SelectInput value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
              </SelectInput>
            </Field>
            <Field label="Ngày sinh">
              <TextInput type="date" value={birthday} onChange={e => setBirthday(e.target.value)} />
            </Field>
            <Field label="Quốc tịch">
              <SelectInput value={nationality} onChange={e => setNationality(e.target.value)}>
                {['Vietnam', 'USA', 'Korea', 'Japan', 'UK', 'France', 'Australia', 'Other'].map(c => <option key={c}>{c}</option>)}
              </SelectInput>
            </Field>
            <Field label="Thành phố">
              <TextInput value={city} onChange={e => setCity(e.target.value)} placeholder="TP. Hồ Chí Minh..." />
            </Field>
            <Field label="Năm hoạt động">
              <TextInput value={yearsActive} onChange={e => setYearsActive(e.target.value)} placeholder="2015 – nay" />
            </Field>
            <Field label="Hãng đĩa">
              <TextInput value={recordLabel} onChange={e => setRecordLabel(e.target.value)} placeholder="TNTT Entertainment..." />
            </Field>
          </div>
        </Section>

        {/* ── Section 2: Biography ── */}
        <Section icon="description" title="Tiểu sử" subtitle="Nội dung giới thiệu và tiểu sử đầy đủ">
          <div className="flex flex-col gap-5 pt-2">
            <Field label="Giới thiệu ngắn" hint={`${shortBio.length}/500 ký tự`}>
              <TextArea
                rows={3}
                maxLength={500}
                value={shortBio}
                onChange={e => setShortBio(e.target.value)}
                placeholder="Mô tả ngắn gọn về nghệ sĩ (50–500 ký tự)..."
              />
            </Field>
            <Field label="Tiểu sử đầy đủ">
              <RichTextEditor value={fullBio} onChange={setFullBio} placeholder="Viết tiểu sử chi tiết về nghệ sĩ..." />
            </Field>
          </div>
        </Section>

        {/* ── Section 3: Performance ── */}
        <Section icon="music_note" title="Thông tin biểu diễn" subtitle="Thể loại nhạc, phong cách và nhạc cụ">
          <div className="flex flex-col gap-5 pt-2">
            <Field label="Thể loại nhạc">
              <MultiChips options={GENRE_OPTIONS} selected={genres} onChange={setGenres} />
            </Field>
            <Field label="Phong cách biểu diễn">
              <TextArea rows={2} value={perfStyle} onChange={e => setPerfStyle(e.target.value)} placeholder="Mô tả phong cách biểu diễn..." />
            </Field>
            <Field label="Ngôn ngữ">
              <MultiChips options={LANGUAGE_OPTIONS} selected={languages} onChange={setLanguages} />
            </Field>
            <Field label="Nhạc cụ">
              <MultiChips options={INSTRUMENT_OPTIONS} selected={instruments} onChange={setInstruments} />
            </Field>
          </div>
        </Section>

        {/* ── Section 4: Career Highlights ── */}
        <Section icon="timeline" title="Sự kiện sự nghiệp" subtitle="Các cột mốc quan trọng trong sự nghiệp">
          <div className="flex flex-col gap-3 pt-2">
            {timeline.map((item, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr_2fr_auto] gap-2 items-start bg-surface-container-high border border-outline-variant rounded-xl p-3">
                <TextInput value={item.year} onChange={e => updateItem(setTimeline, i, { year: e.target.value })} placeholder="2020" className="text-center" />
                <TextInput value={item.title} onChange={e => updateItem(setTimeline, i, { title: e.target.value })} placeholder="Tiêu đề..." />
                <TextInput value={item.description} onChange={e => updateItem(setTimeline, i, { description: e.target.value })} placeholder="Mô tả sự kiện..." />
                <button type="button" onClick={() => removeItem(setTimeline, i)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addItem(setTimeline, { year: '', title: '', description: '' })}
              className="flex items-center gap-2 text-primary text-xs font-bold hover:underline w-fit">
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              Thêm cột mốc
            </button>
          </div>
        </Section>

        {/* ── Section 5: Awards ── */}
        <Section icon="emoji_events" title="Giải thưởng" subtitle="Các giải thưởng và danh hiệu đã đạt được">
          <div className="flex flex-col gap-3 pt-2">
            {/* Header */}
            {awards.length > 0 && (
              <div className="grid grid-cols-[2fr_2fr_80px_auto] gap-2 px-1">
                {['Tên giải thưởng', 'Tổ chức', 'Năm', ''].map(h => (
                  <p key={h} className="text-[10px] font-bold text-text-medium-emphasis uppercase tracking-wide">{h}</p>
                ))}
              </div>
            )}
            {awards.map((award, i) => (
              <div key={i} className="grid grid-cols-[2fr_2fr_80px_auto] gap-2 items-center bg-surface-container-high border border-outline-variant rounded-xl p-3">
                <TextInput value={award.name} onChange={e => updateItem(setAwards, i, { name: e.target.value })} placeholder="Nghệ sĩ xuất sắc..." />
                <TextInput value={award.organization} onChange={e => updateItem(setAwards, i, { organization: e.target.value })} placeholder="Zing Music Awards..." />
                <TextInput value={award.year} onChange={e => updateItem(setAwards, i, { year: e.target.value })} placeholder="2023" className="text-center" />
                <button type="button" onClick={() => removeItem(setAwards, i)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addItem(setAwards, { name: '', organization: '', year: '' })}
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
              { key: 'albums', label: 'Albums', state: albums, setter: setAlbums, icon: 'album' },
              { key: 'singles', label: 'Singles', state: singles, setter: setSingles, icon: 'music_note' },
              { key: 'eps', label: 'EP', state: eps, setter: setEps, icon: 'queue_music' },
              { key: 'tours', label: 'Tours', state: tours, setter: setTours, icon: 'tour' },
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
                          <TextInput value={item.title} onChange={e => updateItem(setter as any, i, { title: e.target.value })} placeholder={`Tên ${label.toLowerCase()}...`} className="flex-1" />
                          <TextInput value={item.year} onChange={e => updateItem(setter as any, i, { year: e.target.value })} placeholder="Năm" className="w-20 text-center" />
                          <button type="button" onClick={() => removeItem(setter as any, i)} className="w-8 h-8 flex-shrink-0 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-all flex items-center justify-center">
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addItem(setter as any, { title: '', year: '' })}
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
            <SocialRow icon="language" label="Website" value={website} onChange={setWebsite} placeholder="https://artist-website.com" />
            <SocialRow icon="groups" label="Facebook" value={facebook} onChange={setFacebook} placeholder="https://facebook.com/..." />
            <SocialRow icon="photo_camera" label="Instagram" value={instagram} onChange={setInstagram} placeholder="https://instagram.com/..." />
            <SocialRow icon="smartphone" label="TikTok" value={tiktok} onChange={setTiktok} placeholder="https://tiktok.com/@..." />
            <SocialRow icon="play_circle" label="YouTube" value={youtube} onChange={setYoutube} placeholder="https://youtube.com/..." />
            <SocialRow icon="equalizer" label="Spotify" value={spotify} onChange={setSpotify} placeholder="https://open.spotify.com/..." />
            <SocialRow icon="music_note" label="Apple Music" value={appleMusic} onChange={setAppleMusic} placeholder="https://music.apple.com/..." />
            <SocialRow icon="mail" label="Email" value={email} onChange={setEmail} placeholder="contact@artist.com" />
            <SocialRow icon="phone" label="Điện thoại" value={phone} onChange={setPhone} placeholder="+84 90 xxx xxxx" />
          </div>
        </Section>

        {/* ── Section 8: Gallery ── */}
        <Section icon="photo_library" title="Thư viện ảnh" subtitle="Ảnh biểu diễn và hình ảnh nghệ sĩ" defaultOpen={false}>
          <div className="pt-2">
            <div
              className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary/50 transition-colors cursor-pointer text-center"
              onClick={() => galleryRef.current?.click()}
              onDrop={e => { e.preventDefault(); setGallery(prev => [...prev, ...Array.from(e.dataTransfer.files)].slice(0, 10)); }}
              onDragOver={e => e.preventDefault()}
            >
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">add_photo_alternate</span>
              <div>
                <p className="text-white font-semibold text-sm">Kéo thả ảnh vào đây</p>
                <p className="text-text-medium-emphasis text-xs mt-1">Hoặc click để chọn. Tối đa 10 ảnh.</p>
              </div>
              <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryChange} />
            </div>
            {gallery.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-4">
                {gallery.map((f, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-outline-variant">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => setGallery(prev => prev.filter((_, j) => j !== i))}
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

        {/* ── Section 9: Documents ── */}
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
            {docFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-surface-container-high border border-outline-variant rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                <span className="text-sm text-white flex-1 truncate">{f.name}</span>
                <span className="text-xs text-on-surface-variant">{(f.size / 1024).toFixed(0)} KB</span>
                <button type="button" onClick={() => setDocFiles(prev => prev.filter((_, j) => j !== i))}
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
            <Field label="Meta Title" hint={`${metaTitle.length}/60 ký tự`}>
              <TextInput maxLength={60} value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="Tiêu đề trang nghệ sĩ..." />
            </Field>
            <Field label="Meta Description" hint={`${metaDesc.length}/160 ký tự`}>
              <TextArea rows={2} maxLength={160} value={metaDesc} onChange={e => setMetaDesc(e.target.value)} placeholder="Mô tả ngắn cho công cụ tìm kiếm..." />
            </Field>
            <Field label="Từ khóa" hint="Phân cách bởi dấu phẩy">
              <TextInput value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="concert, ticketbox, nghệ sĩ, nhạc live..." />
            </Field>
          </div>
        </Section>
      </div>

      {/* ── Sticky Footer ── */}
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
              onClick={() => handleSave(false)}
              className="px-5 py-2.5 border border-primary text-primary hover:bg-primary/10 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Lưu bản nháp
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-md shadow-primary/25 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">publish</span>
              Xuất bản tiểu sử
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
