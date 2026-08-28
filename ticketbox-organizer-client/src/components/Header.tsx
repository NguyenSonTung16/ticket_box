import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import { useAuth } from '../context/AuthContext';
import { LoginModal } from './LoginModal';
import debounce from 'lodash.debounce';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const studioRef = useRef<HTMLDivElement>(null);

  // Debounced search logic
  const fetchSearchResults = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query.trim()) {
          setSearchResults([]);
          return;
        }
        try {
          const res = await axiosClient.get(`/search?q=${query}`);
          setSearchResults(res.data || []);
        } catch (error) {
          console.error('Search failed:', error);
        }
      }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    fetchSearchResults(e.target.value);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (studioRef.current && !studioRef.current.contains(event.target as Node)) {
        setIsStudioOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  const handleMyTickets = () => {
    if (!user) {
      setIsLoginModalOpen(true);
    } else {
      alert("Tính năng 'Vé của tôi' đang được cập nhật và tích hợp. Vui lòng quay lại sau!");
    }
  };

  // Determine if user has special roles for Star Studio
  const hasStudioAccess = user && ['CHECKIN_STAFF', 'ORGANIZER'].includes(user.role);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ORGANIZER': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'CHECKIN_STAFF': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-primary-container dark:bg-primary-container text-on-primary-container border-b border-on-primary-container/10 shadow-sm transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* LOGO (Chữ thuần túy, không khối box màu xanh lá) */}
        <div className="flex items-center gap-6">
          <a href="/" className="text-3xl font-black tracking-tight text-on-primary-container hover:opacity-85 transition-opacity cursor-pointer select-none">
            ticketbox
          </a>

          {/* SEARCH BAR (Desktop) */}
          <div className="relative hidden md:block min-w-[280px] lg:min-w-[360px]">
            <div className="flex items-center bg-on-primary-container/10 border border-on-primary-container/20 rounded-full px-4 py-1.5 focus-within:border-on-primary-container/50 focus-within:ring-1 focus-within:ring-on-primary-container/30 transition-all">
              <span className="material-symbols-outlined text-on-primary-container/70 text-[20px] mr-2 select-none">search</span>
              <input
                type="text"
                placeholder="Bạn tìm gì hôm nay?"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-transparent border-none p-0 text-sm text-on-primary-container placeholder-on-primary-container/60 focus:outline-none focus:ring-0"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="material-symbols-outlined text-on-primary-container/60 hover:text-on-primary-container text-[16px] ml-1"
                >
                  close
                </button>
              )}
            </div>

            {/* Search Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-12 left-0 w-full bg-primary-container border border-on-primary-container/10 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col divide-y divide-on-primary-container/10">
                {searchResults.map((show, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSearchResults([]);
                      setSearchQuery('');
                      navigate(`/event.html?id=${show.id}`);
                    }}
                    className="p-3 hover:bg-on-primary-container/5 cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <div className="w-10 h-12 bg-on-primary-container/10 rounded overflow-hidden flex-shrink-0">
                      <img src={show.cover_image_url || show.thumbnail || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=80"} alt={show.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-on-primary-container text-sm font-semibold truncate">{show.name}</span>
                      <span className="text-on-primary-container/60 text-xs truncate flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[12px]">location_on</span>
                        {show.location || show.venue_name || 'Nhiều địa điểm'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* NAVIGATION ITEMS (Desktop) */}
        <div className="hidden md:flex items-center gap-6">
          {/* Vé Của Tôi */}
          <button
            onClick={handleMyTickets}
            className="flex items-center gap-1.5 text-on-primary-container/85 hover:text-on-primary-container font-medium text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
            Vé của tôi
          </button>

          {/* Star Studio Dropdown Button (Only for specific roles) */}
          {hasStudioAccess && (
            <div className="relative" ref={studioRef}>
              <button
                onClick={() => setIsStudioOpen(!isStudioOpen)}
                className="flex items-center gap-1.5 bg-on-primary-container/10 hover:bg-on-primary-container/20 border border-on-primary-container/20 text-on-primary-container px-4 py-1.5 rounded-full font-bold text-xs transition-all flex-row"
              >
                <span className="material-symbols-outlined text-[16px]">star</span>
                Star Studio
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>

              {/* Star Studio Dropdown */}
              {isStudioOpen && (
                <div className="absolute right-0 mt-2.5 w-56 bg-primary-container border border-on-primary-container/15 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col py-1.5 divide-y divide-on-primary-container/5">
                  <div className="px-4 py-2 text-[10px] font-bold text-on-primary-container/70 uppercase tracking-widest">
                    Công cụ Studio
                  </div>

                  {/* Soát vé Option */}
                  {(user?.role === 'CHECKIN_STAFF' || user?.role === 'ORGANIZER') && (
                    <button
                      onClick={() => { setIsStudioOpen(false); navigate('/checkin'); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-on-primary-container hover:bg-on-primary-container/5 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px] text-blue-400">qr_code_scanner</span>
                      Soát vé (Check-in)
                    </button>
                  )}

                  {/* Organizer Center Option */}
                  {user?.role === 'ORGANIZER' && (
                    <button
                      onClick={() => { setIsStudioOpen(false); navigate('/organizer'); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-on-primary-container hover:bg-on-primary-container/5 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px] text-emerald-500">dashboard</span>
                      Organizer Center
                    </button>
                  )}

                  {/* Bio Approval Option */}
                  {user?.role === 'ORGANIZER' && (
                    <button
                      onClick={() => { setIsStudioOpen(false); navigate('/organizer/bio-approval'); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-on-primary-container hover:bg-on-primary-container/5 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px] text-pink-400">analytics</span>
                      Duyệt tiểu sử (AI Bio)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AUTHENTICATION (Đăng nhập / Đăng xuất) */}
          <div className="flex items-center gap-3 border-l border-on-primary-container/20 pl-6">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-on-primary-container font-medium max-w-[120px] truncate">{user.email}</span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded mt-0.5 ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="bg-on-primary-container/10 hover:bg-on-primary-container/20 text-on-primary-container border border-on-primary-container/20 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-white hover:bg-white/95 text-on-primary-container px-5 py-1.5 rounded-full font-bold text-sm transition-all duration-200 shadow-sm"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <div className="flex items-center gap-4 md:hidden">
          {user ? (
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${getRoleBadgeColor(user.role)}`}>
              {user.role}
            </span>
          ) : null}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-on-primary-container hover:text-white transition-colors flex items-center justify-center p-1"
          >
            <span className="material-symbols-outlined text-[28px]">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* MOBILE NAV PANEL */}
      {isMobileMenuOpen && (
        <div className="md:hidden w-full bg-primary-container border-t border-on-primary-container/10 px-6 py-6 flex flex-col gap-6 animate-fade-in">
          {/* SEARCH BAR (Mobile) */}
          <div className="relative w-full">
            <div className="flex items-center bg-on-primary-container/10 border border-on-primary-container/20 rounded-full px-4 py-2 focus-within:border-on-primary-container/50">
              <span className="material-symbols-outlined text-on-primary-container/70 text-[20px] mr-2">search</span>
              <input
                type="text"
                placeholder="Bạn tìm gì hôm nay?"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-transparent border-none p-0 text-sm text-on-primary-container placeholder-on-primary-container/60 focus:outline-none focus:ring-0"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-12 left-0 w-full bg-primary-container border border-on-primary-container/10 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col divide-y divide-on-primary-container/5">
                {searchResults.map((show, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSearchResults([]);
                      setSearchQuery('');
                      setIsMobileMenuOpen(false);
                      navigate(`/event.html?id=${show.id}`);
                    }}
                    className="p-3 hover:bg-on-primary-container/5 cursor-pointer flex items-center gap-3"
                  >
                    <div className="w-8 h-10 bg-on-primary-container/10 rounded overflow-hidden flex-shrink-0">
                      <img src={show.cover_image_url || show.thumbnail} alt={show.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-on-primary-container text-sm truncate">{show.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MOBILE NAV ITEMS */}
          <div className="flex flex-col gap-4">

            <button
              onClick={() => { setIsMobileMenuOpen(false); handleMyTickets(); }}
              className="flex items-center gap-3 text-on-primary-container/80 hover:text-on-primary-container py-2 text-base transition-colors"
            >
              <span className="material-symbols-outlined text-[22px] text-on-primary-container/50">confirmation_number</span>
              Vé của tôi
            </button>

            {/* Mobile Star Studio Links */}
            {hasStudioAccess && (
              <div className="flex flex-col gap-2.5 pt-2 border-t border-on-primary-container/10">
                <span className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider px-1">Star Studio</span>
                {(user?.role === 'CHECKIN_STAFF' || user?.role === 'ORGANIZER') && (
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/checkin'); }}
                    className="flex items-center gap-3 text-on-primary-container/80 hover:text-on-primary-container py-1.5 pl-3 text-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-blue-400">qr_code_scanner</span>
                    Soát vé (Check-in)
                  </button>
                )}
                {user?.role === 'ORGANIZER' && (
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/organizer'); }}
                    className="flex items-center gap-3 text-on-primary-container/80 hover:text-on-primary-container py-1.5 pl-3 text-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-emerald-500">dashboard</span>
                    Organizer Center
                  </button>
                )}
                {user?.role === 'ORGANIZER' && (
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/organizer/bio-approval'); }}
                    className="flex items-center gap-3 text-on-primary-container/80 hover:text-on-primary-container py-1.5 pl-3 text-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-pink-400">analytics</span>
                    Duyệt tiểu sử (AI Bio)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* MOBILE AUTH ACTIONS */}
          <div className="pt-6 border-t border-on-primary-container/10">
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="text-xs text-on-primary-container/60 truncate px-1">Đang đăng nhập: {user.email}</div>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                  className="w-full bg-on-primary-container/5 hover:bg-on-primary-container/10 text-on-primary-container border border-on-primary-container/10 py-3 rounded-xl text-center font-bold text-sm transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setIsMobileMenuOpen(false); setIsLoginModalOpen(true); }}
                className="w-full bg-white hover:bg-white/90 text-on-primary-container py-3 rounded-xl text-center font-bold text-sm transition-colors"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </header>
  );
};
