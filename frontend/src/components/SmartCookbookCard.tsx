import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecipes } from '../api';
import type { Recipe } from '../types';
import BottomSheet from './BottomSheet';

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

function pinnedKey(category: string) {
  return `smart-pinned-${category}`;
}

interface Props extends SmartCookbook {
  onHide?: (category: string) => void;
}

export default function SmartCookbookCard({ category, recipe_count, preview_images, onHide }: Props) {
  const cardColor = categoryToColor(category);
  const [showMenu, setShowMenu] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [pinned, setPinned] = useState<string[]>(
    () => JSON.parse(localStorage.getItem(pinnedKey(category)) ?? '[]')
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const displayImages = pinned.length > 0 ? pinned : preview_images;

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  async function handleOpenPhotoPicker() {
    setShowMenu(false);
    setShowPhotoPicker(true);
    if (!recipes && !loadingRecipes) {
      setLoadingRecipes(true);
      try {
        const all = await getRecipes();
        setRecipes(all.filter(r => r.ai_category === category));
      } finally {
        setLoadingRecipes(false);
      }
    }
  }

  function toggleImage(url: string) {
    const next = pinned.includes(url)
      ? pinned.filter(u => u !== url)
      : pinned.length < 3 ? [...pinned, url] : pinned;
    setPinned(next);
    localStorage.setItem(pinnedKey(category), JSON.stringify(next));
  }

  const recipeImgs = (recipes ?? []).filter(r => r.image_url);

  return (
    <>
      <Link
        to={`/cookbooks/smart/${encodeURIComponent(category)}`}
        className="group block"
        style={{ textDecoration: 'none', position: 'relative' }}
      >
        <div
          className="relative overflow-hidden transition-all duration-300"
          style={{ borderRadius: 'var(--radius-lg)', aspectRatio: '1 / 1', border: '1px solid var(--border)', background: cardColor }}
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
          <div className="absolute inset-0" style={{ background: cardColor }} />

          {displayImages.length === 1 && (
            <img src={displayImages[0]} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ opacity: 0.8 }} />
          )}
          {displayImages.length === 2 && (
            <div className="absolute inset-0 flex flex-col">
              {displayImages.map((src, i) => (
                <div key={i} className="flex-1 overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ opacity: 0.8 }} />
                </div>
              ))}
              <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: 'rgba(0,0,0,0.4)' }} />
            </div>
          )}
          {displayImages.length >= 3 && (
            <div className="absolute inset-0 flex flex-col">
              <div className="overflow-hidden" style={{ flex: '1.4' }}>
                <img src={displayImages[0]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ opacity: 0.8 }} />
              </div>
              <div className="h-px" style={{ background: 'rgba(0,0,0,0.4)' }} />
              <div className="flex" style={{ flex: '1' }}>
                <div className="flex-1 overflow-hidden">
                  <img src={displayImages[1]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ opacity: 0.8 }} />
                </div>
                <div className="w-px" style={{ background: 'rgba(0,0,0,0.4)' }} />
                <div className="flex-1 overflow-hidden">
                  <img src={displayImages[2]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ opacity: 0.8 }} />
                </div>
              </div>
            </div>
          )}

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
              {[
                {
                  label: 'Edit cover',
                  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
                  onClick: handleOpenPhotoPicker,
                  danger: false,
                },
                {
                  label: 'Hide',
                  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
                  onClick: () => { setShowMenu(false); onHide?.(category); },
                  danger: true,
                },
              ].map(({ label, icon, onClick, danger }, i, arr) => (
                <button key={label} onClick={onClick}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-150"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500, color: danger ? '#E53E3E' : 'var(--text)', textAlign: 'left', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(229,62,62,0.07)' : 'var(--surface-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                >
                  {icon}{label}
                </button>
              ))}
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

      {/* Photo picker */}
      <BottomSheet open={showPhotoPicker} onClose={() => setShowPhotoPicker(false)} title="Cover Photos">
        <div style={{ minHeight: '80px' }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              {pinned.length > 0 ? `${pinned.length} / 3 selected` : 'Auto-selected from recipes'}
            </span>
          </div>
          {loadingRecipes ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid var(--border-strong)', borderTopColor: 'var(--accent)' }} />
            </div>
          ) : recipeImgs.length === 0 ? (
            <p className="text-center py-6" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>No recipe photos in this collection.</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2">
                {recipeImgs.map(r => {
                  const selected = pinned.includes(r.image_url!);
                  const maxed = !selected && pinned.length >= 3;
                  return (
                    <button key={r.id}
                      onClick={() => !maxed && toggleImage(r.image_url!)}
                      style={{
                        position: 'relative', aspectRatio: '1 / 1',
                        borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                        border: selected ? '2px solid var(--accent)' : '2px solid transparent',
                        cursor: maxed ? 'not-allowed' : 'pointer',
                        opacity: maxed ? 0.3 : 1,
                        background: 'none', padding: 0,
                        transition: 'border-color 0.15s, opacity 0.15s',
                      }}
                    >
                      <img src={r.image_url!} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {selected && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(244,102,150,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {pinned.length > 0 && (
                <button
                  onClick={() => { setPinned([]); localStorage.removeItem(pinnedKey(category)); }}
                  className="w-full mt-3 text-center transition-colors"
                  style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  Reset to auto
                </button>
              )}
            </>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
