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
        borderRadius: '12px',
        background: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(81,42,24,0.08)',
        border: '1.5px solid transparent',
        textDecoration: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(81,42,24,0.14)';
        e.currentTarget.style.border = '1.5px solid #FF61B4';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(81,42,24,0.08)';
        e.currentTarget.style.border = '1.5px solid transparent';
      }}
    >
      {/* Image section */}
      <div className="relative overflow-hidden" style={{ height: '180px' }}>
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
            }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: '#FFC3E8' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF61B4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18M3 7a4 4 0 008 0V3M7 21v-7M21 3v4a3 3 0 01-3 3v11" />
            </svg>
          </div>
        )}

        {/* Quick add to cookbook */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); setShowCookbook(true); }}
          title="Add to cookbook"
          className="absolute bottom-2 right-2 z-10 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{ width: '28px', height: '28px', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', border: 'none', cursor: 'pointer', color: 'white' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FF61B4'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </button>

        {/* Rating badge */}
        {recipe.rating != null && (
          <div
            className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1"
            style={{
              background: '#FF61B4',
              borderRadius: '999px',
              padding: '3px 8px',
              boxShadow: '0 1px 6px rgba(255,97,180,0.35)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'white', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
              ★ {recipe.rating}
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <div style={{ padding: '10px 12px 6px' }}>
        <h3
          className="line-clamp-2 leading-snug"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#512A18',
            letterSpacing: '-0.01em',
          }}
        >
          {recipe.title}
        </h3>
      </div>

      {/* Meta */}
      {(recipe.prep_time || recipe.cook_time) && (
        <div style={{ padding: '0 12px 10px' }}>
          <p style={{ color: 'rgba(81,42,24,0.55)', fontSize: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
            {[
              recipe.prep_time && `${recipe.prep_time} prep`,
              recipe.cook_time && `${recipe.cook_time} cook`,
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}
    </Link>
    </>
  );
}
