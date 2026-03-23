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
          background: 'white',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--bone)',
          textDecoration: 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = 'var(--sand)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.borderColor = 'var(--bone)';
        }}
      >
        {/* Image */}
        <div className="relative overflow-hidden" style={{ height: '190px' }}>
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: 'var(--cream-deep)' }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--sand)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18M3 7a4 4 0 008 0V3M7 21v-7M21 3v4a3 3 0 01-3 3v11" />
              </svg>
            </div>
          )}

          {/* Subtle bottom fade */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{ height: '40%', background: 'linear-gradient(to top, rgba(26,10,4,0.25) 0%, transparent 100%)' }}
          />

          {/* Rating badge */}
          {recipe.rating != null && (
            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1"
              style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(6px)',
                borderRadius: '999px',
                padding: '3px 8px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span style={{ fontSize: '10px', color: 'var(--caramel)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                ★ {recipe.rating}
              </span>
            </div>
          )}

          {/* Add to cookbook */}
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setShowCookbook(true); }}
            title="Add to cookbook"
            className="absolute bottom-2 right-2 z-10 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
            style={{
              width: '28px', height: '28px',
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(4px)',
              border: 'none', cursor: 'pointer',
              color: 'var(--bark)',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--caramel)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.88)'; e.currentTarget.style.color = 'var(--bark)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </button>
        </div>

        {/* Text */}
        <div style={{ padding: '12px 14px 10px' }}>
          <h3 className="line-clamp-2 leading-snug"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.0625rem',
              fontWeight: 600,
              color: 'var(--espresso)',
              letterSpacing: '-0.01em',
              marginBottom: '4px',
            }}
          >
            {recipe.title}
          </h3>

          {(recipe.prep_time || recipe.cook_time) && (
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
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
