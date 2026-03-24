import { useState, useEffect, useRef } from 'react';
import ImportBar from '../components/ImportBar';
import BottomSheet from '../components/BottomSheet';
import CookbookCard from '../components/CookbookCard';
import { getCookbooks, createCookbook } from '../api';
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

export default function CookbooksPage() {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>(
    () => (localStorage.getItem('cookbooks-sort') as SortOption) ?? 'newest'
  );
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCookbooks().then(setCookbooks).finally(() => setLoading(false));
  }, []);

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
      <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center mb-2 text-lg font-light">
        +
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
        New Cookbook
      </span>
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 pt-4 sm:pt-24 pb-24 sm:pb-16">

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

      {/* Import bar */}
      <div className="mb-4 animate-fade-up delay-1">
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
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select
              value={sort}
              onChange={e => {
                const val = e.target.value as SortOption;
                setSort(val);
                localStorage.setItem('cookbooks-sort', val);
              }}
              style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text)', background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: '999px', padding: '5px 30px 5px 12px', cursor: 'pointer', outline: 'none', appearance: 'none' }}
            >
              <option value="az">A → Z</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ position: 'absolute', right: '10px', pointerEvents: 'none', color: 'var(--text-muted)' }}>
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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
      ) : cookbooks.length === 0 ? (
        <div className="text-center py-24 animate-fade-up">
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
            No cookbooks yet
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Create a cookbook to organise your saved recipes.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 transition-all duration-200"
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '999px',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: '10px 24px',
              cursor: 'pointer',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#D94E7A'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
          >
            + Create Cookbook
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {sortCookbooks(cookbooks, sort).map((cb, i) => (
            <div key={cb.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <CookbookCard cookbook={cb} onUpdate={updated => setCookbooks(prev => prev.map(c => c.id === updated.id ? updated : c))} />
            </div>
          ))}
          <CreateTile />
        </div>
      )}

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
