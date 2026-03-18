import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import RecipeTile from '../components/RecipeTile';
import { getCookbook, getCookbookRecipes } from '../api';
import type { Recipe, Cookbook } from '../types';

export default function CookbookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const numId = parseInt(id);
    Promise.all([getCookbook(numId), getCookbookRecipes(numId)])
      .then(([cb, recs]) => { setCookbook(cb); setRecipes(recs); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="skeleton h-8 w-48 rounded-lg mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <div className="skeleton" style={{ aspectRatio: '4/3' }} />
              <div className="p-3.5 space-y-2">
                <div className="skeleton h-4 rounded-md w-3/4" />
                <div className="skeleton h-3 rounded-md w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!cookbook) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}>Cookbook not found.</p>
        <Link to="/cookbooks" className="text-sm mt-2 inline-block" style={{ color: 'var(--color-terra)' }}>
          Back to Cookbooks
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Breadcrumb + header */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-2 mb-3">
          <Link
            to="/cookbooks"
            className="text-sm transition-colors duration-200"
            style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-terra)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-bark-muted)'; }}
          >
            Cookbooks
          </Link>
          <span style={{ color: 'var(--color-warm-border)' }}>/</span>
          <span className="text-sm" style={{ color: 'var(--color-bark-mid)', fontFamily: 'var(--font-body)' }}>
            {cookbook.name}
          </span>
        </div>
        <h1
          className="text-3xl"
          style={{
            fontFamily: 'var(--font-editorial)',
            fontWeight: 700,
            color: 'var(--color-bark)',
            letterSpacing: '-0.01em',
          }}
        >
          {cookbook.name}
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}
        >
          {cookbook.recipe_count} {cookbook.recipe_count === 1 ? 'recipe' : 'recipes'}
        </p>
      </div>

      {/* Recipes */}
      {recipes.length === 0 ? (
        <div className="text-center py-20 animate-fade-up">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--color-forest-muted)' }}
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--color-forest)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3
            className="text-lg mb-1"
            style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-bark)' }}
          >
            Empty cookbook
          </h3>
          <p
            className="text-sm"
            style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}
          >
            Open a recipe and click "+ Cookbook" to add it here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {recipes.map((r, i) => (
            <div key={r.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <RecipeTile recipe={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
