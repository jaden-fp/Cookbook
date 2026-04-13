import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecipes, getPantryItems, getShelf } from '../api';
import type { Recipe, PantryItem } from '../types';
import { recipeCoverage } from '../utils/pantryMatch';
import WeekendShelf from '../components/WeekendShelf';
import RecipeTile from '../components/RecipeTile';
import BottomSheet from '../components/BottomSheet';
import ImportBar from '../components/ImportBar';
import { useFAB } from '../context/FABContext';

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [shelfIds, setShelfIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const { setAction } = useFAB();

  useEffect(() => {
    setAction(() => setShowImport(true));
    return () => setAction(null);
  }, [setAction]);

  useEffect(() => {
    Promise.all([getRecipes(), getPantryItems(), getShelf()]).then(([r, p, s]) => {
      setRecipes(r);
      setPantryItems(p);
      setShelfIds(s);
    }).finally(() => setLoading(false));
  }, []);

  // Top picks: highest coverage, not already on shelf, limit 6
  const topPicks = [...recipes]
    .filter(r => !shelfIds.includes(r.id))
    .sort((a, b) => recipeCoverage(b, pantryItems).pct - recipeCoverage(a, pantryItems).pct)
    .slice(0, 6);

  // Recent bakes: recipes with bake_log, sorted by most recent bake date
  const recentBakes = [...recipes]
    .filter(r => (r.bake_log?.length ?? 0) > 0)
    .sort((a, b) => {
      const latestA = Math.max(...(a.bake_log ?? []).map(e => new Date(e.date).getTime()));
      const latestB = Math.max(...(b.bake_log ?? []).map(e => new Date(e.date).getTime()));
      return latestB - latestA;
    })
    .slice(0, 6);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 pt-4 sm:pt-24 pb-32 sm:pb-16">
        <div className="mb-10">
          <div className="skeleton h-3 w-16 rounded mb-2" />
          <div className="skeleton h-14 w-40 rounded-lg mb-3" />
          <div className="skeleton h-1 w-10 rounded" />
        </div>
        <div className="skeleton h-9 w-32 rounded-full mb-8 sm:hidden" />
        <div className="skeleton h-40 rounded-2xl mb-10" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 'var(--radius-lg)', background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
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

      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '6px',
        }}>
          Your Kitchen
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 'clamp(2.25rem, 5vw, 3.25rem)', color: 'var(--text)',
          letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '10px',
        }}>
          Home
        </h1>
        <div style={{ width: '40px', height: '3px', background: 'var(--accent)', borderRadius: '2px' }} />
      </div>

      <BottomSheet open={showImport} onClose={() => setShowImport(false)} title="Import Recipe">
        <ImportBar onSuccess={() => { getRecipes().then(setRecipes); setShowImport(false); }} />
      </BottomSheet>

      {/* Weekend shelf */}
      <section className="mb-12 animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            Bake This Weekend
          </h2>
        </div>
        <WeekendShelf
          shelfIds={shelfIds}
          allRecipes={recipes}
          pantryItems={pantryItems}
          onRemove={id => setShelfIds(prev => prev.filter(i => i !== id))}
        />
      </section>

      {/* Top picks */}
      {topPicks.length > 0 && (
        <section className="mb-12 animate-fade-up delay-1">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              What You Can Make
            </h2>
            <Link to="/recipes" style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
            {topPicks.map((r, i) => (
              <div key={r.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <RecipeTile recipe={r} pantryItems={pantryItems} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent bakes */}
      {recentBakes.length > 0 && (
        <section className="animate-fade-up delay-2">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              Recently Baked
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
            {recentBakes.map((r, i) => (
              <div key={r.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <RecipeTile recipe={r} pantryItems={pantryItems} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
