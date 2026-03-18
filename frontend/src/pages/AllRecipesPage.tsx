import { useState, useEffect } from 'react';
import ImportBar from '../components/ImportBar';
import RecipeTile from '../components/RecipeTile';
import { getRecipes } from '../api';
import type { Recipe } from '../types';

export default function AllRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecipes()
      .then(setRecipes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up">
        <div>
          <p
            className="text-xs font-medium uppercase tracking-[0.18em] mb-1.5"
            style={{ color: 'var(--color-terra)', fontFamily: 'var(--font-body)' }}
          >
            Library
          </p>
          <h1
            className="text-3xl sm:text-4xl"
            style={{
              fontFamily: 'var(--font-editorial)',
              fontWeight: 700,
              color: 'var(--color-bark)',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            All Recipes
          </h1>
        </div>
        {!loading && recipes.length > 0 && (
          <p
            className="text-sm pb-1"
            style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}
          >
            {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
          </p>
        )}
      </div>

      {/* Import bar */}
      <div className="animate-fade-up delay-1">
        <ImportBar />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <div className="skeleton" style={{ aspectRatio: '4/3' }} />
              <div className="p-3.5 space-y-2">
                <div className="skeleton h-4 rounded-md w-3/4" />
                <div className="skeleton h-3 rounded-md w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-20 animate-fade-up">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--color-terra-muted)' }}
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--color-terra)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3
            className="text-lg mb-1"
            style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-bark)' }}
          >
            No recipes yet
          </h3>
          <p
            className="text-sm"
            style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}
          >
            Paste a recipe URL above to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {recipes.map((r, i) => (
            <div key={r.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <RecipeTile recipe={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
