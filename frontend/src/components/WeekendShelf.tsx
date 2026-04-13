import type { Recipe, PantryItem } from '../types';
import { removeFromShelf } from '../api';
import RecipeTile from './RecipeTile';

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
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${shelfRecipes.length}, 1fr)`, gap: '1rem' }}>
      {shelfRecipes.map(recipe => (
        <div key={recipe.id} className="group/card relative" style={{ minWidth: 0 }}>
          <RecipeTile recipe={recipe} pantryItems={pantryItems} />
          {/* Remove button — top-left so it doesn't overlap the rating badge (top-right) */}
          <button
            onClick={e => handleRemove(e, recipe.id)}
            className="absolute top-2.5 left-2.5 z-20 flex items-center justify-center rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity"
            style={{
              width: '22px', height: '22px',
              background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', color: '#fff',
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
