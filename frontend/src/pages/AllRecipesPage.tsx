import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import ImportBar from '../components/ImportBar';
import RecipeImportLoader from '../components/RecipeImportLoader';
import BottomSheet from '../components/BottomSheet';
import RecipeTile from '../components/RecipeTile';
import { getRecipes, importRecipe, getPantryItems } from '../api';
import { useFAB } from '../context/FABContext';
import type { Recipe, PantryItem } from '../types';

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
      // Backward compat: old items may only have needs_purchase, not status
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

const URL_RE = /^https?:\/\/.+/i;

type SortOption = 'az' | 'newest' | 'oldest' | 'rating';

function sortRecipes(recipes: Recipe[], sort: SortOption): Recipe[] {
  const sorted = [...recipes];
  switch (sort) {
    case 'az':      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'newest':  return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'oldest':  return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case 'rating':  return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }
}

export default function AllRecipesPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>(
    () => (localStorage.getItem('recipes-sort') as SortOption) ?? 'newest'
  );
  const [showImportSheet, setShowImportSheet] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortPos, setSortPos] = useState({ top: 0, right: 0 });
  const sortRef = useRef<HTMLDivElement>(null);
  const sortBtnRef = useRef<HTMLButtonElement>(null);
  const { setAction } = useFAB();

  // Unified smart bar — desktop only (type to search, paste URL to import)
  const [smartInput, setSmartInput] = useState('');
  const [smartFocused, setSmartFocused] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  // Mobile-only search
  const [mobileSearch, setMobileSearch] = useState('');

  const isUrl = URL_RE.test(smartInput.trim());
  // Active search term: desktop uses smartInput when not a URL, mobile uses mobileSearch
  const search = smartInput && !isUrl ? smartInput : mobileSearch;

  async function handleSmartImport(e: React.FormEvent) {
    e.preventDefault();
    if (!isUrl || importing) return;
    setImporting(true);
    setImportError(null);
    try {
      const recipe = await importRecipe(smartInput.trim());
      setSmartInput('');
      const fresh = await getRecipes();
      setRecipes(fresh);
      navigate(`/recipes/${recipe.id}`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  useEffect(() => {
    Promise.all([getRecipes(), getPantryItems()]).then(([r, p]) => {
      setRecipes(r);
      setPantryItems(p);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!showSort) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSort]);

  useEffect(() => {
    setAction(() => setShowImportSheet(true));
    return () => setAction(null);
  }, [setAction]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 pt-3 sm:pt-24 pb-32 sm:pb-16">

      {/* Page header */}
      <div className="block mb-6 sm:mb-10 animate-fade-up">
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: '6px',
        }}>
          The Collection
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: '10px',
        }}>
          All Recipes
        </h1>
        <div style={{ width: '40px', height: '3px', background: 'var(--accent)', borderRadius: '2px' }} />
      </div>

      {importing && <RecipeImportLoader url={smartInput} />}

      {/* Desktop: unified smart bar (search + import) */}
      <form onSubmit={handleSmartImport} className="hidden sm:block mb-6 animate-fade-up delay-1">
        <div style={{
          display: 'flex', alignItems: 'stretch', overflow: 'hidden',
          borderRadius: '999px',
          border: smartFocused ? '1.5px solid var(--accent)' : '1.5px solid var(--border-strong)',
          boxShadow: smartFocused ? '0 0 0 3px var(--accent-dim), var(--shadow-md)' : 'var(--shadow-sm)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          background: 'var(--surface)',
        }}>
          {/* Icon: search or link */}
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '16px', color: 'var(--text-muted)', flexShrink: 0 }}>
            {isUrl ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            )}
          </div>
          <input
            type={isUrl ? 'url' : 'search'}
            value={smartInput}
            onChange={e => { setSmartInput(e.target.value); setImportError(null); }}
            onFocus={() => setSmartFocused(true)}
            onBlur={() => setSmartFocused(false)}
            placeholder="Search recipes or paste a URL to import…"
            disabled={importing}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--font-body)', fontSize: '0.9375rem',
              color: 'var(--text)', padding: '0.75rem 0.75rem 0.75rem 10px',
            }}
          />
          {/* Clear button when searching */}
          {smartInput && !isUrl && (
            <button type="button" onClick={() => setSmartInput('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 10px', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
          {/* Import button when URL detected */}
          {isUrl && (
            <button type="submit" disabled={importing}
              style={{
                background: 'var(--accent)', color: '#fff',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.875rem',
                border: 'none', borderRadius: '999px', margin: '4px',
                padding: '0 1.5rem', cursor: importing ? 'not-allowed' : 'pointer',
                opacity: importing ? 0.7 : 1, whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
              {importing ? <><span className="import-dots shrink-0"><span/><span/><span/></span>Importing</> : 'Import Recipe'}
            </button>
          )}
        </div>
        {importError && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--danger)', marginTop: '6px', paddingLeft: '16px' }}>
            {importError}
          </p>
        )}
      </form>

      {/* Mobile: search bar (import via FAB) */}
      <div className="sm:hidden mb-4 animate-fade-up delay-1" style={{ position: 'relative' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="search" placeholder="Search recipes…" value={mobileSearch}
          onChange={e => setMobileSearch(e.target.value)}
          style={{
            width: '100%', fontFamily: 'var(--font-body)', fontSize: '0.9rem',
            color: 'var(--text)', background: 'var(--surface)',
            border: '1.5px solid var(--border-strong)', borderRadius: '999px',
            padding: '10px 16px 10px 38px', outline: 'none', boxSizing: 'border-box',
          }}
        />
        {mobileSearch && (
          <button onClick={() => setMobileSearch('')}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      <BottomSheet open={showImportSheet} onClose={() => setShowImportSheet(false)} title="Import Recipe">
        <ImportBar onSuccess={() => getRecipes().then(setRecipes)} />
      </BottomSheet>

      {/* Divider + sort row */}
      <div className="flex items-center justify-between mb-8 animate-fade-up delay-2"
        style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}
      >
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 400 }}>
          {loading ? '' : search
            ? `${recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase())).length} of ${recipes.length} recipes`
            : `${recipes.length} ${recipes.length === 1 ? 'recipe' : 'recipes'}`}
        </p>

        {!loading && recipes.length > 0 && (
          <div className="flex items-center gap-2">
          <div ref={sortRef} style={{ position: 'relative' }}>
            <button
              ref={sortBtnRef}
              onClick={() => {
                const rect = sortBtnRef.current?.getBoundingClientRect();
                if (rect) setSortPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
                setShowSort(v => !v);
              }}
              className="sort-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontFamily: 'var(--font-body)', fontWeight: 500,
                color: 'var(--text)', background: 'var(--surface)',
                border: '1.5px solid var(--border-strong)',
                borderRadius: '999px', cursor: 'pointer', outline: 'none',
              }}
            >
              {{ az: 'A → Z', newest: 'Newest first', oldest: 'Oldest first', rating: 'Top rated' }[sort]}
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--text-muted)' }}>
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showSort && createPortal(
              <div ref={sortRef}
                style={{
                  position: 'absolute', top: sortPos.top, right: sortPos.right, zIndex: 9999,
                  background: 'var(--surface)', border: '1.5px solid var(--border-strong)',
                  borderRadius: '10px', overflow: 'hidden', minWidth: '120px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                }}
              >
                {(['az', 'newest', 'oldest', 'rating'] as SortOption[]).map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setSort(opt); localStorage.setItem('recipes-sort', opt); setShowSort(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 14px', border: 'none',
                      background: opt === sort ? 'var(--accent-dim)' : 'transparent',
                      color: opt === sort ? 'var(--accent)' : 'var(--text)',
                      fontFamily: 'var(--font-body)', fontWeight: opt === sort ? 600 : 400,
                      fontSize: '0.8125rem', cursor: 'pointer',
                    }}
                  >
                    {{ az: 'A → Z', newest: 'Newest first', oldest: 'Oldest first', rating: 'Top rated' }[opt]}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>
          </div>
        )}
      </div>


      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="overflow-hidden" style={{ borderRadius: 'var(--radius-lg)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="skeleton" style={{ height: '190px' }} />
              <div style={{ padding: '12px 14px 10px' }} className="space-y-2">
                <div className="skeleton h-4 rounded w-4/5" />
                <div className="skeleton h-3 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-24 animate-fade-up">
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: '6px',
          }}>
            No recipes yet
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Paste a recipe URL above to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {sortRecipes(
            search ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase())) : recipes,
            sort
          ).map((r, i) => (
            <div key={r.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <RecipeTile recipe={r} pantryStatus={getRecipeReadiness(r, pantryItems)} />
            </div>
          ))}
          {search && recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase())).length === 0 && (
            <div className="col-span-2 sm:col-span-3 text-center py-16">
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>No results</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>No recipes match "{search}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
