import { Link } from 'react-router-dom';
import type { Recipe } from '../types';

function parseMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  let mins = 0;
  const hrMatch = timeStr.match(/(\d+)\s*(?:hr|hour|hours)/i);
  const minMatch = timeStr.match(/(\d+)\s*(?:min|minute|minutes)/i);
  if (hrMatch) mins += parseInt(hrMatch[1]) * 60;
  if (minMatch) mins += parseInt(minMatch[1]);
  if (!hrMatch && !minMatch) { const n = parseInt(timeStr); if (!isNaN(n)) mins = n; }
  return mins;
}

function formatMinutes(mins: number): string {
  if (mins <= 0) return '';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

interface Props {
  recipe: Recipe;
}

export default function RecipeTile({ recipe }: Props) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group relative flex flex-col h-full overflow-hidden transition-all duration-300"
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
      </div>

      {/* Text */}
      <div className="flex flex-col flex-1" style={{ padding: '14px 16px 14px' }}>
        <h3 className="sm:line-clamp-2 leading-snug"
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
        <div className="flex-1 sm:hidden" />
        {(recipe.prep_time || recipe.cook_time) && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
            <span className="hidden sm:block">
              {[
                recipe.prep_time && `${recipe.prep_time} prep`,
                recipe.cook_time && `${recipe.cook_time} cook`,
              ].filter(Boolean).join(' · ')}
            </span>
            <span className="sm:hidden">
              {(() => {
                const totalMins = parseMinutes(recipe.prep_time ?? '') + parseMinutes(recipe.cook_time ?? '');
                const total = formatMinutes(totalMins);
                return total ? `${total} total` : null;
              })()}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
