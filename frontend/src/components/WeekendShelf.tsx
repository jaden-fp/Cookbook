import { Link } from 'react-router-dom';
import type { Recipe, PantryItem } from '../types';
import { removeFromShelf } from '../api';
import { recipeCoverage } from '../utils/pantryMatch';

interface Props {
  shelfIds: string[];
  allRecipes: Recipe[];
  pantryItems: PantryItem[];
  onRemove: (id: string) => void;
}

export default function WeekendShelf({ shelfIds, allRecipes, pantryItems, onRemove }: Props) {
  const shelfRecipes = shelfIds
    .map(id => allRecipes.find(r => r.id === id))
    .filter((r): r is Recipe => r != null);

  async function handleRemove(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    await removeFromShelf(id).catch(() => {});
    onRemove(id);
  }

  if (shelfRecipes.length === 0) {
    return (
      <div className="py-10 text-center rounded-2xl" style={{ border: '1.5px dashed var(--border-strong)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          No recipes on the shelf — tap the calendar icon on any recipe to add it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
      {shelfRecipes.map(recipe => {
        const coverage = recipeCoverage(recipe, pantryItems);
        return (
          <Link
            key={recipe.id}
            to={`/recipes/${recipe.id}`}
            className="group shrink-0 flex flex-col overflow-hidden transition-all duration-300"
            style={{
              width: '160px', borderRadius: 'var(--radius-lg)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              textDecoration: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(240,40,106,0.10)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            {/* Image */}
            <div className="relative overflow-hidden" style={{ height: '110px' }}>
              {recipe.image_url ? (
                <img src={recipe.image_url} alt={recipe.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--purple-lt) 0%, var(--teal-lt) 100%)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(15,12,30,0.15)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18M3 7a4 4 0 008 0V3M7 21v-7M21 3v4a3 3 0 01-3 3v11" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />

              {/* Coverage badge */}
              <div className="absolute bottom-1.5 left-1.5"
                style={{
                  background: coverage.pct === 100 ? 'rgba(76,175,80,0.90)' : 'rgba(0,0,0,0.55)',
                  borderRadius: '999px', padding: '2px 6px',
                }}>
                <span style={{
                  fontSize: '9px', fontFamily: 'var(--font-body)', fontWeight: 700,
                  color: coverage.pct === 100 ? '#fff' : coverage.pct >= 60 ? '#ffd54f' : '#ef9a9a',
                }}>
                  {coverage.pct === 100 ? '✓ Ready' : `${coverage.pct}%`}
                </span>
              </div>

              {/* Remove button */}
              <button
                onClick={e => handleRemove(e, recipe.id)}
                className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  width: '20px', height: '20px',
                  background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', color: '#fff',
                }}
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Text */}
            <div style={{ padding: '8px 10px 10px' }}>
              <p className="line-clamp-2 leading-snug" style={{
                fontFamily: 'var(--font-display)', fontSize: '0.8125rem',
                fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.01em',
              }}>
                {recipe.title}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
