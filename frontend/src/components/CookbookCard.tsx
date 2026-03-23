import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Cookbook, Recipe } from '../types';
import { updateCookbook, getCookbookRecipes } from '../api';

interface Props {
  cookbook: Cookbook;
  onUpdate: (updated: Cookbook) => void;
}

const CARD_COLORS = [
  '#C4722A', '#8B9E7A', '#A07060', '#7A8E9E', '#9E7A8E', '#8E9A6A',
];
function idToColor(id: string) {
  const n = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CARD_COLORS[n % CARD_COLORS.length];
}

export default function CookbookCard({ cookbook, onUpdate }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const pinned: string[] = cookbook.pinned_images ?? [];
  const displayImages = pinned.length > 0 ? pinned : (cookbook.preview_images ?? []);
  const cardColor = idToColor(cookbook.id);

  useEffect(() => {
    if (!showPicker) return;
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  async function handleOpenPicker() {
    const next = !showPicker;
    setShowPicker(next);
    if (next && !recipes && !loadingRecipes) {
      setLoadingRecipes(true);
      try { setRecipes(await getCookbookRecipes(cookbook.id)); }
      finally { setLoadingRecipes(false); }
    }
  }

  function savePinned(next: string[]) {
    onUpdate({ ...cookbook, pinned_images: next });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try { onUpdate(await updateCookbook(cookbook.id, { pinned_images: next })); }
      finally { setSaving(false); }
    }, 400);
  }

  function toggleImage(url: string) {
    if (pinned.includes(url)) savePinned(pinned.filter(u => u !== url));
    else if (pinned.length < 3) savePinned([...pinned, url]);
  }

  const recipeImgs = (recipes ?? []).filter(r => r.image_url);

  return (
    <div style={{ position: 'relative' }}>
      <Link to={`/cookbooks/${cookbook.id}`} className="group block" style={{ textDecoration: 'none' }}>
        <div
          className="relative overflow-hidden transition-all duration-300"
          style={{
            borderRadius: 'var(--radius-lg)',
            aspectRatio: '1 / 1',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--bone)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--sand)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
            (e.currentTarget as HTMLDivElement).style.transform = '';
            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--bone)';
          }}
        >
          {/* Color bg */}
          <div className="absolute inset-0" style={{ background: cardColor, opacity: 0.85 }} />

          {/* Images */}
          {displayImages.length === 1 && (
            <img src={displayImages[0]} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          )}
          {displayImages.length === 2 && (
            <div className="absolute inset-0 flex flex-col">
              {displayImages.map((src, i) => (
                <div key={i} className="flex-1 overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
              ))}
              <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
            </div>
          )}
          {displayImages.length >= 3 && (
            <div className="absolute inset-0 flex flex-col">
              <div className="overflow-hidden" style={{ flex: '1.4' }}>
                <img src={displayImages[0]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <div className="flex" style={{ flex: '1' }}>
                <div className="flex-1 overflow-hidden">
                  <img src={displayImages[1]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="w-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
                <div className="flex-1 overflow-hidden">
                  <img src={displayImages[2]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
              </div>
            </div>
          )}

          {/* Scrim */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{ height: '65%', background: 'linear-gradient(to top, rgba(26,10,4,0.72) 0%, rgba(26,10,4,0.2) 55%, transparent 100%)' }}
          />

          {/* Name + count */}
          <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3.5 pointer-events-none">
            <h3 className="line-clamp-2 leading-snug mb-0.5"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '1rem',
                color: 'white',
                letterSpacing: '-0.01em',
                textShadow: '0 1px 6px rgba(0,0,0,0.3)',
              }}
            >
              {cookbook.name}
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', fontWeight: 400, color: 'rgba(255,255,255,0.65)' }}>
              {cookbook.recipe_count} {cookbook.recipe_count === 1 ? 'recipe' : 'recipes'}
            </p>
          </div>
        </div>
      </Link>

      {/* Photo edit button */}
      <button
        onClick={e => { e.stopPropagation(); handleOpenPicker(); }}
        className="absolute flex items-center justify-center transition-all duration-200"
        style={{
          top: '8px', right: '8px',
          width: '26px', height: '26px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(4px)',
          boxShadow: 'var(--shadow-sm)',
          border: 'none', cursor: 'pointer', zIndex: 10,
        }}
        title="Edit cover photos"
        onMouseEnter={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.88)'; e.currentTarget.style.transform = ''; }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--caramel)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </button>

      {/* Photo picker */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute animate-scale-in"
          style={{
            top: '42px', right: 0, zIndex: 30,
            background: 'white',
            border: '1px solid var(--bone)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '12px',
            width: '192px',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--espresso)', fontFamily: 'var(--font-body)' }}>Cover Photos</span>
            <span style={{ fontSize: '0.6875rem', color: saving ? 'var(--caramel)' : 'var(--muted)', fontFamily: 'var(--font-body)' }}>
              {saving ? 'Saving…' : pinned.length > 0 ? `${pinned.length} / 3` : 'auto'}
            </span>
          </div>

          {loadingRecipes ? (
            <div className="flex justify-center py-5">
              <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid var(--bone)', borderTopColor: 'var(--caramel)' }} />
            </div>
          ) : recipeImgs.length === 0 ? (
            <p className="text-center py-4" style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>No recipe photos yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-1.5">
                {recipeImgs.map(r => {
                  const selected = pinned.includes(r.image_url!);
                  const maxed = !selected && pinned.length >= 3;
                  return (
                    <button key={r.id}
                      onClick={() => !maxed && toggleImage(r.image_url!)}
                      style={{
                        position: 'relative', aspectRatio: '1 / 1',
                        borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                        border: selected ? '2px solid var(--caramel)' : '2px solid transparent',
                        cursor: maxed ? 'not-allowed' : 'pointer',
                        opacity: maxed ? 0.35 : 1,
                        background: 'none', padding: 0,
                        transition: 'border-color 0.15s, opacity 0.15s',
                      }}
                    >
                      <img src={r.image_url!} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {selected && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(196,114,42,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--caramel)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
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
                <button onClick={() => savePinned([])}
                  className="w-full mt-2 text-center transition-colors"
                  style={{ fontSize: '0.6875rem', color: 'var(--muted)', fontFamily: 'var(--font-body)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--caramel)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; }}
                >
                  Reset to auto
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
