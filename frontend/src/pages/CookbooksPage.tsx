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
    getCookbooks()
      .then(setCookbooks)
      .finally(() => setLoading(false));
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
        border: '2px dashed #FFC3E8',
        color: '#FF61B4',
        borderRadius: '16px',
        aspectRatio: '1 / 1',
        width: '100%',
        background: '#FFFFFF',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#FF61B4';
        e.currentTarget.style.background = '#FFF0F8';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#FFC3E8';
        e.currentTarget.style.background = '#FFFFFF';
      }}
    >
      <div
        className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center mb-2 text-lg font-light"
        style={{ color: '#FF61B4' }}
      >
        +
      </div>
      <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-body)', color: '#FF61B4' }}>
        Create New Cookbook
      </span>
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-12 pb-10">
      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <h1
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 800,
            fontSize: '1.625rem',
            color: '#512A18',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          Your Cookbooks
        </h1>
        <p style={{ color: 'rgba(81,42,24,0.55)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', marginTop: '4px' }}>
          Organize your saved recipes
        </p>
      </div>

      {/* Import bar */}
      <div className="mb-6 animate-fade-up delay-1">
        <ImportBar />
      </div>
      <div style={{ borderBottom: '1px solid #FFC3E8', marginBottom: '24px' }} />

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ borderRadius: '16px', aspectRatio: '1 / 1' }} />
          ))}
        </div>
      ) : cookbooks.length === 0 ? (
        <div className="text-center py-16 animate-fade-up">
          <div className="flex justify-center mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFC3E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3
            className="text-lg mb-1"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: '#512A18' }}
          >
            No cookbooks yet
          </h3>
          <p
            className="text-sm mb-6"
            style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)' }}
          >
            Create a cookbook to organize your saved recipes.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200"
            style={{ background: '#FF61B4', borderRadius: '8px', fontFamily: 'var(--font-body)' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E0489E'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FF61B4'; }}
          >
            + Create Cookbook
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p
              className="text-sm"
              style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              {cookbooks.length} {cookbooks.length === 1 ? 'cookbook' : 'cookbooks'}
            </p>
            <Link
              to="/recipes"
              className="text-sm transition-colors duration-200"
              style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FF61B4'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(81,42,24,0.55)'; }}
            >
              View all recipes →
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {cookbooks.map((cb, i) => (
              <div key={cb.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <CookbookCard
                  cookbook={cb}
                  onUpdate={updated => setCookbooks(prev => prev.map(c => c.id === updated.id ? updated : c))}
                />
              </div>
            ))}
            <CreateTile />
          </div>
        </>
      )}

      {/* Create cookbook modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          style={{ background: 'rgba(81,42,24,0.4)' }}
          onClick={e => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-2xl animate-scale-in"
            style={{
              border: '1px solid #FFC3E8',
              boxShadow: '0 20px 60px rgba(81,42,24,0.15)',
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #FFC3E8' }}
            >
              <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.0625rem', color: '#512A18' }}>
                New Cookbook
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-xl leading-none"
                style={{ color: 'rgba(81,42,24,0.55)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FFF0F8'; }}
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
                  border: '1.5px solid #FFC3E8',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  color: '#512A18',
                  padding: '0.625rem 0.875rem',
                  outline: 'none',
                  background: 'white',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#FF61B4';
                  e.target.style.boxShadow = '0 0 0 3px rgba(255,97,180,0.10)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#FFC3E8';
                  e.target.style.boxShadow = 'none';
                }}
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm rounded-lg transition-colors duration-200"
                  style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FFF0F8'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!createName.trim() || creating}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#FF61B4', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={e => { if (createName.trim() && !creating) e.currentTarget.style.background = '#E0489E'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FF61B4'; }}
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
