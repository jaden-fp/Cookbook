import { useState, useEffect } from 'react';
import ImportBar from '../components/ImportBar';
import BottomSheet from '../components/BottomSheet';
import RecipeTile from '../components/RecipeTile';
import { getRecipes } from '../api';
import { useFAB } from '../context/FABContext';
import type { Recipe } from '../types';

type SortOption = 'az' | 'newest' | 'oldest' | 'rating';

function sortRecipes(recipes: Recipe[], sort: SortOption): Recipe[] {
  const sorted = [...recipes];
  switch (sort) {
    case 'az':      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'newest':  return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'oldest':  return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case 'rating':  return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }
}

export default function AllRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>(
    () => (localStorage.getItem('recipes-sort') as SortOption) ?? 'newest'
  );
  const [showImportSheet, setShowImportSheet] = useState(false);
  const { setAction } = useFAB();

  useEffect(() => {
    getRecipes().then(setRecipes).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setAction(() => setShowImportSheet(true));
    return () => setAction(null);
  }, [setAction]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 pt-3 sm:pt-24 pb-24 sm:pb-16">

      {/* Page header */}
      <div className="block mb-6 sm:mb-10 animate-fade-up">
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: '6px',
        }}>
          The Collection
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
          All Recipes
        </h1>
        <div style={{ width: '40px', height: '3px', background: 'var(--accent)', borderRadius: '2px' }} />
      </div>

      {/* Import bar — desktop only; mobile uses FAB sheet */}
      <div className="hidden sm:block mb-4 animate-fade-up delay-1">
        <ImportBar />
      </div>

      <BottomSheet open={showImportSheet} onClose={() => setShowImportSheet(false)} title="Import Recipe">
        <ImportBar />
      </BottomSheet>

      {/* Divider + sort row */}
      <div className="flex items-center justify-between mb-8 animate-fade-up delay-2"
        style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}
      >
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 400 }}>
          {loading ? '' : `${recipes.length} ${recipes.length === 1 ? 'recipe' : 'recipes'}`}
        </p>

        {!loading && recipes.length > 0 && (
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select
              className="sort-select"
              value={sort}
              onChange={e => {
                const val = e.target.value as SortOption;
                setSort(val);
                localStorage.setItem('recipes-sort', val);
              }}
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                color: 'var(--text)',
                background: 'var(--surface)',
                border: '1.5px solid var(--border-strong)',
                borderRadius: '999px',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            >
              <option value="az">A → Z</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="rating">Top rated</option>
            </select>
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none"
              style={{ position: 'absolute', right: '10px', pointerEvents: 'none', color: 'var(--text-muted)' }}
            >
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="overflow-hidden" style={{ borderRadius: 'var(--radius-lg)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="skeleton" style={{ height: '190px' }} />
              <div style={{ padding: '12px 14px 10px' }} className="space-y-2">
                <div className="skeleton h-4 rounded w-4/5" />
                <div className="skeleton h-3 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-24 animate-fade-up">
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: '6px',
          }}>
            No recipes yet
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Paste a recipe URL above to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {sortRecipes(recipes, sort).map((r, i) => (
            <div key={r.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <RecipeTile recipe={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
