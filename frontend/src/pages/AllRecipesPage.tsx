import { useState, useEffect } from 'react';
import ImportBar from '../components/ImportBar';
import RecipeTile from '../components/RecipeTile';
import { getRecipes } from '../api';
import type { Recipe } from '../types';

type SortOption = 'newest' | 'oldest' | 'az' | 'za' | 'rating';

function sortRecipes(recipes: Recipe[], sort: SortOption): Recipe[] {
  const sorted = [...recipes];
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case 'az':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'za':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'rating':
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }
}

export default function AllRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>(
    () => (localStorage.getItem('recipes-sort') as SortOption) ?? 'newest'
  );

  useEffect(() => {
    getRecipes()
      .then(setRecipes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-12 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 animate-fade-up">
        <div>
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
            All Recipes
          </h1>
          <p style={{ color: 'rgba(81,42,24,0.55)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', marginTop: '4px' }}>
            Everything you've saved
          </p>
        </div>
        {!loading && recipes.length > 0 && (
          <div className="flex items-center gap-3 pt-1">
            <p
              className="text-sm"
              style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
            </p>
            <select
              value={sort}
              onChange={e => {
                const val = e.target.value as SortOption;
                setSort(val);
                localStorage.setItem('recipes-sort', val);
              }}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: '#512A18',
                background: 'white',
                border: '1px solid rgba(81,42,24,0.18)',
                borderRadius: '8px',
                padding: '4px 10px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        )}
      </div>

      {/* Import bar */}
      <div className="mb-6 animate-fade-up delay-1">
        <ImportBar />
      </div>
      <div style={{ borderBottom: '1px solid #FFC3E8', marginBottom: '24px' }} />

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ background: 'white', borderRadius: '12px' }}>
              <div className="skeleton" style={{ height: '180px' }} />
              <div className="p-3.5 space-y-2">
                <div className="skeleton h-4 rounded-md w-3/4" />
                <div className="skeleton h-3 rounded-md w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-20 animate-fade-up">
          <div className="flex justify-center mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFC3E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18M3 7a4 4 0 008 0V3M7 21v-7M21 3v4a3 3 0 01-3 3v11" />
            </svg>
          </div>
          <h3
            className="text-lg mb-1"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: '#512A18' }}
          >
            No recipes yet
          </h3>
          <p
            className="text-sm"
            style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)' }}
          >
            Paste a recipe URL above to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
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
