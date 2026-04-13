import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ImportBar from '../components/ImportBar';
import RecipeImportLoader from '../components/RecipeImportLoader';
import BottomSheet from '../components/BottomSheet';
import RecipeTile from '../components/RecipeTile';
import { getRecipes, importRecipe, getPantryItems, aiSearchRecipes } from '../api';
import { useFAB } from '../context/FABContext';
import type { Recipe, PantryItem } from '../types';
import { recipeAllIngredientsCovered, recipeHasOutOfStock, recipeCoverage } from '../utils/pantryMatch';

const URL_RE = /^https?:\/\/.+/i;

type SortOption = 'az' | 'newest' | 'oldest' | 'rating' | 'coverage';
type FilterOption = 'all' | 'ready' | 'out' | 'rated' | 'unrated' | 'stale';

const FILTER_LABELS: Record<FilterOption, string> = {
  all: 'Filter',
  ready: 'Ready to bake',
  out: 'Missing ingredients',
  rated: 'Rated',
  unrated: 'Unrated',
  stale: 'Not baked in 3+ months',
};

const STALE_MS = 90 * 24 * 60 * 60 * 1000;

function applyFilter(recipes: Recipe[], filter: FilterOption, pantryItems: PantryItem[]): Recipe[] {
  switch (filter) {
    case 'ready':   return recipes.filter(r => recipeAllIngredientsCovered(r, pantryItems) && !recipeHasOutOfStock(r, pantryItems));
    case 'out':     return recipes.filter(r => recipeHasOutOfStock(r, pantryItems));
    case 'rated':   return recipes.filter(r => r.rating != null);
    case 'unrated': return recipes.filter(r => r.rating == null);
    case 'stale':   return recipes.filter(r => {
      if (!r.bake_log?.length) return false;
      const latest = Math.max(...r.bake_log.map(e => new Date(e.date).getTime()));
      return Date.now() - latest >= STALE_MS;
    });
    default:        return recipes;
  }
}

function sortRecipes(recipes: Recipe[], sort: SortOption, pantryItems: PantryItem[] = []): Recipe[] {
  const sorted = [...recipes];
  switch (sort) {
    case 'az':       return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'newest':   return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'oldest':   return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case 'rating':   return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case 'coverage': return sorted.sort((a, b) => recipeCoverage(b, pantryItems).pct - recipeCoverage(a, pantryItems).pct);
  }
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Cookies':   { bg: 'rgba(240,80,80,0.10)',   text: '#c94040', border: 'rgba(240,80,80,0.35)'   },
  'Cakes':     { bg: 'rgba(160,80,240,0.10)',  text: '#8040c0', border: 'rgba(160,80,240,0.35)'  },
  'Bars':      { bg: 'rgba(255,150,30,0.10)',  text: '#c07010', border: 'rgba(255,150,30,0.35)'  },
  'Brownies':  { bg: 'rgba(110,60,20,0.12)',   text: '#6b3a10', border: 'rgba(110,60,20,0.35)'   },
  'Donuts':    { bg: 'rgba(30,190,190,0.10)',  text: '#0a9090', border: 'rgba(30,190,190,0.35)'  },
  'Bread':     { bg: 'rgba(200,155,90,0.12)',  text: '#956c2a', border: 'rgba(200,155,90,0.35)'  },
  'Muffins':   { bg: 'rgba(60,180,90,0.10)',   text: '#2a8040', border: 'rgba(60,180,90,0.35)'   },
  'Pies':      { bg: 'rgba(40,110,220,0.10)',  text: '#2050a0', border: 'rgba(40,110,220,0.35)'  },
  'Pastries':  { bg: 'rgba(240,100,160,0.10)', text: '#b03060', border: 'rgba(240,100,160,0.35)' },
  'Scones':    { bg: 'rgba(180,130,80,0.12)',  text: '#7a5020', border: 'rgba(180,130,80,0.35)'  },
  'Cupcakes':  { bg: 'rgba(240,140,200,0.10)', text: '#b04080', border: 'rgba(240,140,200,0.35)' },
  'Cheesecake':{ bg: 'rgba(220,200,100,0.12)', text: '#907810', border: 'rgba(220,200,100,0.35)' },
};
const DEFAULT_CAT_COLOR = { bg: 'rgba(100,100,120,0.10)', text: '#505060', border: 'rgba(100,100,120,0.30)' };

export default function AllRecipesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>(
    () => (localStorage.getItem('recipes-sort') as SortOption) ?? 'newest'
  );
  const [filter, setFilter] = useState<FilterOption>(
    () => (localStorage.getItem('recipes-filter') as FilterOption) ?? 'all'
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showImportSheet, setShowImportSheet] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [sortPos, setSortPos] = useState({ top: 0, right: 0 });
  const [filterPos, setFilterPos] = useState({ top: 0, right: 0 });
  const sortRef = useRef<HTMLDivElement>(null);
  const sortBtnRef = useRef<HTMLButtonElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const { setAction } = useFAB();

  // Unified smart bar — desktop only (type to search, paste URL to import)
  // Initialize from URL ?q= param so home page search navigates here correctly
  const [smartInput, setSmartInput] = useState(() => searchParams.get('q') ?? '');
  const [smartFocused, setSmartFocused] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  // Mobile-only search
  const [mobileSearch, setMobileSearch] = useState(() => searchParams.get('q') ?? '');

  // AI search
  const [aiMode, setAiMode] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResultIds, setAiResultIds] = useState<string[] | null>(null);
  const [aiSearching, setAiSearching] = useState(false);

  const isUrl = URL_RE.test(smartInput.trim());
  // Active search term: desktop uses smartInput when not a URL, mobile uses mobileSearch
  const search = smartInput && !isUrl ? smartInput : mobileSearch;

  async function handleAiSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!aiQuery.trim() || aiSearching) return;
    setAiSearching(true);
    try {
      const catalog = recipes.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        ai_category: r.ai_category,
        tags: r.tags,
        ingredients: r.ingredient_groups.flatMap(g => g.ingredients.map(i => i.name)),
      }));
      const ids = await aiSearchRecipes(aiQuery.trim(), catalog);
      setAiResultIds(ids);
    } finally {
      setAiSearching(false);
    }
  }

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
    if (!showSort && !showFilter) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node) &&
          filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)) setShowFilter(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSort, showFilter]);

  useEffect(() => {
    setAction(() => setShowImportSheet(true));
    return () => setAction(null);
  }, [setAction]);

  const countText = loading ? '' : (() => {
    const base = search ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase())) : recipes;
    const catFiltered = selectedCategory ? base.filter(r => r.ai_category === selectedCategory) : base;
    const filtered = applyFilter(catFiltered, filter, pantryItems);
    return `${filtered.length}${filtered.length !== recipes.length ? ` of ${recipes.length}` : ''} ${recipes.length === 1 ? 'recipe' : 'recipes'}`;
  })();

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
            padding: '7px 16px 7px 38px', outline: 'none', boxSizing: 'border-box',
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

      {/* AI Search bar */}
      {aiMode && (
        <form onSubmit={handleAiSearch} className="mb-4 animate-fade-up">
          <div style={{
            display: 'flex', alignItems: 'stretch', overflow: 'hidden',
            borderRadius: '999px', border: '1.5px solid var(--accent)',
            background: 'var(--surface)', boxShadow: '0 0 0 3px var(--accent-dim)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '14px', color: 'var(--accent)', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)">
                <path d="M12 2C12 2 13 8 18 9C13 10 12 16 12 16C12 16 11 10 6 9C11 8 12 2 12 2Z"/>
                <path d="M19 3C19 3 19.5 5.5 21.5 6C19.5 6.5 19 9 19 9C19 9 18.5 6.5 16.5 6C18.5 5.5 19 3 19 3Z"/>
              </svg>
            </div>
            <input
              autoFocus
              type="text"
              value={aiQuery}
              onChange={e => { setAiQuery(e.target.value); if (aiResultIds) setAiResultIds(null); }}
              placeholder="I'm craving something chocolatey…"
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontFamily: 'var(--font-body)', fontSize: '0.9375rem',
                color: 'var(--text)', padding: '11px 10px', background: 'transparent', minWidth: 0,
              }}
            />
            <button
              type="submit"
              disabled={!aiQuery.trim() || aiSearching}
              className="shrink-0 disabled:opacity-40"
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: '999px', fontFamily: 'var(--font-body)', fontWeight: 700,
                fontSize: '0.875rem', padding: '0 1.25rem', margin: '4px', cursor: 'pointer',
              }}
            >
              {aiSearching ? '…' : 'Ask'}
            </button>
            <button
              type="button"
              onClick={() => { setAiMode(false); setAiQuery(''); setAiResultIds(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 12px 0 4px', display: 'flex', alignItems: 'center' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          {aiResultIds !== null && (
            <p style={{ marginTop: '6px', paddingLeft: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--accent)' }}>
              {aiResultIds.length > 0 ? `Found ${aiResultIds.length} matches` : 'No matches found — try a different description'}
            </p>
          )}
        </form>
      )}

      <BottomSheet open={showImportSheet} onClose={() => setShowImportSheet(false)} title="Import Recipe">
        <ImportBar onSuccess={() => getRecipes().then(setRecipes)} />
      </BottomSheet>

      {/* Recipe count — above the border */}
      {!loading && (
        <p className="animate-fade-up delay-2" style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 400, marginBottom: '10px' }}>
          {(() => {
            const base = search ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase())) : recipes;
            const catFiltered = selectedCategory ? base.filter(r => r.ai_category === selectedCategory) : base;
            const filtered = applyFilter(catFiltered, filter, pantryItems);
            return `${filtered.length}${filtered.length !== recipes.length ? ` of ${recipes.length}` : ''} ${recipes.length === 1 ? 'recipe' : 'recipes'}`;
          })()}
        </p>
      )}

      {/* Divider + category pills + sort/filter row */}
      <div className="mb-8 animate-fade-up delay-2"
        style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}
      >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: category pills */}
        <div className="flex flex-wrap items-center gap-2">
          {!loading && recipes.some(r => r.ai_category) &&
            Array.from(new Set(recipes.map(r => r.ai_category).filter(Boolean) as string[]))
              .sort()
              .map(cat => {
                const color = CATEGORY_COLORS[cat] ?? DEFAULT_CAT_COLOR;
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(active ? null : cat)}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.75rem',
                      fontWeight: active ? 700 : 500,
                      background: active ? color.bg : 'var(--surface)',
                      color: active ? color.text : 'var(--text-muted)',
                      border: `1.5px solid ${active ? color.border : 'var(--border-strong)'}`,
                      borderRadius: '999px',
                      padding: '3px 11px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {cat}
                  </button>
                );
              })
          }
        </div>

        {!loading && recipes.length > 0 && (
          <div className="flex items-center gap-2">

            {/* AI search toggle */}
            <button
              onClick={() => { setAiMode(v => !v); if (aiMode) { setAiQuery(''); setAiResultIds(null); } }}
              className="sort-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontFamily: 'var(--font-body)', fontWeight: aiMode ? 600 : 500,
                color: aiMode ? 'var(--accent)' : 'var(--text)',
                background: aiMode ? 'var(--accent-dim)' : 'var(--surface)',
                border: aiMode ? '1.5px solid var(--accent)' : '1.5px solid var(--border-strong)',
                borderRadius: '999px', cursor: 'pointer', outline: 'none',
              }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C12 2 13 8 18 9C13 10 12 16 12 16C12 16 11 10 6 9C11 8 12 2 12 2Z"/>
              </svg>
              Ask AI
            </button>

            {/* Filter button */}
            <div style={{ position: 'relative' }}>
              <button
                ref={filterBtnRef}
                onClick={() => {
                  const rect = filterBtnRef.current?.getBoundingClientRect();
                  if (rect) setFilterPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
                  setShowFilter(v => !v);
                }}
                className="sort-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  fontFamily: 'var(--font-body)', fontWeight: filter !== 'all' ? 600 : 500,
                  color: filter !== 'all' ? 'var(--accent)' : 'var(--text)',
                  background: filter !== 'all' ? 'var(--accent-dim)' : 'var(--surface)',
                  border: filter !== 'all' ? '1.5px solid var(--accent)' : '1.5px solid var(--border-strong)',
                  borderRadius: '999px', cursor: 'pointer', outline: 'none',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                {filter === 'all' ? 'Filter' : FILTER_LABELS[filter]}
                {filter !== 'all' && (
                  <span
                    onClick={e => { e.stopPropagation(); setFilter('all'); localStorage.setItem('recipes-filter', 'all'); }}
                    style={{ marginLeft: '2px', display: 'flex', alignItems: 'center', color: 'var(--accent)', cursor: 'pointer' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </span>
                )}
              </button>
              {showFilter && createPortal(
                <div ref={filterRef}
                  style={{
                    position: 'absolute', top: filterPos.top, right: filterPos.right, zIndex: 9999,
                    background: 'var(--surface)', border: '1.5px solid var(--border-strong)',
                    borderRadius: '10px', overflow: 'hidden', minWidth: '160px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  }}
                >
                  {(['all', 'ready', 'out', 'rated', 'unrated', 'stale'] as FilterOption[]).map(opt => (
                    <button key={opt}
                      onClick={() => { setFilter(opt); localStorage.setItem('recipes-filter', opt); setShowFilter(false); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 14px', border: 'none',
                        background: opt === filter ? 'var(--accent-dim)' : 'transparent',
                        color: opt === filter ? 'var(--accent)' : 'var(--text)',
                        fontFamily: 'var(--font-body)', fontWeight: opt === filter ? 600 : 400,
                        fontSize: '0.8125rem', cursor: 'pointer',
                      }}
                    >
                      {FILTER_LABELS[opt]}
                    </button>
                  ))}
                </div>,
                document.body
              )}
            </div>

            {/* Sort button */}
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
                {{ az: 'A → Z', newest: 'Newest first', oldest: 'Oldest first', rating: 'Top rated', coverage: 'What can I make' }[sort]}
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
                  {(['az', 'newest', 'oldest', 'rating', 'coverage'] as SortOption[]).map(opt => (
                    <button key={opt}
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
                      {{ az: 'A → Z', newest: 'Newest first', oldest: 'Oldest first', rating: 'Top rated', coverage: 'What can I make' }[opt]}
                    </button>
                  ))}
                </div>,
                document.body
              )}
            </div>

          </div>
        )}
      </div>
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
          {(() => {
            const base = aiResultIds
              ? recipes.filter(r => aiResultIds.includes(r.id)).sort((a, b) => aiResultIds.indexOf(a.id) - aiResultIds.indexOf(b.id))
              : (search ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase())) : recipes);
            const catFiltered = (!aiResultIds && selectedCategory) ? base.filter(r => r.ai_category === selectedCategory) : base;
            const filtered = aiResultIds ? catFiltered : applyFilter(catFiltered, filter, pantryItems);
            const displayed = aiResultIds ? filtered : sortRecipes(filtered, sort, pantryItems);
            if (displayed.length === 0) return (
              <div className="col-span-2 sm:col-span-3 text-center py-16">
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>No results</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {search ? `No recipes match "${search}"` : `No recipes match the current filter`}
                </p>
              </div>
            );
            return displayed.map((r, i) => (
              <div key={r.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <RecipeTile recipe={r} pantryItems={pantryItems} />
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
