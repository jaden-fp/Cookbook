import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import RecipeTile from '../components/RecipeTile';
import { getCookbook, getCookbookRecipes, getRecipes, addRecipesToCookbook } from '../api';
import type { Recipe, Cookbook } from '../types';
import { getSwatch } from '../cookbookIcons';
import CookbookIcon from '../components/CookbookIcon';

function AddRecipesModal({
  cookbookId,
  existing,
  onClose,
  onAdded,
}: {
  cookbookId: number;
  existing: Set<number>;
  onClose: () => void;
  onAdded: (recipes: Recipe[]) => void;
}) {
  const [all, setAll] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getRecipes().then(r => setAll(r.filter(rec => !existing.has(rec.id))));
  }, []);

  const filtered = query.trim()
    ? all.filter(r => r.title.toLowerCase().includes(query.toLowerCase()))
    : all;

  function toggle(id: number) {
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
      style={{ background: 'rgba(81,42,24,0.4)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl animate-scale-in flex flex-col"
        style={{
          border: '1px solid #FFC3E8',
          boxShadow: '0 20px 60px rgba(81,42,24,0.15)',
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid #FFC3E8' }}
        >
          <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.0625rem', color: '#512A18' }}>
            Add Recipes
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-xl leading-none"
            style={{ color: 'rgba(81,42,24,0.55)' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF0F8'; }}
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
              border: '1.5px solid #FFC3E8',
              borderRadius: '10px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: '#512A18',
              padding: '0.5625rem 0.875rem',
              outline: 'none',
              background: 'white',
            }}
            onFocus={e => { e.target.style.borderColor = '#FF61B4'; e.target.style.boxShadow = '0 0 0 3px rgba(255,97,180,0.10)'; }}
            onBlur={e => { e.target.style.borderColor = '#FFC3E8'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Recipe list */}
        <div className="overflow-y-auto flex-1 px-4 pb-4">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)' }}>
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
                      background: checked ? '#FFF0F8' : 'transparent',
                      border: checked ? '1.5px solid #FFC3E8' : '1.5px solid transparent',
                    }}
                    onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#FFFFFF'; }}
                    onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="shrink-0 overflow-hidden rounded-lg"
                      style={{ width: '44px', height: '44px', background: '#FFC3E8' }}
                    >
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: '#FFC3E8' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF61B4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 3v18M3 7a4 4 0 008 0V3M7 21v-7M21 3v4a3 3 0 01-3 3v11" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <span
                      className="flex-1 text-sm line-clamp-2 leading-snug"
                      style={{ fontFamily: 'var(--font-body)', color: '#512A18', fontWeight: checked ? 600 : 400 }}
                    >
                      {r.title}
                    </span>

                    {/* Checkbox */}
                    <div
                      className="flex items-center justify-center shrink-0 transition-all duration-150"
                      style={{
                        width: '18px', height: '18px', borderRadius: '5px',
                        border: checked ? 'none' : '1.5px solid #FFC3E8',
                        background: checked ? '#FF61B4' : 'white',
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
          style={{ borderTop: '1px solid #FFC3E8' }}
        >
          <span style={{ fontSize: '0.8125rem', color: saveError ? '#C0392B' : 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)' }}>
            {saveError ?? (selected.size > 0 ? `${selected.size} selected` : 'Select recipes to add')}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg transition-colors"
              style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FFF0F8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selected.size || saving}
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#FF61B4', fontFamily: 'var(--font-body)', boxShadow: '0 2px 8px rgba(255,97,180,0.25)' }}
              onMouseEnter={e => { if (selected.size && !saving) e.currentTarget.style.background = '#E0489E'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FF61B4'; }}
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
    const numId = parseInt(id);
    Promise.all([getCookbook(numId), getCookbookRecipes(numId)])
      .then(([cb, recs]) => { setCookbook(cb); setRecipes(recs); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
        <div className="skeleton h-8 w-48 rounded-lg mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton rounded-xl" style={{ height: '260px' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!cookbook) {
    return (
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-20 text-center">
        <p style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)' }}>Cookbook not found.</p>
        <Link to="/cookbooks" className="text-sm mt-2 inline-block" style={{ color: '#FF61B4', textDecoration: 'none' }}>
          Back to Cookbooks
        </Link>
      </div>
    );
  }

  const { bg: _bg, dark: _dark } = getSwatch(cookbook.color, cookbook.id);

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-10 pb-16">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <Link
          to="/cookbooks"
          className="inline-flex items-center gap-1 text-sm mb-4 transition-colors duration-200"
          style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#FF61B4'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(81,42,24,0.55)'; }}
        >
          ← Cookbooks
        </Link>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 800,
                  fontSize: '1.375rem',
                  color: '#512A18',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                {cookbook.name}
              </h1>
              <p className="text-sm" style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 shrink-0"
            style={{
              background: '#FF61B4',
              borderRadius: '8px',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 2px 8px rgba(255,97,180,0.25)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E0489E'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FF61B4'; }}
          >
            + Add Recipes
          </button>
        </div>
      </div>

      <div style={{ borderBottom: '1px solid #FFC3E8', marginBottom: '24px' }} />

      {/* Recipes */}
      {recipes.length === 0 ? (
        <div className="text-center py-16 animate-fade-up">
          <div className="flex justify-center mb-4">
            <CookbookIcon iconId={cookbook.icon} color="#FFC3E8" size={48} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: '#512A18' }}>
            Empty cookbook
          </h3>
          <p className="text-sm mb-6" style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)' }}>
            Add your saved recipes to this collection.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200"
            style={{ background: '#FF61B4', borderRadius: '8px', fontFamily: 'var(--font-body)' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E0489E'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FF61B4'; }}
          >
            + Add Recipes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
