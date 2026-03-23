import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ImportBar from '../components/ImportBar';
import CookbookCard from '../components/CookbookCard';
import { getCookbooks, createCookbook } from '../api';
import type { Cookbook } from '../types';

export default function CookbooksPage() {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [loading, setLoading] = useState(true);
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
        border: '1.5px dashed var(--bone)',
        color: 'var(--muted)',
        borderRadius: 'var(--radius-lg)',
        aspectRatio: '1 / 1',
        width: '100%',
        background: 'transparent',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--caramel)';
        e.currentTarget.style.color = 'var(--caramel)';
        e.currentTarget.style.background = 'rgba(196,114,42,0.04)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--bone)';
        e.currentTarget.style.color = 'var(--muted)';
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
    <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-12 pb-16">

      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--caramel)',
          marginBottom: '6px',
        }}>
          Your Library
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
          color: 'var(--espresso)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: '10px',
        }}>
          Cookbooks
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'var(--caramel)', borderRadius: '2px' }} />
      </div>

      {/* Import bar */}
      <div className="mb-10 animate-fade-up delay-1">
        <ImportBar />
      </div>

      {/* Divider + meta row */}
      <div className="flex items-center justify-between mb-8 animate-fade-up delay-2"
        style={{ borderTop: '1px solid var(--bone)', paddingTop: '20px' }}
      >
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--muted)', fontWeight: 400 }}>
          {loading ? '' : `${cookbooks.length} ${cookbooks.length === 1 ? 'cookbook' : 'cookbooks'}`}
        </p>
        <Link
          to="/recipes"
          style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--muted)', fontWeight: 400, textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--caramel)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; }}
        >
          View all recipes →
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ borderRadius: 'var(--radius-lg)', aspectRatio: '1 / 1' }} />
          ))}
        </div>
      ) : cookbooks.length === 0 ? (
        <div className="text-center py-24 animate-fade-up">
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500, fontStyle: 'italic', color: 'var(--muted)', marginBottom: '6px' }}>
            No cookbooks yet
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '20px' }}>
            Create a cookbook to organise your saved recipes.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 transition-all duration-200"
            style={{
              background: 'var(--caramel)',
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
            onMouseEnter={e => { e.currentTarget.style.background = '#A85E22'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--caramel)'; }}
          >
            + Create Cookbook
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {cookbooks.map((cb, i) => (
            <div key={cb.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <CookbookCard cookbook={cb} onUpdate={updated => setCookbooks(prev => prev.map(c => c.id === updated.id ? updated : c))} />
            </div>
          ))}
          <CreateTile />
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          style={{ background: 'rgba(26,10,4,0.45)' }}
          onClick={e => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div
            className="w-full max-w-xs animate-scale-in"
            style={{
              background: 'white',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--bone)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--cream-deep)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.375rem', color: 'var(--espresso)', letterSpacing: '-0.01em' }}>
                New Cookbook
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 text-lg leading-none"
                style={{ color: 'var(--muted)', border: 'none', background: 'transparent', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream-deep)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <input
                ref={inputRef}
                type="text"
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                placeholder="e.g. Weeknight Dinners"
                className="w-full transition-all duration-200"
                style={{
                  border: '1.5px solid var(--bone)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  color: 'var(--espresso)',
                  padding: '0.625rem 0.875rem',
                  outline: 'none',
                  background: 'var(--cream)',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--caramel)'; e.target.style.boxShadow = '0 0 0 3px rgba(196,114,42,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--bone)'; e.target.style.boxShadow = 'none'; }}
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm rounded-lg transition-all duration-150"
                  style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream-deep)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!createName.trim() || creating}
                  className="px-5 py-2 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40"
                  style={{
                    background: 'var(--caramel)',
                    fontFamily: 'var(--font-body)',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (createName.trim() && !creating) e.currentTarget.style.background = '#A85E22'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--caramel)'; }}
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
