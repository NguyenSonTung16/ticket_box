import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArtistBio {
  id: string;
  artistName: string;
  stageName: string;
  category: string;
  genres: string[];
  status: 'draft' | 'published' | 'archived';
  shortBio: string;
  updatedAt: string;
  createdAt: string;
  createdBy: string;
  country: string;
  avatarUrl?: string;
}

type DisplayMode = 'grid' | 'table';
type SortKey = 'newest' | 'oldest' | 'updated' | 'alpha';
type StatusFilter = 'all' | 'draft' | 'published' | 'archived';

// ─── Mock data (replace with real API call) ───────────────────────────────────

const MOCK_BIOS: ArtistBio[] = [
  {
    id: '1',
    artistName: 'Sơn Tùng M-TP',
    stageName: 'M-TP',
    category: 'Singer',
    genres: ['Pop', 'R&B', 'Hip-hop'],
    status: 'published',
    shortBio: 'Ca sĩ, nhạc sĩ hàng đầu Việt Nam với hàng loạt bản hit đình đám và phong cách âm nhạc độc đáo.',
    updatedAt: '2026-07-10T10:00:00Z',
    createdAt: '2026-07-01T08:00:00Z',
    createdBy: 'organizer@ticketbox.com',
    country: 'Vietnam',
    avatarUrl: '',
  },
  {
    id: '2',
    artistName: 'Hà Anh Tuấn',
    stageName: 'HAT',
    category: 'Singer',
    genres: ['Ballad', 'Indie'],
    status: 'published',
    shortBio: 'Giọng ca trữ tình nổi tiếng với những bản ballad sâu lắng về tình yêu và cuộc sống.',
    updatedAt: '2026-07-09T14:30:00Z',
    createdAt: '2026-07-02T09:00:00Z',
    createdBy: 'organizer@ticketbox.com',
    country: 'Vietnam',
    avatarUrl: '',
  },
  {
    id: '3',
    artistName: 'Tùng Dương',
    stageName: 'Tùng Dương',
    category: 'Singer',
    genres: ['Jazz', 'Soul', 'Indie'],
    status: 'draft',
    shortBio: 'Nghệ sĩ đa tài với khả năng biến hóa phong cách âm nhạc từ jazz đến nhạc dân gian đương đại.',
    updatedAt: '2026-07-08T16:00:00Z',
    createdAt: '2026-07-03T10:00:00Z',
    createdBy: 'organizer@ticketbox.com',
    country: 'Vietnam',
    avatarUrl: '',
  },
  {
    id: '4',
    artistName: 'Đen Vâu',
    stageName: 'Đen',
    category: 'Rapper',
    genres: ['Hip-hop', 'Rap', 'Indie'],
    status: 'published',
    shortBio: 'Rapper nổi bật với lời rap chân thực, gần gũi về cuộc sống và con người Việt Nam.',
    updatedAt: '2026-07-07T12:00:00Z',
    createdAt: '2026-07-04T11:00:00Z',
    createdBy: 'organizer@ticketbox.com',
    country: 'Vietnam',
    avatarUrl: '',
  },
  {
    id: '5',
    artistName: 'Bích Phương',
    stageName: 'Bích Phương',
    category: 'Singer',
    genres: ['Pop', 'Dance', 'EDM'],
    status: 'archived',
    shortBio: 'Ca sĩ trẻ năng động với những bản nhạc pop sôi động và vũ đạo bắt mắt.',
    updatedAt: '2026-07-06T09:00:00Z',
    createdAt: '2026-07-05T08:00:00Z',
    createdBy: 'organizer@ticketbox.com',
    country: 'Vietnam',
    avatarUrl: '',
  },
  {
    id: '6',
    artistName: 'MONO',
    stageName: 'MONO',
    category: 'Singer',
    genres: ['Pop', 'Ballad'],
    status: 'draft',
    shortBio: 'Giọng ca trẻ tài năng thuộc thế hệ nghệ sĩ mới với phong cách âm nhạc hiện đại.',
    updatedAt: '2026-07-05T15:00:00Z',
    createdAt: '2026-07-05T08:30:00Z',
    createdBy: 'organizer@ticketbox.com',
    country: 'Vietnam',
    avatarUrl: '',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  published: { label: 'Đã đăng', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: 'check_circle' },
  draft:     { label: 'Bản nháp', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',     icon: 'edit_note' },
  archived:  { label: 'Lưu trữ', color: 'bg-surface-container-high text-on-surface-variant border-outline-variant', icon: 'archive' },
};

const CATEGORY_OPTIONS = ['Singer', 'Band', 'DJ', 'Rapper', 'Musician', 'Comedian', 'Speaker', 'Other'];
const GENRE_OPTIONS    = ['Pop', 'Rock', 'EDM', 'Hip-hop', 'Jazz', 'Indie', 'R&B', 'Ballad', 'Dance', 'Soul'];
const COUNTRY_OPTIONS  = ['Vietnam', 'USA', 'Korea', 'Japan', 'UK', 'France', 'Australia'];

function avatarFallback(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ArtistBioListPage: React.FC = () => {
  const navigate = useNavigate();

  // View & Filter state
  const [bios, setBios]               = useState<ArtistBio[]>([]);
  const [loading, setLoading]         = useState(true);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [sortKey, setSortKey]         = useState<SortKey>('newest');
  const [perPage, setPerPage]         = useState(10);
  const [page, setPage]               = useState(1);

  // Selection state
  const [selected, setSelected]       = useState<Set<string>>(new Set());

  // Dropdown menu state
  const [openMenuId, setOpenMenuId]   = useState<string | null>(null);
  const menuRef                       = useRef<HTMLDivElement>(null);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  // Creation mode chooser
  const [showCreationModal, setShowCreationModal] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch real data on mount
  useEffect(() => {
    let active = true;
    const fetchBios = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get('/artist/bios');
        if (active) {
          const data = res.data || [];
          setBios(data);
        }
      } catch (err) {
        console.error('Failed to fetch bios from API:', err);
        if (active) setBios(MOCK_BIOS);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBios();
    return () => {
      active = false;
    };
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────

  const filtered = bios
    .filter(b => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        b.artistName.toLowerCase().includes(q) ||
        b.stageName.toLowerCase().includes(q) ||
        b.shortBio.toLowerCase().includes(q);
      const matchStatus   = statusFilter === 'all' || b.status === statusFilter;
      const matchCategory = !categoryFilter || b.category === categoryFilter;
      const matchGenre    = !genreFilter    || b.genres.includes(genreFilter);
      const matchCountry  = !countryFilter  || b.country === countryFilter;
      return matchSearch && matchStatus && matchCategory && matchGenre && matchCountry;
    })
    .sort((a, b) => {
      if (sortKey === 'newest')  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortKey === 'oldest')  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortKey === 'updated') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortKey === 'alpha')   return a.artistName.localeCompare(b.artistName);
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = {
    total:     bios.length,
    published: bios.filter(b => b.status === 'published').length,
    draft:     bios.filter(b => b.status === 'draft').length,
    archived:  bios.filter(b => b.status === 'archived').length,
  };

  // ── Selection helpers ────────────────────────────────────────────────────────

  const allPageSelected = paged.length > 0 && paged.every(b => selected.has(b.id));

  const toggleAll = () => {
    if (allPageSelected) {
      setSelected(prev => { const next = new Set(prev); paged.forEach(b => next.delete(b.id)); return next; });
    } else {
      setSelected(prev => { const next = new Set(prev); paged.forEach(b => next.add(b.id)); return next; });
    }
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      await axiosClient.delete(`/artist/bio/${id}`);
      setBios(prev => prev.filter(b => b.id !== id));
      setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
    } catch (err) {
      console.error('Failed to delete bio:', err);
      alert('Xoá thất bại, vui lòng thử lại.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleBulkPublish = () => {
    setBios(prev => prev.map(b => selected.has(b.id) ? { ...b, status: 'published' as const } : b));
    setSelected(new Set());
  };

  const handleBulkArchive = () => {
    setBios(prev => prev.map(b => selected.has(b.id) ? { ...b, status: 'archived' as const } : b));
    setSelected(new Set());
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        Array.from(selected).map(id => axiosClient.delete(`/artist/bio/${id}`))
      );
      setBios(prev => prev.filter(b => !selected.has(b.id)));
      setSelected(new Set());
    } catch (err) {
      console.error('Failed to delete multiple bios:', err);
      alert('Có lỗi xảy ra khi xoá danh sách nghệ sĩ.');
    } finally {
      setBulkDeleteOpen(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex-grow lg:ml-64 px-4 md:px-6 lg:px-10 pb-10 pt-24 md:pt-28 lg:pt-32">
      <div className="max-w-[1400px] mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-headline-lg font-bold text-white mb-2">
              Tiểu sử nghệ sĩ
            </h1>
            <p className="text-text-medium-emphasis">
              Quản lý thông tin và hồ sơ nghệ sĩ.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 border border-outline-variant text-on-surface-variant px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-surface-container-high transition-all">
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              Nhập danh sách
            </button>
            <button
              onClick={() => setShowCreationModal(true)}
              className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-md shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tiểu sử mới
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tổng số nghệ sĩ', value: stats.total,     icon: 'people',       color: 'text-primary',         bg: 'bg-primary/10' },
            { label: 'Đã đăng',          value: stats.published, icon: 'check_circle', color: 'text-emerald-400',     bg: 'bg-emerald-500/10' },
            { label: 'Bản nháp',         value: stats.draft,     icon: 'edit_note',    color: 'text-amber-400',       bg: 'bg-amber-500/10' },
            { label: 'Lưu trữ',          value: stats.archived,  icon: 'archive',      color: 'text-on-surface-variant', bg: 'bg-surface-container-high' },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className="bg-surface-container-low border border-outline-variant rounded-xl p-4 md:p-5 flex items-center gap-4">
              <div className={`${bg} ${color} w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <span className="material-symbols-outlined text-[22px]">{icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-text-medium-emphasis">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mb-6">
          <div className="flex flex-col gap-4">

            {/* Row 1 — Search + Display Toggle */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder:text-on-surface-variant"
                  placeholder="Tìm kiếm nghệ sĩ..."
                  type="text"
                />
              </div>

              {/* Display Toggle */}
              <div className="flex bg-surface-container-high border border-outline-variant rounded-xl overflow-hidden flex-shrink-0">
                <button
                  onClick={() => setDisplayMode('grid')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all ${displayMode === 'grid' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-white'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  Lưới
                </button>
                <button
                  onClick={() => setDisplayMode('table')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all ${displayMode === 'table' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-white'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">table_rows</span>
                  Bảng
                </button>
              </div>
            </div>

            {/* Row 2 — Filters + Sort */}
            <div className="flex flex-wrap gap-2">
              {/* Status Filters */}
              {(['all', 'published', 'draft', 'archived'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    statusFilter === s
                      ? 'bg-primary text-on-primary border-primary'
                      : 'border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-white'
                  }`}
                >
                  {s === 'all' ? 'Tất cả' : STATUS_CONFIG[s].label}
                </button>
              ))}

              <div className="flex-1" />

              {/* Category */}
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
                className="bg-surface-container-high border border-outline-variant text-xs text-on-surface-variant rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="">Thể loại</option>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Genre */}
              <select
                value={genreFilter}
                onChange={e => { setGenreFilter(e.target.value); setPage(1); }}
                className="bg-surface-container-high border border-outline-variant text-xs text-on-surface-variant rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="">Thể loại nhạc</option>
                {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>

              {/* Country */}
              <select
                value={countryFilter}
                onChange={e => { setCountryFilter(e.target.value); setPage(1); }}
                className="bg-surface-container-high border border-outline-variant text-xs text-on-surface-variant rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="">Quốc gia</option>
                {COUNTRY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Sort */}
              <select
                value={sortKey}
                onChange={e => { setSortKey(e.target.value as SortKey); setPage(1); }}
                className="bg-surface-container-high border border-outline-variant text-xs text-on-surface-variant rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="updated">Cập nhật gần đây</option>
                <option value="alpha">A → Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Bulk Action Bar ── */}
        {selected.size > 0 && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl px-5 py-3 mb-4 flex flex-wrap items-center gap-3 animate-[fadeIn_0.2s_ease]">
            <span className="text-primary font-bold text-sm">
              {selected.size} mục được chọn
            </span>
            <div className="flex-1" />
            <button onClick={handleBulkPublish} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-all">
              <span className="material-symbols-outlined text-[16px]">publish</span> Đăng
            </button>
            <button onClick={handleBulkArchive} className="text-xs font-bold text-on-surface-variant hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-surface-container-high transition-all">
              <span className="material-symbols-outlined text-[16px]">archive</span> Lưu trữ
            </button>
            <button
              onClick={() => setBulkDeleteOpen(true)}
              className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span> Xoá
            </button>
            <button className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-all">
              <span className="material-symbols-outlined text-[16px]">download</span> Xuất
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-on-surface-variant hover:text-white"
              title="Bỏ chọn tất cả"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* ── Result count ── */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-text-medium-emphasis">
            Hiển thị {paged.length} / {filtered.length} nghệ sĩ
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-medium-emphasis">Mỗi trang:</span>
            {[10, 20, 50, 100].map(n => (
              <button
                key={n}
                onClick={() => { setPerPage(n); setPage(1); }}
                className={`w-8 h-7 text-xs font-bold rounded-lg transition-all ${perPage === n ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading State ── */}
  {loading && (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl py-20 flex flex-col items-center gap-4 justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-text-medium-emphasis">Đang tải danh sách nghệ sĩ từ cơ sở dữ liệu...</p>
    </div>
  )}

        {/* ── Empty State ── */}
        {!loading && paged.length === 0 && (
          <div className="bg-surface-container-low border border-outline-variant rounded-xl py-20 flex flex-col items-center gap-5">
            <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">badge</span>
            </div>
            <div className="text-center">
              <p className="text-white font-bold mb-1">Không tìm thấy tiểu sử nào</p>
              <p className="text-text-medium-emphasis text-sm">Tạo tiểu sử nghệ sĩ đầu tiên của bạn.</p>
            </div>
            <button
              onClick={() => setShowCreationModal(true)}
              className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tiểu sử mới
            </button>
          </div>
        )}

        {/* ── Grid View ── */}
        {!loading && displayMode === 'grid' && paged.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {paged.map(bio => (
              <GridCard
                key={bio.id}
                bio={bio}
                selected={selected.has(bio.id)}
                onSelect={() => toggleOne(bio.id)}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                onEdit={() => navigate(`/organizer/bio?id=${bio.id}`)}
                onDelete={() => setDeleteTarget(bio.id)}
                menuRef={menuRef as any}
              />
            ))}
          </div>
        )}

        {/* ── Table View ── */}
        {!loading && displayMode === 'table' && paged.length > 0 && (
          <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="bg-surface-container-high/60 border-b border-outline-variant">
                    <th className="px-4 py-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded accent-primary cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3.5 text-xs font-bold text-text-medium-emphasis uppercase tracking-wide">Nghệ sĩ</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-text-medium-emphasis uppercase tracking-wide">Nghệ danh</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-text-medium-emphasis uppercase tracking-wide">Phân loại</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-text-medium-emphasis uppercase tracking-wide">Thể loại</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-text-medium-emphasis uppercase tracking-wide">Trạng thái</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-text-medium-emphasis uppercase tracking-wide">Cập nhật</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-text-medium-emphasis uppercase tracking-wide">Người tạo</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-text-medium-emphasis uppercase tracking-wide text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {paged.map(bio => {
                    const st = STATUS_CONFIG[bio.status];
                    return (
                      <tr key={bio.id} className={`hover:bg-surface-container-highest/20 transition-colors ${selected.has(bio.id) ? 'bg-primary/5' : ''}`}>
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={selected.has(bio.id)}
                            onChange={() => toggleOne(bio.id)}
                            className="w-4 h-4 rounded accent-primary cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <AvatarCircle name={bio.artistName} size="sm" />
                            <span className="text-sm font-semibold text-white">{bio.artistName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-on-surface-variant">{bio.stageName}</td>
                        <td className="px-4 py-3.5 text-sm text-on-surface-variant">{bio.category}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {bio.genres.slice(0, 2).map(g => (
                              <span key={g} className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-[10px] font-semibold rounded-full border border-outline-variant">
                                {g}
                              </span>
                            ))}
                            {bio.genres.length > 2 && (
                              <span className="px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">+{bio.genres.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.color}`}>
                            <span className="material-symbols-outlined text-[12px]">{st.icon}</span>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-on-surface-variant whitespace-nowrap">{formatDate(bio.updatedAt)}</td>
                        <td className="px-4 py-3.5 text-xs text-on-surface-variant truncate max-w-[120px]">{bio.createdBy.split('@')[0]}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/organizer/bio?id=${bio.id}`)}
                              title="Chỉnh sửa"
                              className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-white transition-all flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => setDeleteTarget(bio.id)}
                              title="Xoá"
                              className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-all flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Pagination ── */}
        {filtered.length > perPage && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="w-9 h-9 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                  n === page
                    ? 'bg-primary text-on-primary'
                    : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="w-9 h-9 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <ConfirmModal
          title="Xoá tiểu sử?"
          message="Hành động này không thể hoàn tác. Tất cả dữ liệu tiểu sử sẽ bị xoá vĩnh viễn."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
        />
      )}

      {/* ── Bulk Delete Modal ── */}
      {bulkDeleteOpen && (
        <ConfirmModal
          title={`Xoá ${selected.size} tiểu sử?`}
          message="Hành động này không thể hoàn tác. Tất cả tiểu sử được chọn sẽ bị xoá vĩnh viễn."
          onCancel={() => setBulkDeleteOpen(false)}
          onConfirm={handleBulkDelete}
        />
      )}

      {/* ── Creation Mode Chooser Modal ── */}
      {showCreationModal && (
        <CreationModeModal
          onClose={() => setShowCreationModal(false)}
          onSelectAI={() => { setShowCreationModal(false); navigate('/organizer/bio'); }}
          onSelectManual={() => { setShowCreationModal(false); navigate('/organizer/bio', { state: { tab: 'manual' } }); }}
        />
      )}
    </div>
  );
};

// ─── CreationModeModal ────────────────────────────────────────────────────────

const CreationModeModal: React.FC<{
  onClose: () => void;
  onSelectAI: () => void;
  onSelectManual: () => void;
}> = ({ onClose, onSelectAI, onSelectManual }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-surface-container-low border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
      {/* Modal Header */}
      <div className="px-6 pt-6 pb-5 border-b border-outline-variant flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl">Tạo tiểu sử như thế nào?</h2>
          <p className="text-text-medium-emphasis text-sm mt-0.5">Chọn phương thức phù hợp với nhu cầu của bạn.</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-white transition-all flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Options */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* AI Option */}
        <button
          onClick={onSelectAI}
          className="group relative flex flex-col items-start gap-4 p-5 bg-surface-container-high border-2 border-outline-variant hover:border-primary rounded-2xl text-left transition-all duration-200 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-[26px] text-primary">auto_awesome</span>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-base mb-1">Tạo bằng AI</h3>
            <p className="text-text-medium-emphasis text-xs leading-relaxed">
              Tải lên PDF hoặc DOCX. AI tự động trích xuất và tóm tắt tiểu sử nghệ sĩ.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-xl group-hover:brightness-110 transition-all w-full justify-center">
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            Tiếp tục với AI
          </span>
          {/* Recommended badge */}
          <div className="absolute top-3 right-3 bg-primary/20 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full border border-primary/30 uppercase tracking-wide">
            Nhanh hơn
          </div>
        </button>

        {/* Manual Option */}
        <button
          onClick={onSelectManual}
          className="group flex flex-col items-start gap-4 p-5 bg-surface-container-high border-2 border-outline-variant hover:border-on-surface-variant/40 rounded-2xl text-left transition-all duration-200 hover:bg-surface-container-highest/30 hover:shadow-lg hover:shadow-black/20"
        >
          <div className="w-12 h-12 rounded-2xl bg-surface-container-highest border border-outline-variant flex items-center justify-center group-hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[26px] text-on-surface-variant">edit_note</span>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-base mb-1">Nhập thủ công</h3>
            <p className="text-text-medium-emphasis text-xs leading-relaxed">
              Điền đầy đủ thông tin nghệ sĩ từ đầu với biểu mẫu chuyên nghiệp.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-surface-container-highest text-white text-xs font-bold px-4 py-2 rounded-xl border border-outline-variant group-hover:bg-surface-variant transition-all w-full justify-center">
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            Bắt đầu thủ công
          </span>
        </button>
      </div>
    </div>
  </div>
);

// ─── Sub-components ────────────────────────────────────────────────────────────

const AvatarCircle: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, size = 'md' }) => {
  const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-base' };
  const hue = name.charCodeAt(0) * 37 % 360;
  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{ background: `hsl(${hue},60%,25%)`, color: `hsl(${hue},80%,75%)`, border: `1.5px solid hsl(${hue},60%,40%)` }}
    >
      {avatarFallback(name)}
    </div>
  );
};

interface GridCardProps {
  bio: ArtistBio;
  selected: boolean;
  onSelect: () => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onEdit: () => void;
  onDelete: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
}

const GridCard: React.FC<GridCardProps> = ({ bio, selected, onSelect, openMenuId, setOpenMenuId, onEdit, onDelete, menuRef }) => {
  const st = STATUS_CONFIG[bio.status];
  const isMenuOpen = openMenuId === bio.id;

  return (
    <div className={`group bg-surface-container-low border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5 ${selected ? 'border-primary ring-1 ring-primary/30' : 'border-outline-variant hover:border-primary/40'}`}>
      {/* Card Top */}
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="w-4 h-4 rounded accent-primary cursor-pointer mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ opacity: selected ? 1 : undefined }}
          />
          <AvatarCircle name={bio.artistName} size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base leading-tight truncate">{bio.artistName}</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">{bio.stageName}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">
                {bio.category}
              </span>
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.color}`}>
                <span className="material-symbols-outlined text-[11px]">{st.icon}</span>
                {st.label}
              </span>
            </div>
          </div>

          {/* More Menu */}
          <div className="relative flex-shrink-0" ref={isMenuOpen ? menuRef : undefined}>
            <button
              onClick={() => setOpenMenuId(isMenuOpen ? null : bio.id)}
              className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
              style={{ opacity: isMenuOpen ? 1 : undefined }}
            >
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-9 w-44 bg-surface-container-high border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden animate-[fadeIn_0.15s_ease]">
                {[
                  { icon: 'open_in_new', label: 'Xem chi tiết', action: onEdit },
                  { icon: 'edit',        label: 'Chỉnh sửa',    action: onEdit },
                  { icon: 'content_copy',label: 'Nhân bản',     action: () => setOpenMenuId(null) },
                  { icon: 'picture_as_pdf', label: 'Xuất PDF',  action: () => setOpenMenuId(null) },
                  { icon: 'auto_awesome', label: 'Tạo lại bằng AI', action: () => setOpenMenuId(null) },
                ].map(({ icon, label, action }) => (
                  <button
                    key={label}
                    onClick={() => { action(); setOpenMenuId(null); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-on-surface-variant hover:bg-surface-container-highest hover:text-white transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                    {label}
                  </button>
                ))}
                <div className="border-t border-outline-variant" />
                <button
                  onClick={() => { onDelete(); setOpenMenuId(null); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Xoá
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Genre chips */}
        <div className="flex flex-wrap gap-1 mb-3">
          {bio.genres.map(g => (
            <span key={g} className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-[10px] font-semibold rounded-full border border-outline-variant">
              {g}
            </span>
          ))}
        </div>

        {/* Short Bio preview */}
        <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2 min-h-[2.75rem]">
          {bio.shortBio}
        </p>
      </div>

      {/* Card Footer */}
      <div className="px-5 py-3 bg-surface-container-high/40 border-t border-outline-variant/50 flex items-center justify-between">
        <div className="text-[10px] text-on-surface-variant">
          <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">schedule</span>
          {formatDate(bio.updatedAt)}
        </div>
        <div className="flex gap-1">
          <button
            title="Xem chi tiết"
            onClick={onEdit}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-primary hover:bg-primary/10 transition-all"
          >
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            Xem
          </button>
          <button
            title="Chỉnh sửa"
            onClick={onEdit}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container-highest hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            Sửa
          </button>
          <button
            title="Xoá"
            onClick={onDelete}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfirmModal: React.FC<{
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ title, message, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[fadeIn_0.2s_ease]">
      <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-red-400 text-[26px]">warning</span>
      </div>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-text-medium-emphasis text-sm mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-all text-sm font-semibold"
        >
          Huỷ bỏ
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all text-sm font-bold"
        >
          Xoá
        </button>
      </div>
    </div>
  </div>
);
