import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import ImportBar from '../components/ImportBar';
import BottomSheet from '../components/BottomSheet';
import CookbookCard from '../components/CookbookCard';
import SmartCookbookCard from '../components/SmartCookbookCard';
import type { SmartCookbook } from '../components/SmartCookbookCard';
import { getCookbooks, createCookbook, deleteCookbook, getRecipes } from '../api';
import { useFAB } from '../context/FABContext';
import type { Cookbook } from '../types';

type SortOption = 'az' | 'newest' | 'oldest';

function sortCookbooks(cookbooks: Cookbook[], sort: SortOption): Cookbook[] {
  const sorted = [...cookbooks];
  switch (sort) {
    case 'az':     return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'newest': return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'oldest': return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }
}

function deriveSmartCookbooks(recipes: import('../types').Recipe[]): SmartCookbook[] {
  const byCategory = new Map<string, string[]>();
  for (const r of recipes) {
    if (!r.ai_category) continue;
    if (!byCategory.has(r.ai_category)) byCategory.set(r.ai_category, []);
    if (r.image_url) byCategory.get(r.ai_category)!.push(r.image_url);
  }
  return Array.from(byCategory.entries())
    .map(([category, images]) => ({
      category,
      recipe_count: recipes.filter(r => r.ai_category === category).length,
      preview_images: images.slice(0, 3),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export default function CookbooksPage() {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [smartCookbooks, setSmartCookbooks] = useState<SmartCookbook[]>([]);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>(
    () => JSON.parse(localStorage.getItem('hidden-smart-categories') ?? '[]')
  );
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>(
    () => (localStorage.getItem('cookbooks-sort') as SortOption) ?? 'newest'
  );
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const sortBtnRef = useRef<HTMLButtonElement>(null);
  const [sortPos, setSortPos] = useState({ top: 0, right: 0 });
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setAction } = useFAB();

  useEffect(() => {
    Promise.all([getCookbooks(), getRecipes()])
      .then(([cbs, recipes]) => {
        setCookbooks(cbs);
        setSmartCookbooks(deriveSmartCookbooks(recipes));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setAction(() => setShowImport(true));
    return () => setAction(null);
  }, [setAction]);

  useEffect(() => {
    if (!showSort) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSort]);

  useEffect(() => {
    if (showCreate) {
      setTimeout(() => inputRef.current?.focus(), 50);
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowCreate(false); };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [showCreate]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim() || creating) return;
    setCreating(true);
    try {
      const cookbook = await createCookbook(createName.trim());
      setCookbooks(prev => [...prev, cookbook]);
      setCreateName('');
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  }

  const CreateTile = () => (
    <button
      onClick={() => setShowCreate(true)}
      className="flex flex-col items-center justify-center transition-all duration-200"
      style={{
        border: '1.5px dashed var(--border-strong)',
        color: 'var(--text-muted)',
        borderRadius: 'var(--radius-lg)',
        aspectRatio: '1 / 1',
        width: '100%',
        background: 'transparent',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.color = 'var(--accent)';
        e.currentTarget.style.background = 'var(--accent-dim)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-strong)';
        e.currentTarget.style.color = 'var(--text-muted)';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center mb-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
          <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
        </svg>
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
        New Cookbook
      </span>
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 pt-4 sm:pt-24 pb-32 sm:pb-16">

      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: '6px',
        }}>
          Your Library
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: '10px',
        }}>
          Cookbooks
        </h1>
        <div style={{ width: '40px', height: '3px', background: 'var(--accent)', borderRadius: '2px' }} />
      </div>

      {/* Import bar — desktop only */}
      <div className="hidden sm:block mb-4 animate-fade-up delay-1">
        <ImportBar />
      </div>

      {/* Divider + meta row */}
      <div className="flex items-center justify-between mb-8 animate-fade-up delay-2"
        style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}
      >
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 400 }}>
          {loading ? '' : `${cookbooks.length} ${cookbooks.length === 1 ? 'cookbook' : 'cookbooks'}`}
        </p>
        {!loading && cookbooks.length > 0 && (
          <div ref={sortRef} style={{ position: 'relative' }}>
            <button
              ref={sortBtnRef}
              onClick={() => {
                const rect = sortBtnRef.current?.getBoundingClientRect();
                if (rect) setSortPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
                setShowSort(v => !v);
              }}
              className="sort-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontFamily: 'var(--font-body)', fontWeight: 500,
                color: 'var(--text)', background: 'var(--surface)',
                border: '1.5px solid var(--border-strong)',
                borderRadius: '999px', cursor: 'pointer', outline: 'none',
              }}
            >
              {{ az: 'A → Z', newest: 'Newest first', oldest: 'Oldest first' }[sort]}
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--text-muted)' }}>
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showSort && createPortal(
              <div ref={sortRef}
                style={{
                  position: 'absolute', top: sortPos.top, right: sortPos.right, zIndex: 9999,
                  background: 'var(--surface)', border: '1.5px solid var(--border-strong)',
                  borderRadius: '10px', overflow: 'hidden', minWidth: '120px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                }}
              >
                {(['az', 'newest', 'oldest'] as SortOption[]).map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setSort(opt); localStorage.setItem('cookbooks-sort', opt); setShowSort(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 14px', border: 'none',
                      background: opt === sort ? 'var(--accent-dim)' : 'transparent',
                      color: opt === sort ? 'var(--accent)' : 'var(--text)',
                      fontFamily: 'var(--font-body)', fontWeight: opt === sort ? 600 : 400,
                      fontSize: '0.8125rem', cursor: 'pointer',
                    }}
                  >
                    {{ az: 'A → Z', newest: 'Newest first', oldest: 'Oldest first' }[opt]}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ borderRadius: 'var(--radius-lg)', aspectRatio: '1 / 1' }} />
          ))}
        </div>
      ) : (() => {
        const visibleSmart = smartCookbooks.filter(sc => !hiddenCategories.includes(sc.category));
        const sorted = sortCookbooks(cookbooks, sort);

        // Build merged list: A-Z mixes all by name; newest/oldest keeps manual order, smart appended alpha
        type Entry = { type: 'smart'; data: SmartCookbook } | { type: 'manual'; data: typeof cookbooks[0] };
        let entries: Entry[];
        if (sort === 'az') {
          entries = [
            ...sorted.map(c => ({ type: 'manual' as const, data: c })),
            ...visibleSmart.map(s => ({ type: 'smart' as const, data: s })),
          ].sort((a, b) => {
            const nameA = a.type === 'manual' ? a.data.name : a.data.category;
            const nameB = b.type === 'manual' ? b.data.name : b.data.category;
            return nameA.localeCompare(nameB);
          });
        } else {
          entries = [
            ...visibleSmart.map(s => ({ type: 'smart' as const, data: s })),
            ...sorted.map(c => ({ type: 'manual' as const, data: c })),
          ];
        }

        if (entries.length === 0) return (
          <div className="text-center py-24 animate-fade-up">
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>No cookbooks yet</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Create a cookbook to organise your saved recipes.</p>
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 transition-all duration-200"
              style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '999px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', padding: '10px 24px', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#D94E7A'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
            >+ Create Cookbook</button>
          </div>
        );

        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {entries.map((entry, i) => (
              <div key={entry.type === 'smart' ? `smart-${entry.data.category}` : entry.data.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                {entry.type === 'smart' ? (
                  <SmartCookbookCard
                    {...entry.data}
                    onHide={cat => {
                      const next = [...hiddenCategories, cat];
                      setHiddenCategories(next);
                      localStorage.setItem('hidden-smart-categories', JSON.stringify(next));
                    }}
                  />
                ) : (
                  <CookbookCard
                    cookbook={entry.data}
                    onUpdate={updated => setCookbooks(prev => prev.map(c => c.id === updated.id ? updated : c))}
                    onDelete={async id => { await deleteCookbook(id); setCookbooks(prev => prev.filter(c => c.id !== id)); }}
                  />
                )}
              </div>
            ))}
            <div><CreateTile /></div>
          </div>
        );
      })()}

      {/* Import modal — mobile FAB */}
      <BottomSheet open={showImport} onClose={() => setShowImport(false)} title="Import Recipe">
        <ImportBar onSuccess={() => setShowImport(false)} />
      </BottomSheet>

      {/* Create modal */}
      <BottomSheet open={showCreate} onClose={() => setShowCreate(false)} title="New Cookbook">
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={createName}
            onChange={e => setCreateName(e.target.value)}
            placeholder="e.g. Weeknight Dinners"
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
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm rounded-lg transition-all duration-150"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!createName.trim() || creating}
              className="px-5 py-2 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40"
              style={{
                background: 'var(--accent)',
                fontFamily: 'var(--font-body)',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (createName.trim() && !creating) e.currentTarget.style.background = '#D94E7A'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
