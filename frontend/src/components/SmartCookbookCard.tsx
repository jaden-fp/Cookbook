import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export interface SmartCookbook {
  category: string;
  recipe_count: number;
  preview_images: string[];
}

const CARD_COLORS = ['#FFD6E7', '#D6EEFF', '#E8D6FF', '#D6FFF4', '#FFE8D6', '#F0D6FF'];

function categoryToColor(category: string) {
  const n = category.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CARD_COLORS[n % CARD_COLORS.length];
}

interface Props extends SmartCookbook {
  onHide?: (category: string) => void;
}

export default function SmartCookbookCard({ category, recipe_count, preview_images, onHide }: Props) {
  const cardColor = categoryToColor(category);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  return (
    <Link
      to={`/cookbooks/smart/${encodeURIComponent(category)}`}
      className="group block"
      style={{ textDecoration: 'none', position: 'relative' }}
    >
      <div
        className="relative overflow-hidden transition-all duration-300"
        style={{
          borderRadius: 'var(--radius-lg)',
          aspectRatio: '1 / 1',
          border: '1px solid var(--border)',
          background: cardColor,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(240,40,106,0.12), 0 4px 16px rgba(15,12,30,0.08), 0 0 0 1.5px var(--pink)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--pink)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = '';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        }}
      >
        {/* Color base */}
        <div className="absolute inset-0" style={{ background: cardColor }} />

        {/* Images */}
        {preview_images.length === 1 && (
          <img src={preview_images[0]} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ opacity: 0.8 }} />
        )}
        {preview_images.length === 2 && (
          <div className="absolute inset-0 flex flex-col">
            {preview_images.map((src, i) => (
              <div key={i} className="flex-1 overflow-hidden">
                <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ opacity: 0.8 }} />
              </div>
            ))}
            <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: 'rgba(0,0,0,0.4)' }} />
          </div>
        )}
        {preview_images.length >= 3 && (
          <div className="absolute inset-0 flex flex-col">
            <div className="overflow-hidden" style={{ flex: '1.4' }}>
              <img src={preview_images[0]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ opacity: 0.8 }} />
            </div>
            <div className="h-px" style={{ background: 'rgba(0,0,0,0.4)' }} />
            <div className="flex" style={{ flex: '1' }}>
              <div className="flex-1 overflow-hidden">
                <img src={preview_images[1]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ opacity: 0.8 }} />
              </div>
              <div className="w-px" style={{ background: 'rgba(0,0,0,0.4)' }} />
              <div className="flex-1 overflow-hidden">
                <img src={preview_images[2]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ opacity: 0.8 }} />
              </div>
            </div>
          </div>
        )}

        {/* Bottom scrim */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '70%', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />

        {/* Sparkle badge */}
        <div className="absolute flex items-center justify-center" style={{ top: '8px', left: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', border: '1px solid rgba(15,12,30,0.08)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--accent)">
            <path d="M12 2C12 2 13 8 18 9C13 10 12 16 12 16C12 16 11 10 6 9C11 8 12 2 12 2Z" />
            <path d="M19 3C19 3 19.5 5.5 21.5 6C19.5 6.5 19 9 19 9C19 9 18.5 6.5 16.5 6C18.5 5.5 19 3 19 3Z" />
            <path d="M5 17C5 17 5.5 19.5 7.5 20C5.5 20.5 5 23 5 23C5 23 4.5 20.5 2.5 20C4.5 19.5 5 17 5 17Z" />
          </svg>
        </div>

        {/* ··· menu button */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); setShowMenu(v => !v); }}
          className="absolute flex items-center justify-center transition-all duration-200"
          style={{ top: '8px', right: '8px', width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(6px)', border: '1px solid rgba(15,12,30,0.1)', cursor: 'pointer', zIndex: 10, color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.88)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(15,12,30,0.1)'; }}
        >
          <svg width="13" height="13" viewBox="0 0 16 4" fill="currentColor">
            <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/><circle cx="14" cy="2" r="1.5"/>
          </svg>
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div ref={menuRef} className="absolute animate-scale-in"
            style={{ top: '46px', right: 0, zIndex: 30, background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xl)', minWidth: '160px', overflow: 'hidden' }}
            onClick={e => { e.preventDefault(); e.stopPropagation(); }}
          >
            <button
              onClick={() => { setShowMenu(false); onHide?.(category); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-150"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500, color: '#E53E3E', textAlign: 'left' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,62,62,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              Hide
            </button>
          </div>
        )}

        {/* Name + count */}
        <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3.5 pointer-events-none">
          <h3 className="line-clamp-2 leading-snug mb-0.5" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'white', letterSpacing: '-0.01em', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
            {category}
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>
            {recipe_count} {recipe_count === 1 ? 'recipe' : 'recipes'}
          </p>
        </div>
      </div>
    </Link>
  );
}
