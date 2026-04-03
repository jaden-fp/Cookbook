import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import RecipeTile from '../components/RecipeTile';
import { getRecipes } from '../api';
import type { Recipe } from '../types';

type SortOption = 'az' | 'newest' | 'oldest' | 'top-rated';
const SORT_LABELS: Record<SortOption, string> = { az: 'A → Z', newest: 'Newest', oldest: 'Oldest', 'top-rated': 'Top rated' };

function sortRecipes(recipes: Recipe[], sort: SortOption): Recipe[] {
  const r = [...recipes];
  if (sort === 'az') return r.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === 'newest') return r.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (sort === 'oldest') return r.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  if (sort === 'top-rated') return r.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return r;
}

export default function SmartCookbookDetailPage() {
  const { category } = useParams<{ category: string }>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>('newest');
  const [showSort, setShowSort] = useState(false);
  const sortBtnRef = useRef<HTMLButtonElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [sortPos, setSortPos] = useState({ top: 0, right: 0 });

  const decodedCategory = category ? decodeURIComponent(category) : '';

  useEffect(() => {
    getRecipes()
      .then(all => setRecipes(all.filter(r => r.ai_category === decodedCategory)))
      .finally(() => setLoading(false));
  }, [decodedCategory]);

  useEffect(() => {
    if (!showSort) return;
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node) &&
          sortBtnRef.current && !sortBtnRef.current.contains(e.target as Node)) {
        setShowSort(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSort]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <div className="skeleton h-8 w-48 rounded-lg mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden" style={{ borderRadius: 'var(--radius-lg)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="skeleton" style={{ height: '190px' }} />
              <div style={{ padding: '12px 14px 10px' }} className="space-y-2">
                <div className="skeleton h-4 rounded w-4/5" />
                <div className="skeleton h-3 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 pt-4 sm:pt-24 pb-32 sm:pb-16">
      <div className="mb-10 animate-fade-up">
        <Link
          to="/cookbooks"
          className="inline-flex items-center gap-1 text-sm mb-5 transition-colors duration-200"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 400, textDecoration: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          ← Cookbooks
        </Link>

        <div className="flex items-center gap-1.5 mb-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--accent)">
            <path d="M12 2C12 2 13 8 18 9C13 10 12 16 12 16C12 16 11 10 6 9C11 8 12 2 12 2Z" />
            <path d="M19 3C19 3 19.5 5.5 21.5 6C19.5 6.5 19 9 19 9C19 9 18.5 6.5 16.5 6C18.5 5.5 19 3 19 3Z" />
            <path d="M5 17C5 17 5.5 19.5 7.5 20C5.5 20.5 5 23 5 23C5 23 4.5 20.5 2.5 20C4.5 19.5 5 17 5 17Z" />
          </svg>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            Smart Collection
          </p>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '10px' }}>
          {decodedCategory}
        </h1>
        <div style={{ width: '32px', height: '3px', background: 'var(--accent)', borderRadius: '2px' }} />
      </div>

      <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '28px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
        </p>
        {recipes.length > 1 && (
          <button
            ref={sortBtnRef}
            onClick={() => {
              const rect = sortBtnRef.current?.getBoundingClientRect();
              if (rect) setSortPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
              setShowSort(v => !v);
            }}
            className="sort-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--text)', background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: '999px', cursor: 'pointer', outline: 'none' }}
          >
            {SORT_LABELS[sort]}
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--text-muted)' }}>
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        {showSort && createPortal(
          <div ref={sortMenuRef} style={{ position: 'absolute', top: sortPos.top, right: sortPos.right, zIndex: 9999, background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: '10px', overflow: 'hidden', minWidth: '120px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            {(Object.keys(SORT_LABELS) as SortOption[]).map(opt => (
              <button key={opt} onClick={() => { setSort(opt); setShowSort(false); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: opt === sort ? 'var(--accent-dim)' : 'transparent', color: opt === sort ? 'var(--accent)' : 'var(--text)', fontFamily: 'var(--font-body)', fontWeight: opt === sort ? 600 : 400, fontSize: '0.8125rem', cursor: 'pointer' }}
              >{SORT_LABELS[opt]}</button>
            ))}
          </div>,
          document.body
        )}
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-20 animate-fade-up">
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>No recipes here yet</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Recipes with the <strong>{decodedCategory}</strong> category will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {sortRecipes(recipes, sort).map((r, i) => (
            <div key={r.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <RecipeTile recipe={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
