import React, { useState, useEffect, useRef } from 'react';
import { eventService } from '../../../features/events/eventService';

interface ArtistSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export const ArtistSelect: React.FC<ArtistSelectProps> = ({ value, onChange }) => {
  const [artists, setArtists] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    eventService.getArtists().then((data) => {
      setArtists(data);
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredArtists = artists.filter(a => 
    (a.artistName || a.stageName)?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleArtist = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const selectedArtists = artists.filter(a => value.includes(a.id));

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className="min-h-[44px] w-full border border-outline-variant rounded-lg bg-input-level-2 flex flex-wrap gap-2 p-2 cursor-text"
        onClick={() => setIsOpen(true)}
      >
        {selectedArtists.map(a => (
          <div key={a.id} className="bg-surface-container-high px-2 py-1 flex items-center gap-2 rounded-md text-sm">
            {a.avatarUrl && <img src={a.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" />}
            <span>{a.artistName || a.stageName}</span>
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); toggleArtist(a.id); }}
              className="text-text-medium-emphasis hover:text-error-red"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        ))}
        <input 
          className="flex-grow bg-transparent outline-none text-sm min-w-[100px] text-on-surface"
          placeholder={value.length === 0 ? "Tìm kiếm nghệ sĩ..." : ""}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-surface-container-high border border-outline-variant rounded-lg shadow-xl py-1">
          {filteredArtists.length === 0 ? (
            <div className="px-4 py-3 text-sm text-text-medium-emphasis text-center">
              Không tìm thấy nghệ sĩ
            </div>
          ) : (
            filteredArtists.map(a => {
              const isSelected = value.includes(a.id);
              return (
                <div 
                  key={a.id} 
                  className={`px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-surface-container-highest ${isSelected ? 'bg-primary/10' : ''}`}
                  onClick={() => toggleArtist(a.id)}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                    {isSelected && <span className="material-symbols-outlined text-[12px] text-on-primary">check</span>}
                  </div>
                  {a.avatarUrl ? (
                    <img src={a.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm text-text-medium-emphasis">person</span>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-on-surface">{a.artistName || a.stageName}</div>
                    {a.category && <div className="text-xs text-text-medium-emphasis">{a.category}</div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
