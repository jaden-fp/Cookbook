import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import RecipeTile from '../components/RecipeTile';
import { getRecipes } from '../api';
import type { Recipe } from '../types';

export default function SmartCookbookDetailPage() {
  const { category } = useParams<{ category: string }>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const decodedCategory = category ? decodeURIComponent(category) : '';

  useEffect(() => {
    getRecipes()
      .then(all => setRecipes(all.filter(r => r.ai_category === decodedCategory)))
      .finally(() => setLoading(false));
  }, [decodedCategory]);

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
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
          }}>
            Smart Collection
          </p>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: '10px',
        }}>
          {decodedCategory}
        </h1>
        <div style={{ width: '32px', height: '3px', background: 'var(--accent)', borderRadius: '2px', marginBottom: '8px' }} />
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 400 }}>
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'} · auto-organised by AI
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', marginBottom: '28px' }} />

      {recipes.length === 0 ? (
        <div className="text-center py-20 animate-fade-up">
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            No recipes here yet
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Recipes with the <strong>{decodedCategory}</strong> category will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
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
