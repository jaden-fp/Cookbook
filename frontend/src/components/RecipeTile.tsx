import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Recipe } from '../types';
import CookbookModal from './CookbookModal';

interface Props {
  recipe: Recipe;
}

export default function RecipeTile({ recipe }: Props) {
  const [showCookbook, setShowCookbook] = useState(false);

  return (
    <>
      {showCookbook && (
        <CookbookModal recipeId={recipe.id} onClose={() => setShowCookbook(false)} />
      )}
      <Link
        to={`/recipes/${recipe.id}`}
        className="group relative block overflow-hidden transition-all duration-300"
        style={{
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          textDecoration: 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 16px 40px rgba(240,40,106,0.12), 0 4px 16px rgba(15,12,30,0.08), 0 0 0 1px var(--border-strong)';
          e.currentTarget.style.borderColor = 'var(--border-strong)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        {/* Image */}
        <div className="relative overflow-hidden" style={{ height: '200px' }}>
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--purple-lt) 0%, var(--teal-lt) 100%)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(15,12,30,0.15)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18M3 7a4 4 0 008 0V3M7 21v-7M21 3v4a3 3 0 01-3 3v11" />
              </svg>
            </div>
          )}

          {/* gradient overlay */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }} />

          {/* Rating badge */}
          {recipe.rating != null && (
            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1"
              style={{
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(8px)',
                borderRadius: '999px',
                padding: '3px 8px',
                border: '1px solid rgba(15,12,30,0.08)',
              }}>
              <span style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'var(--font-body)', fontWeight: 700 }}>
                ★ {recipe.rating}
              </span>
            </div>
          )}

          {/* Cookbook button */}
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setShowCookbook(true); }}
            title="Add to cookbook"
            className="absolute bottom-2 right-2 z-10 flex items-center justify-center rounded-full transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100"
            style={{
              width: '36px', height: '36px',
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(15,12,30,0.1)',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.88)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(15,12,30,0.1)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </button>
        </div>

        {/* Text */}
        <div style={{ padding: '14px 16px 14px' }}>
          <h3 className="line-clamp-2 leading-snug"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.0625rem',
              fontWeight: 500,
              color: 'var(--text)',
              letterSpacing: '-0.01em',
              marginBottom: '5px',
            }}>
            {recipe.title}
          </h3>
          {(recipe.prep_time || recipe.cook_time) && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
              {[
                recipe.prep_time && `${recipe.prep_time} prep`,
                recipe.cook_time && `${recipe.cook_time} cook`,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </Link>
    </>
  );
}
