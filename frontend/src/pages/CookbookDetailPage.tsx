import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import RecipeTile from '../components/RecipeTile';
import { getCookbook, getCookbookRecipes, getRecipes, addRecipesToCookbook } from '../api';
import type { Recipe, Cookbook } from '../types';

function AddRecipesModal({
  cookbookId,
  existing,
  onClose,
  onAdded,
}: {
  cookbookId: string;
  existing: Set<string>;
  onClose: () => void;
  onAdded: (recipes: Recipe[]) => void;
}) {
  const [all, setAll] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getRecipes().then(r => setAll(r.filter(rec => !existing.has(rec.id))));
  }, []);

  const filtered = query.trim()
    ? all.filter(r => r.title.toLowerCase().includes(query.toLowerCase()))
    : all;

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!selected.size) return;
    setSaving(true);
    setSaveError(null);
    try {
      await addRecipesToCookbook(cookbookId, Array.from(selected));
      onAdded(all.filter(r => selected.has(r.id)));
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      style={{ background: 'rgba(26,10,4,0.45)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md bg-white animate-scale-in flex flex-col"
        style={{
          border: '1px solid var(--bone)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--cream-deep)' }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.375rem', color: 'var(--espresso)', letterSpacing: '-0.01em' }}>
            Add Recipes
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-xl leading-none"
            style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream-deep)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search recipes…"
            autoFocus
            className="w-full transition-all duration-200"
            style={{
              border: '1.5px solid var(--bone)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'var(--espresso)',
              padding: '0.5625rem 0.875rem',
              outline: 'none',
              background: 'var(--cream)',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--caramel)'; e.target.style.boxShadow = '0 0 0 3px rgba(196,114,42,0.10)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--bone)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Recipe list */}
        <div className="overflow-y-auto flex-1 px-4 pb-4">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
              {all.length === 0 ? 'All recipes are already in this cookbook.' : 'No recipes match.'}
            </p>
          ) : (
            <div className="space-y-1 pt-1">
              {filtered.map(r => {
                const checked = selected.has(r.id);
                return (
                  <label
                    key={r.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
                    style={{
                      background: checked ? 'rgba(196,114,42,0.07)' : 'transparent',
                      border: checked ? '1.5px solid var(--caramel)' : '1.5px solid transparent',
                      borderRadius: 'var(--radius-md)',
                    }}
                    onMouseEnter={e => { if (!checked) e.currentTarget.style.background = 'var(--cream-deep)'; }}
                    onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="shrink-0 overflow-hidden"
                      style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'var(--bone)' }}
                    >
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--cream-deep)' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 3v18M3 7a4 4 0 008 0V3M7 21v-7M21 3v4a3 3 0 01-3 3v11" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <span
                      className="flex-1 text-sm line-clamp-2 leading-snug"
                      style={{ fontFamily: 'var(--font-body)', color: 'var(--espresso)', fontWeight: checked ? 600 : 400 }}
                    >
                      {r.title}
                    </span>

                    {/* Checkbox */}
                    <div
                      className="flex items-center justify-center shrink-0 transition-all duration-150"
                      style={{
                        width: '18px', height: '18px', borderRadius: '5px',
                        border: checked ? 'none' : '1.5px solid var(--bone)',
                        background: checked ? 'var(--caramel)' : 'white',
                      }}
                      onClick={() => toggle(r.id)}
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(r.id)} />
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-between shrink-0"
          style={{ borderTop: '1px solid var(--cream-deep)' }}
        >
          <span style={{ fontSize: '0.8125rem', color: saveError ? '#B05050' : 'var(--muted)', fontFamily: 'var(--font-body)' }}>
            {saveError ?? (selected.size > 0 ? `${selected.size} selected` : 'Select recipes to add')}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm transition-colors"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream-deep)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selected.size || saving}
              className="px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'var(--caramel)',
                fontFamily: 'var(--font-body)',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(196,114,42,0.25)',
              }}
              onMouseEnter={e => { if (selected.size && !saving) e.currentTarget.style.background = '#A85E22'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--caramel)'; }}
            >
              {saving ? 'Adding…' : `Add${selected.size > 0 ? ` ${selected.size}` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CookbookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getCookbook(id), getCookbookRecipes(id)])
      .then(([cb, recs]) => { setCookbook(cb); setRecipes(recs); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
        <div className="skeleton h-8 w-48 rounded-lg mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden" style={{ borderRadius: 'var(--radius-lg)', background: 'white', border: '1px solid var(--bone)' }}>
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

  if (!cookbook) {
    return (
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-20 text-center">
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Cookbook not found.</p>
        <Link to="/cookbooks" className="text-sm mt-2 inline-block" style={{ color: 'var(--caramel)', textDecoration: 'none' }}>
          ← Back to Cookbooks
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-10 pb-16">
      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <Link
          to="/cookbooks"
          className="inline-flex items-center gap-1 text-sm mb-5 transition-colors duration-200"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', fontWeight: 400, textDecoration: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--caramel)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; }}
        >
          ← Cookbooks
        </Link>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--caramel)',
              marginBottom: '6px',
            }}>
              Your Library
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                color: 'var(--espresso)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                marginBottom: '10px',
              }}
            >
              {cookbook.name}
            </h1>
            <div style={{ width: '32px', height: '2px', background: 'var(--caramel)', borderRadius: '2px', marginBottom: '8px' }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--muted)', fontWeight: 400 }}>
              {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
            </p>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 transition-all duration-200 shrink-0"
            style={{
              background: 'var(--caramel)',
              color: 'white',
              border: 'none',
              borderRadius: '999px',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: '10px 22px',
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              boxShadow: '0 2px 10px rgba(196,114,42,0.25)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#A85E22'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--caramel)'; }}
          >
            + Add Recipes
          </button>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--bone)', marginBottom: '28px' }} />

      {/* Recipes */}
      {recipes.length === 0 ? (
        <div className="text-center py-20 animate-fade-up">
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500, fontStyle: 'italic', color: 'var(--muted)', marginBottom: '8px' }}>
            Empty cookbook
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '24px' }}>
            Add your saved recipes to this collection.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 transition-all duration-200"
            style={{
              background: 'var(--caramel)',
              color: 'white',
              border: 'none',
              borderRadius: '999px',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: '10px 24px',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#A85E22'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--caramel)'; }}
          >
            + Add Recipes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {recipes.map((r, i) => (
            <div key={r.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <RecipeTile recipe={r} />
            </div>
          ))}
        </div>
      )}

      {showAdd && cookbook && (
        <AddRecipesModal
          cookbookId={cookbook.id}
          existing={new Set(recipes.map(r => r.id))}
          onClose={() => setShowAdd(false)}
          onAdded={newRecipes => {
            setRecipes(prev => [...prev, ...newRecipes]);
            setCookbook(prev => prev ? { ...prev, recipe_count: prev.recipe_count + newRecipes.length } : prev);
          }}
        />
      )}
    </div>
  );
}
