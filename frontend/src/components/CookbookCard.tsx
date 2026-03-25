import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Cookbook, Recipe } from '../types';
import { updateCookbook, getCookbookRecipes } from '../api';
import BottomSheet from './BottomSheet';

interface Props {
  cookbook: Cookbook;
  onUpdate: (updated: Cookbook) => void;
  onDelete?: (id: string) => Promise<void>;
}

const CARD_COLORS = ['#FFD6E7', '#D6EEFF', '#E8D6FF', '#D6FFF4', '#FFE8D6', '#F0D6FF'];
function idToColor(id: string) {
  const n = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CARD_COLORS[n % CARD_COLORS.length];
}

export default function CookbookCard({ cookbook, onUpdate, onDelete }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [renameName, setRenameName] = useState(cookbook.name);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pinned: string[] = cookbook.pinned_images ?? [];
  const displayImages = pinned.length > 0 ? pinned : (cookbook.preview_images ?? []);
  const cardColor = idToColor(cookbook.id);

  useEffect(() => {
    if (!showMenu) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  useEffect(() => {
    if (showRename) {
      setRenameName(cookbook.name);
      setTimeout(() => renameInputRef.current?.focus(), 50);
    }
  }, [showRename, cookbook.name]);

  async function handleOpenPhotoPicker() {
    setShowMenu(false);
    setShowPhotoPicker(true);
    if (!recipes && !loadingRecipes) {
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

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renameName.trim() || renaming) return;
    setRenaming(true);
    try {
      const updated = await updateCookbook(cookbook.id, { name: renameName.trim() });
      onUpdate(updated);
      setShowRename(false);
    } finally {
      setRenaming(false);
    }
  }

  async function handleDelete() {
    if (!onDelete || deleting) return;
    setDeleting(true);
    try {
      await onDelete(cookbook.id);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
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

          {/* Bottom scrim */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{ height: '70%', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />

          {/* Name + count */}
          <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3.5 pointer-events-none">
            <h3 className="line-clamp-2 leading-snug mb-0.5"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '1rem',
                color: 'white',
                letterSpacing: '-0.01em',
                textShadow: '0 1px 8px rgba(0,0,0,0.5)',
              }}>
              {cookbook.name}
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>
              {cookbook.recipe_count} {cookbook.recipe_count === 1 ? 'recipe' : 'recipes'}
            </p>
          </div>
        </div>
      </Link>

      {/* ··· menu button */}
      <button
        onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
        className="absolute flex items-center justify-center transition-all duration-200"
        style={{
          top: '8px', right: '8px',
          width: '34px', height: '34px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(15,12,30,0.1)',
          cursor: 'pointer',
          zIndex: 10,
          color: 'var(--text-muted)',
        }}
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
          style={{
            top: '46px', right: 0, zIndex: 30,
            background: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            minWidth: '160px',
            overflow: 'hidden',
          }}
          onClick={e => e.stopPropagation()}
        >
          {[
            {
              label: 'Rename',
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
              onClick: () => { setShowMenu(false); setShowRename(true); },
              danger: false,
            },
            {
              label: 'Edit cover',
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
              onClick: handleOpenPhotoPicker,
              danger: false,
            },
            ...(onDelete ? [{
              label: 'Delete',
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
              onClick: () => { setShowMenu(false); setShowDeleteConfirm(true); },
              danger: true,
            }] : []),
          ].map(({ label, icon, onClick, danger }, i, arr) => (
            <button
              key={label}
              onClick={onClick}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-150"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                color: danger ? '#E53E3E' : 'var(--text)',
                textAlign: 'left',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(229,62,62,0.07)' : 'var(--surface-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Photo picker bottom sheet */}
      <BottomSheet open={showPhotoPicker} onClose={() => setShowPhotoPicker(false)} title="Cover Photos">
        <div style={{ minHeight: '80px' }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              {saving ? 'Saving…' : pinned.length > 0 ? `${pinned.length} / 3 selected` : 'Auto-selected from recipes'}
            </span>
          </div>
          {loadingRecipes ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid var(--border-strong)', borderTopColor: 'var(--accent)' }} />
            </div>
          ) : recipeImgs.length === 0 ? (
            <p className="text-center py-6" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>No recipe photos yet.</p>
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
                <button onClick={() => savePinned([])}
                  className="w-full mt-3 text-center transition-colors"
                  style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
                  Reset to auto
                </button>
              )}
            </>
          )}
        </div>
      </BottomSheet>

      {/* Rename bottom sheet */}
      <BottomSheet open={showRename} onClose={() => setShowRename(false)} title="Rename Cookbook">
        <form onSubmit={handleRename} className="space-y-4">
          <input
            ref={renameInputRef}
            type="text"
            value={renameName}
            onChange={e => setRenameName(e.target.value)}
            placeholder="Cookbook name"
            className="w-full transition-all duration-200"
            style={{
              border: '1.5px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
              color: 'var(--text)',
              padding: '0.625rem 0.875rem',
              outline: 'none',
              background: 'var(--bg-subtle)',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowRename(false)}
              className="px-4 py-2 text-sm"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              Cancel
            </button>
            <button type="submit" disabled={!renameName.trim() || renaming}
              className="px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: 'var(--accent)', fontFamily: 'var(--font-body)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => { if (renameName.trim() && !renaming) e.currentTarget.style.background = '#D94E7A'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
            >
              {renaming ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Delete confirmation */}
      <BottomSheet open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Cookbook">
        <div className="space-y-4">
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Delete <strong style={{ color: 'var(--text)' }}>{cookbook.name}</strong>? This won't delete the recipes inside.
          </p>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-sm"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: '#E53E3E', fontFamily: 'var(--font-body)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = '#C53030'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#E53E3E'; }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
