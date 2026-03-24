import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRecipe, getPantryItems, addPantryItem, updatePantryItem, deleteRecipe } from '../api';
import type { Recipe, PantryItem } from '../types';
import StarDisplay from '../components/StarDisplay';
import BakedModal from '../components/BakedModal';
import CookbookModal from '../components/CookbookModal';
import { scaleAmount } from '../utils/scaleAmount';

type Tab = 'ingredients' | 'instructions';
type IngStatus = 'in-stock' | 'low' | 'missing';

const STATUS_DOT: Record<IngStatus, string> = {
  'in-stock': '#6B9E6B',
  'low': '#00C4B4',
  'missing': '#E8293A',
};

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<Tab>('ingredients');
  const [scale, setScale] = useState(1);
  const [showBaked, setShowBaked] = useState(false);
  const [showCookbook, setShowCookbook] = useState(false);

  // Pantry
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [showPantryModal, setShowPantryModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [addingToList, setAddingToList] = useState<Set<string>>(new Set());
  const [addingAll, setAddingAll] = useState(false);

  useEffect(() => {
    if (!id) return;
    getRecipe(id)
      .then(setRecipe)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    getPantryItems().then(setPantryItems).catch(() => {});
  }, []);

  useEffect(() => {
    setBannerDismissed(false);
  }, [id]);

  function adjustScale(delta: number) {
    setScale(s => Math.max(0.5, Math.min(10, parseFloat((s + delta).toFixed(2)))));
  }

  const scaleLabel = `${scale}×`;

  function matchPantry(name: string): PantryItem | null {
    const n = name.toLowerCase().trim();
    for (const item of pantryItems) {
      const p = item.name.toLowerCase().trim();
      if (n.includes(p) || p.includes(n)) return item;
    }
    const STOPWORDS = new Set([
      'powder', 'sauce', 'extract', 'whole', 'dried', 'fresh', 'ground',
      'chopped', 'sliced', 'minced', 'large', 'small', 'medium', 'room',
      'temperature', 'packed', 'softened', 'melted', 'unsalted', 'salted',
      'heavy', 'light', 'dark', 'semi', 'sweet', 'dutch', 'process',
      'mix', 'mix,', 'type', 'style', 'purpose', 'free', 'fat',
    ]);
    const stem = (w: string) => w.replace(/ies$/, 'y').replace(/es$/, '').replace(/s$/, '');
    const words = n.split(/[\s,-]+/).filter(w => w.length >= 3 && !STOPWORDS.has(w)).map(stem);
    for (const item of pantryItems) {
      const pwords = item.name.toLowerCase().split(/[\s,-]+/).filter(w => w.length >= 3 && !STOPWORDS.has(w)).map(stem);
      if (words.length > 0 && pwords.length > 0 && words.some(w => pwords.some(pw => w === pw))) return item;
    }
    return null;
  }

  function getIngStatus(name: string): IngStatus {
    if (!pantryItems.length) return 'missing';
    const match = matchPantry(name);
    if (!match) return 'missing';
    if (match.needs_purchase === 1) return 'low';
    return 'in-stock';
  }

  const allIngredients = recipe?.ingredient_groups.flatMap(g => g.ingredients) ?? [];
  const hasMissingOrLow = pantryItems.length > 0 &&
    allIngredients.some(ing => getIngStatus([ing.unit, ing.name].filter(Boolean).join(' ')) !== 'in-stock');

  async function addToShoppingList(ingName: string) {
    if (addingToList.has(ingName)) return;
    setAddingToList(prev => new Set(prev).add(ingName));
    try {
      const match = matchPantry(ingName);
      if (match) {
        if (match.needs_purchase !== 1) {
          const updated = await updatePantryItem(match.id, { needs_purchase: 1 });
          setPantryItems(prev => prev.map(p => p.id === updated.id ? updated : p));
        }
      } else {
        const newItem = await addPantryItem({ name: ingName, quantity: 0, unit: '', needs_purchase: 1 });
        setPantryItems(prev => [...prev, newItem]);
      }
    } finally {
      setAddingToList(prev => { const s = new Set(prev); s.delete(ingName); return s; });
    }
  }

  async function addAllMissing() {
    if (addingAll) return;
    setAddingAll(true);
    try {
      const missing = allIngredients.filter(ing => getIngStatus([ing.unit, ing.name].filter(Boolean).join(' ')) !== 'in-stock');
      for (const ing of missing) {
        await addToShoppingList(ing.name);
      }
    } finally {
      setAddingAll(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteRecipe(id);
      navigate('/recipes');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="skeleton w-full" style={{ height: '50vh' }} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          <div className="skeleton h-10 w-2/3 rounded-xl" />
          <div className="skeleton h-4 w-full rounded-lg" />
          <div className="skeleton h-4 w-5/6 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Recipe not found.</p>
        <Link
          to="/recipes"
          className="text-sm mt-2 inline-block"
          style={{ color: 'var(--accent)', textDecoration: 'none' }}
        >
          ← All Recipes
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: '48vh', minHeight: 300, maxHeight: 560 }}
      >
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: 'linear-gradient(135deg, var(--purple-lt) 0%, var(--teal-lt) 50%, var(--pink-lt) 100%)' }}
          />
        )}

        {/* Bottom gradient */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ height: '65%', background: 'linear-gradient(to top, rgba(15,12,30,0.72) 0%, rgba(15,12,30,0.2) 55%, transparent 100%)' }}
        />

        {/* Delete — top-right */}
        <div className="absolute top-4 right-4 z-10">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete recipe"
              className="flex items-center justify-center rounded-full transition-all duration-200"
              style={{
                width: '2.25rem', height: '2.25rem',
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(6px)',
                color: 'rgba(255,255,255,0.7)',
                border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(176,80,80,0.8)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </button>
          ) : (
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
            >
              <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Delete?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#E8997A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? '…' : 'Yes'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                No
              </button>
            </div>
          )}
        </div>

        {/* Breadcrumb + Title */}
        <div className="absolute inset-x-0 bottom-0 px-4 sm:px-6 pb-8 max-w-3xl mx-auto">
          <div className="flex items-center gap-1.5 mb-3">
            <Link
              to="/recipes"
              className="text-xs font-medium transition-colors duration-200"
              style={{ color: 'rgba(255,251,233,0.55)', fontFamily: 'var(--font-body)', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,251,233,0.9)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,251,233,0.55)'; }}
            >
              All Recipes
            </Link>
            <span style={{ color: 'rgba(255,251,233,0.35)', fontSize: '0.75rem' }}>/</span>
          </div>
          <h1
            className="text-white animate-fade-up"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)',
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              textShadow: '0 2px 20px rgba(0,0,0,0.35)',
            }}
          >
            {recipe.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 pt-8">

        {/* Info card */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-6 animate-fade-up"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Description */}
          {recipe.description && (
            <p
              className="mb-6 leading-relaxed"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--text)',
                fontSize: '0.9375rem',
                lineHeight: 1.75,
                opacity: 0.85,
              }}
            >
              {recipe.description}
            </p>
          )}

          {/* Meta pills */}
          {(recipe.prep_time || recipe.cook_time || recipe.yield) && (
            <div className="flex gap-2 mb-6">
              {[
                recipe.prep_time && { label: 'Prep', value: recipe.prep_time },
                recipe.cook_time && { label: 'Cook', value: recipe.cook_time },
                recipe.yield && { label: 'Yield', value: recipe.yield },
              ]
                .filter(Boolean)
                .map((stat, i) => stat && (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{
                      fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      marginBottom: '3px', fontFamily: 'var(--font-body)',
                    }}>
                      {stat.label}
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
                      {stat.value}
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* Pantry banner */}
          {hasMissingOrLow && !bannerDismissed && (
            <div
              className="flex items-center gap-3 rounded-xl mb-5"
              style={{
                background: 'var(--teal-lt)',
                borderLeft: '3px solid var(--teal)',
                padding: '12px 14px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text)' }}>
                You may be missing some ingredients.{' '}
                <button
                  onClick={() => setShowPantryModal(true)}
                  style={{ color: 'var(--teal)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}
                >
                  See what's needed →
                </button>
              </span>
              <button
                onClick={() => setBannerDismissed(true)}
                className="w-6 h-6 flex items-center justify-center rounded-full text-base leading-none transition-colors shrink-0"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {/* Primary */}
            <button
              onClick={() => setShowBaked(true)}
              className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all duration-200"
              style={
                recipe.rating
                  ? {
                      background: 'var(--accent-dim)',
                      border: '1.5px solid var(--accent)',
                      color: 'var(--accent)',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                    }
                  : {
                      background: 'var(--accent)',
                      color: 'white',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-body)',
                      boxShadow: '0 2px 12px var(--accent-glow)',
                      border: 'none',
                      cursor: 'pointer',
                    }
              }
              onMouseEnter={e => { if (!recipe.rating) e.currentTarget.style.background = '#D94E7A'; }}
              onMouseLeave={e => { if (!recipe.rating) e.currentTarget.style.background = 'var(--accent)'; }}
            >
              {recipe.rating ? (
                <><span>✓ Baked</span><StarDisplay rating={recipe.rating} size="sm" /></>
              ) : (
                'Mark as Baked'
              )}
            </button>

            {/* Secondary row */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowCookbook(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all duration-200"
                style={{
                  border: '1.5px solid var(--border-strong)',
                  color: 'var(--text)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-body)',
                  background: 'var(--surface)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                  e.currentTarget.style.background = 'var(--accent-dim)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.color = 'var(--text)';
                  e.currentTarget.style.background = 'var(--surface)';
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                Add to Cookbook
              </button>

              {recipe.source_url && (
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                  style={{
                    border: '1.5px solid var(--border-strong)',
                    color: 'var(--text-muted)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-body)',
                    textDecoration: 'none',
                    background: 'var(--surface)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--text-secondary)';
                    e.currentTarget.style.color = 'var(--text)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-strong)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Source
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs + Scale */}
        <div className="mb-6 animate-fade-up delay-2 flex items-end justify-between" style={{ borderBottom: '1.5px solid var(--border-strong)' }}>
          <div className="flex gap-0">
            {(['ingredients', 'instructions'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="relative px-5 py-3 text-sm font-medium capitalize transition-colors duration-200 -mb-px"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === t ? '2.5px solid var(--accent)' : '2.5px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Scale control */}
          <div className="flex items-center gap-2.5 pb-5">
<button onClick={() => adjustScale(-0.5)} className="transition-all duration-150" style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)', border: '1.5px solid var(--border-strong)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1, paddingBottom: '4px', flexShrink: 0 }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>−</button>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 700, color: scale !== 1 ? 'var(--accent)' : 'var(--text)', minWidth: '2rem', textAlign: 'center', letterSpacing: '-0.02em' }}>{scaleLabel}</span>
            <button onClick={() => adjustScale(0.5)} className="transition-all duration-150" style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)', border: '1.5px solid var(--border-strong)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1, paddingBottom: '4px', flexShrink: 0 }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>+</button>
          </div>
        </div>

        {/* Ingredients tab */}
        {tab === 'ingredients' && (
          <div className="space-y-7 animate-fade-up">
            {recipe.ingredient_groups.map((group, gi) => (
              <div key={gi}>
                {group.group_name && (
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="text-xs font-semibold uppercase tracking-[0.12em]"
                      style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
                    >
                      {group.group_name}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border-strong)' }} />
                  </div>
                )}
                <ul className="space-y-2.5">
                  {group.ingredients.map((ing, ii) => {
                    const status = getIngStatus([ing.unit, ing.name].filter(Boolean).join(' '));
                    const dotColor = pantryItems.length > 0 ? STATUS_DOT[status] : 'var(--purple)';
                    return (
                      <li key={ii} className="flex items-baseline gap-3">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
                          style={{ background: dotColor }}
                          title={pantryItems.length > 0 ? status : undefined}
                        />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--text)' }}>
                          <span
                            key={`${scale}-${gi}-${ii}`}
                            className="font-semibold animate-amount"
                          >
                            {[scaleAmount(ing.amount, scale), ing.unit].filter(Boolean).join(' ')}
                          </span>{' '}
                          {ing.name}
                          {ing.notes && (
                            <span
                              className="ml-1"
                              style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}
                            >
                              ({ing.notes})
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            {/* Equipment */}
            {recipe.equipment && recipe.equipment.length > 0 && (
              <div
                className="rounded-2xl p-5 mt-4"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-strong)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                  </svg>
                  <h3
                    className="text-xs font-semibold uppercase tracking-[0.1em]"
                    style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    Equipment
                  </h3>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {recipe.equipment.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--text)', fontFamily: 'var(--font-body)' }}
                    >
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pantry legend */}
            {pantryItems.length > 0 && (
              <div className="flex items-center gap-4 pt-2">
                {([['in-stock', 'In stock'], ['low', 'Low / on list'], ['missing', 'Not in pantry']] as [IngStatus, string][]).map(([s, label]) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_DOT[s] }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instructions tab */}
        {tab === 'instructions' && (
          <ol className="space-y-6 animate-fade-up">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="flex gap-5">
                <div className="shrink-0 flex flex-col items-center">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                    style={{
                      background: 'var(--accent)',
                      fontFamily: 'var(--font-body)',
                      boxShadow: '0 2px 8px var(--accent-glow)',
                    }}
                  >
                    {i + 1}
                  </span>
                  {i < recipe.instructions.length - 1 && (
                    <div className="flex-1 w-px mt-2" style={{ background: 'var(--border-strong)', minHeight: '1.5rem' }} />
                  )}
                </div>
                <p
                  className="pb-2 leading-relaxed pt-1"
                  style={{ fontFamily: 'var(--font-body)', color: 'var(--text)', fontSize: '0.9375rem', lineHeight: 1.8 }}
                >
                  {step}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Modals */}
      {showBaked && (
        <BakedModal recipe={recipe} onClose={() => setShowBaked(false)} onSave={setRecipe} />
      )}
      {showCookbook && (
        <CookbookModal recipeId={recipe.id} onClose={() => setShowCookbook(false)} />
      )}

      {/* Pantry check modal */}
      {showPantryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          style={{ background: 'rgba(15,12,30,0.45)' }}
          onClick={e => e.target === e.currentTarget && setShowPantryModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl animate-scale-in flex flex-col"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-xl)', maxHeight: '82vh' }}
          >
            <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--surface-hover)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text)', letterSpacing: '-0.01em' }}>
                Ingredients Check
              </h2>
              <button
                onClick={() => setShowPantryModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-xl leading-none"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-4">
              <div className="space-y-1">
                {allIngredients.map((ing, i) => {
                  const status = getIngStatus([ing.unit, ing.name].filter(Boolean).join(' '));
                  const icon = status === 'in-stock' ? '✓' : status === 'low' ? '~' : '−';
                  const iconColor = status === 'in-stock' ? '#6B9E6B' : status === 'low' ? 'var(--teal)' : '#E03E3E';
                  const isAdding = addingToList.has(ing.name);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{
                        background: status === 'missing' ? 'rgba(224,62,62,0.05)' : status === 'low' ? 'var(--teal-lt)' : 'transparent',
                      }}
                    >
                      <span className="text-sm font-bold shrink-0 w-4 text-center" style={{ color: iconColor }}>{icon}</span>
                      <span
                        style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text)' }}
                      >
                        {[ing.amount, ing.unit, ing.name].filter(Boolean).join(' ')}
                      </span>
                      {status !== 'in-stock' && (
                        <button
                          onClick={() => addToShoppingList(ing.name)}
                          disabled={isAdding}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-200 disabled:opacity-40 shrink-0"
                          style={{
                            border: '1.5px solid var(--teal)',
                            color: 'var(--teal)',
                            fontFamily: 'var(--font-body)',
                            background: 'var(--surface)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={e => { if (!isAdding) e.currentTarget.style.background = 'var(--teal-lt)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; }}
                        >
                          {isAdding ? '…' : '+ List'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--surface-hover)' }}>
              <button
                onClick={addAllMissing}
                disabled={addingAll || allIngredients.every(ing => getIngStatus([ing.unit, ing.name].filter(Boolean).join(' ')) === 'in-stock')}
                className="w-full py-2.5 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--accent)',
                  fontFamily: 'var(--font-body)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px var(--accent-glow)',
                }}
                onMouseEnter={e => { if (!addingAll) e.currentTarget.style.background = '#D94E7A'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
              >
                {addingAll ? 'Adding…' : 'Add all missing to Shopping List'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
