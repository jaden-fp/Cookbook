import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import RecipeTile from '../components/RecipeTile';
import BottomSheet from '../components/BottomSheet';
import { getCookbook, getCookbookRecipes, getRecipes, addRecipesToCookbook, getPantryItems } from '../api';
import type { Recipe, Cookbook, PantryItem } from '../types';

function getRecipeReadiness(recipe: Recipe, pantryItems: PantryItem[]): 'green' | 'yellow' | 'red' | undefined {
  const ingredientNames = recipe.ingredient_groups.flatMap(g =>
    g.ingredients.map(i => i.name.toLowerCase())
  );
  let hasMatch = false, hasLow = false, hasOut = false;
  for (const item of pantryItems) {
    const escaped = item.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`);
    if (ingredientNames.some(n => re.test(n))) {
      hasMatch = true;
      const s = item.status || (item.needs_purchase ? 'out' : 'in-stock');
      if (s === 'out') hasOut = true;
      else if (s === 'low') hasLow = true;
    }
  }
  if (!hasMatch) return undefined;
  if (hasOut) return 'red';
  if (hasLow) return 'yellow';
  return 'green';
}

type SortOption = 'az' | 'newest' | 'oldest' | 'top-rated';
const SORT_LABELS: Record<SortOption, string> = { az: 'A → Z', newest: 'Newest', oldest: 'Oldest', 'top-rated': 'Top rated' };

type FilterOption = 'all' | 'ready' | 'out' | 'rated' | 'unrated';
const FILTER_LABELS: Record<FilterOption, string> = {
  all: 'Filter', ready: 'Ready to bake', out: 'Missing ingredients', rated: 'Rated', unrated: 'Unrated',
};

function pantryMatch(ingredientName: string, pantryItemName: string): boolean {
  const escaped = pantryItemName.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(ingredientName.toLowerCase());
}

function recipeAllIngredientsCovered(recipe: Recipe, pantryItems: PantryItem[]): boolean {
  const names = recipe.ingredient_groups.flatMap(g => g.ingredients.map(i => i.name));
  if (names.length === 0) return false;
  return names.every(name => pantryItems.some(item => pantryMatch(name, item.name)));
}

function recipeHasOutOfStock(recipe: Recipe, pantryItems: PantryItem[]): boolean {
  const names = recipe.ingredient_groups.flatMap(g => g.ingredients.map(i => i.name));
  for (const item of pantryItems) {
    if (names.some(n => pantryMatch(n, item.name))) {
      const s = item.status || (item.needs_purchase ? 'out' : 'in-stock');
      if (s === 'out') return true;
    }
  }
  return false;
}

function applyFilter(recipes: Recipe[], filter: FilterOption, pantryItems: PantryItem[]): Recipe[] {
  switch (filter) {
    case 'ready':   return recipes.filter(r => recipeAllIngredientsCovered(r, pantryItems) && !recipeHasOutOfStock(r, pantryItems));
    case 'out':     return recipes.filter(r => recipeHasOutOfStock(r, pantryItems));
    case 'rated':   return recipes.filter(r => r.rating != null);
    case 'unrated': return recipes.filter(r => r.rating == null);
    default:        return recipes;
  }
}

function sortRecipes(recipes: Recipe[], sort: SortOption): Recipe[] {
  const r = [...recipes];
  if (sort === 'az') return r.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === 'newest') return r.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (sort === 'oldest') return r.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  if (sort === 'top-rated') return r.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return r;
}

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

  return (
    <BottomSheet open={true} onClose={onClose} title="Add Recipes">
      <div className="space-y-3">
        {/* Search */}
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search recipes…"
          autoFocus
          className="w-full transition-all duration-200"
          style={{
            border: '1.5px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--text)',
            padding: '0.5625rem 0.875rem',
            outline: 'none',
            background: 'var(--bg-subtle)',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
        />

        {/* Recipe list */}
        <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
              {all.length === 0 ? 'All recipes are already in this cookbook.' : 'No recipes match.'}
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map(r => {
                const checked = selected.has(r.id);
                return (
                  <label
                    key={r.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-150"
                    style={{
                      background: checked ? 'var(--accent-dim)' : 'transparent',
                      border: checked ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                      borderRadius: 'var(--radius-md)',
                    }}
                    onMouseEnter={e => { if (!checked) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                    onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div
                      className="shrink-0 overflow-hidden"
                      style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'var(--border)' }}
                    >
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--bg-subtle)' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 3v18M3 7a4 4 0 008 0V3M7 21v-7M21 3v4a3 3 0 01-3 3v11" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span
                      className="flex-1 text-sm line-clamp-2 leading-snug"
                      style={{ fontFamily: 'var(--font-body)', color: 'var(--text)', fontWeight: checked ? 600 : 400 }}
                    >
                      {r.title}
                    </span>
                    <div
                      className="flex items-center justify-center shrink-0 transition-all duration-150"
                      style={{
                        width: '18px', height: '18px', borderRadius: '5px',
                        border: checked ? 'none' : '1.5px solid var(--border-strong)',
                        background: checked ? 'var(--accent)' : 'var(--surface)',
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
        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8125rem', color: saveError ? '#E03E3E' : 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {saveError ?? (selected.size > 0 ? `${selected.size} selected` : 'Select recipes to add')}
          </span>
          <button
            onClick={handleSave}
            disabled={!selected.size || saving}
            className="px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'var(--accent)',
              fontFamily: 'var(--font-body)',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { if (selected.size && !saving) e.currentTarget.style.background = '#D94E7A'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
          >
            {saving ? 'Adding…' : `Add${selected.size > 0 ? ` ${selected.size}` : ''}`}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

export default function CookbookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [sort, setSort] = useState<SortOption>('newest');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const sortBtnRef = useRef<HTMLButtonElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const [sortPos, setSortPos] = useState({ top: 0, right: 0 });
  const [filterPos, setFilterPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!showSort && !showFilter) return;
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node) &&
          sortBtnRef.current && !sortBtnRef.current.contains(e.target as Node)) setShowSort(false);
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node) &&
          filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)) setShowFilter(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSort, showFilter]);

  useEffect(() => {
    if (!id) return;
    Promise.all([getCookbook(id), getCookbookRecipes(id), getPantryItems()])
      .then(([cb, recs, pantry]) => { setCookbook(cb); setRecipes(recs); setPantryItems(pantry); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <div className="skeleton h-8 w-48 rounded-lg mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden" style={{ borderRadius: 'var(--radius-lg)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
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
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Cookbook not found.</p>
        <Link to="/cookbooks" className="text-sm mt-2 inline-block" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          ← Back to Cookbooks
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 pt-4 sm:pt-24 pb-32 sm:pb-16">
      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <Link
          to="/cookbooks"
          className="inline-flex items-center gap-1 text-sm mb-5 transition-colors duration-200"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 400, textDecoration: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          ← Cookbooks
        </Link>

        <div className="flex items-start sm:items-end justify-between gap-4 flex-wrap">
          <div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: '6px',
            }}>
              Your Library
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                color: 'var(--text)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                marginBottom: '10px',
              }}
            >
              {cookbook.name}
            </h1>
            <div style={{ width: '32px', height: '3px', background: 'var(--accent)', borderRadius: '2px', marginBottom: '8px' }} />
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 transition-all duration-200 shrink-0"
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '999px',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: '10px 22px',
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              boxShadow: '0 2px 10px var(--accent-glow)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#D94E7A'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
          >
            + Add Recipes
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '28px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {(() => {
            const filtered = applyFilter(recipes, filter, pantryItems);
            return `${filtered.length}${filtered.length !== recipes.length ? ` of ${recipes.length}` : ''} ${recipes.length === 1 ? 'recipe' : 'recipes'}`;
          })()}
        </p>
        <div className="flex items-center gap-2">
          {/* Filter button */}
          <button
            ref={filterBtnRef}
            onClick={() => {
              const rect = filterBtnRef.current?.getBoundingClientRect();
              if (rect) setFilterPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
              setShowFilter(v => !v);
            }}
            className="sort-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-body)', fontWeight: filter !== 'all' ? 600 : 500, color: filter !== 'all' ? 'var(--accent)' : 'var(--text)', background: filter !== 'all' ? 'var(--accent-dim)' : 'var(--surface)', border: filter !== 'all' ? '1.5px solid var(--accent)' : '1.5px solid var(--border-strong)', borderRadius: '999px', cursor: 'pointer', outline: 'none' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            {filter === 'all' ? 'Filter' : FILTER_LABELS[filter]}
            {filter !== 'all' && (
              <span onClick={e => { e.stopPropagation(); setFilter('all'); }} style={{ marginLeft: '2px', display: 'flex', alignItems: 'center', color: 'var(--accent)', cursor: 'pointer' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </span>
            )}
          </button>
          {showFilter && createPortal(
            <div ref={filterMenuRef} style={{ position: 'absolute', top: filterPos.top, right: filterPos.right, zIndex: 9999, background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: '10px', overflow: 'hidden', minWidth: '160px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
              {(['all', 'ready', 'out', 'rated', 'unrated'] as FilterOption[]).map(opt => (
                <button key={opt} onClick={() => { setFilter(opt); setShowFilter(false); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: opt === filter ? 'var(--accent-dim)' : 'transparent', color: opt === filter ? 'var(--accent)' : 'var(--text)', fontFamily: 'var(--font-body)', fontWeight: opt === filter ? 600 : 400, fontSize: '0.8125rem', cursor: 'pointer' }}
                >{FILTER_LABELS[opt]}</button>
              ))}
            </div>,
            document.body
          )}

          {/* Sort button */}
          {recipes.length > 1 && (
            <button
              ref={sortBtnRef}
              onClick={() => {
                const rect = sortBtnRef.current?.getBoundingClientRect();
                if (rect) setSortPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
                setShowSort(v => !v);
              }}
              className="sort-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--text)', background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: '999px', cursor: 'pointer', outline: 'none' }}
            >
              {SORT_LABELS[sort]}
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--text-muted)' }}>
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {showSort && createPortal(
            <div ref={sortMenuRef} style={{ position: 'absolute', top: sortPos.top, right: sortPos.right, zIndex: 9999, background: 'var(--surface)', border: '1.5px solid var(--border-strong)', borderRadius: '10px', overflow: 'hidden', minWidth: '120px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
              {(Object.keys(SORT_LABELS) as SortOption[]).map(opt => (
                <button key={opt} onClick={() => { setSort(opt); setShowSort(false); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: opt === sort ? 'var(--accent-dim)' : 'transparent', color: opt === sort ? 'var(--accent)' : 'var(--text)', fontFamily: 'var(--font-body)', fontWeight: opt === sort ? 600 : 400, fontSize: '0.8125rem', cursor: 'pointer' }}
                >{SORT_LABELS[opt]}</button>
              ))}
            </div>,
            document.body
          )}
        </div>
      </div>

      {/* Recipes */}
      {recipes.length === 0 ? (
        <div className="text-center py-20 animate-fade-up">
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Empty cookbook
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Add your saved recipes to this collection.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 transition-all duration-200"
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '999px',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: '10px 24px',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#D94E7A'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
          >
            + Add Recipes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {sortRecipes(applyFilter(recipes, filter, pantryItems), sort).map((r, i) => (
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
