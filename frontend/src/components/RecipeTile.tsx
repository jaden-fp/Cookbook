import { Link } from 'react-router-dom';
import type { Recipe } from '../types';
import StarDisplay from './StarDisplay';

interface Props {
  recipe: Recipe;
}

export default function RecipeTile({ recipe }: Props) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-white transition-all duration-300 shadow-warm-sm"
      style={{ border: '1px solid var(--color-warm-border-light)' }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(44,26,14,0.13), 0 4px 12px rgba(44,26,14,0.07)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Rating badge */}
      {recipe.rating != null && (
        <div
          className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-1 rounded-full"
          style={{
            background: 'var(--color-terra)',
            boxShadow: '0 2px 6px rgba(196,98,45,0.35)',
          }}
        >
          <StarDisplay rating={recipe.rating} size="sm" />
        </div>
      )}

      {/* Image */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '4/3', background: 'var(--color-cream-dark)' }}
      >
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--color-cream-dark) 0%, var(--color-terra-muted) 100%)',
            }}
          >
            <svg className="w-10 h-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--color-bark-mid)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
        )}
        {/* subtle gradient at bottom of image */}
        <div className="absolute inset-x-0 bottom-0 h-8" style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.15), transparent)' }} />
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col gap-1">
        <h3
          className="line-clamp-2 leading-snug text-bark"
          style={{
            fontFamily: 'var(--font-editorial)',
            fontSize: '0.9375rem',
            fontWeight: 600,
          }}
        >
          {recipe.title}
        </h3>
        {(recipe.prep_time || recipe.cook_time) && (
          <p
            className="text-xs"
            style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}
          >
            {[
              recipe.prep_time && `Prep ${recipe.prep_time}`,
              recipe.cook_time && `Cook ${recipe.cook_time}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>
    </Link>
  );
}
