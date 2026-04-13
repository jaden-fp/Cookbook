import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRecipe, getPantryItems, addPantryItem, updatePantryItem, deleteRecipe, updateRecipe, updateBakeLog, getCookbooks, createCookbook, addRecipesToCookbook, getRecipeCookbooks, setRecipeCookbooks, lookupIngredientPrice, getShelf, addToShelf, removeFromShelf } from '../api';
import type { BakeEntry } from '../types';
import type { Recipe, PantryItem } from '../types';
import StarDisplay from '../components/StarDisplay';
import BakedModal from '../components/BakedModal';
import CookbookModal from '../components/CookbookModal';
import { scaleAmount, splitCompound } from '../utils/scaleAmount';
import { estimateCost, totalCost, costCoverage, hasUserOverride, setUserOverride, resetUserOverride, findEntryKey, getAllPriceEntries, getAIPrice, setAIPrice } from '../utils/ingredientCost';
import type { PackageUnit, AIPrice } from '../utils/ingredientCost';
import NutritionPanel from '../components/NutritionPanel';
import BakingMode from '../components/BakingMode';
import { findPantryMatch, getIngredientStatus, type IngStatus } from '../utils/pantryMatch';

type Tab = 'ingredients' | 'instructions' | 'nutrition' | 'cost';

function formatBakeDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function BakeHistory({ entries, onUpdate }: { entries: BakeEntry[]; onUpdate: (log: BakeEntry[]) => void }) {
  const sorted = [...entries].map((e, origIdx) => ({ ...e, origIdx })).sort((a, b) => b.date.localeCompare(a.date));
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  function startEdit(origIdx: number, entry: BakeEntry) {
    setEditingIdx(origIdx);
    setEditDate(entry.date);
    setEditNotes(entry.notes ?? '');
  }

  async function saveEdit() {
    if (editingIdx === null) return;
    setSaving(true);
    const updated = entries.map((e, i) =>
      i === editingIdx ? { ...e, date: editDate, notes: editNotes || null } : e
    );
    onUpdate(updated);
    setEditingIdx(null);
    setSaving(false);
  }

  function deleteEntry(origIdx: number) {
    onUpdate(entries.filter((_, i) => i !== origIdx));
  }

  return (
    <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}>
          Bake History
        </span>
        <span className="text-xs font-semibold" style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)', marginLeft: 'auto' }}>
          {entries.length} {entries.length === 1 ? 'time' : 'times'}
        </span>
      </div>
      {lightboxUrl && createPortal(
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={lightboxUrl}
            alt="Bake photo"
            style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
          />
        </div>,
        document.body
      )}
      <div className="space-y-2">
        {sorted.map(({ origIdx, ...entry }) => (
          <div key={origIdx}>
            {editingIdx === origIdx ? (
              <div className="py-2.5 px-3 rounded-xl space-y-2" style={{ background: 'var(--bg-subtle)', border: '1.5px solid var(--accent)' }}>
                <input
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  style={{
                    width: '100%', fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
                    color: 'var(--text)', background: 'var(--surface)',
                    border: '1px solid var(--border-strong)', borderRadius: '6px',
                    padding: '5px 8px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  rows={2}
                  style={{
                    width: '100%', fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
                    color: 'var(--text)', background: 'var(--surface)',
                    border: '1px solid var(--border-strong)', borderRadius: '6px',
                    padding: '5px 8px', outline: 'none', resize: 'none', boxSizing: 'border-box',
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={saving || !editDate}
                    style={{
                      flex: 1, fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600,
                      color: '#fff', background: 'var(--accent)', border: 'none',
                      borderRadius: '6px', padding: '5px 10px', cursor: 'pointer',
                      opacity: saving || !editDate ? 0.6 : 1,
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingIdx(null)}
                    style={{
                      fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
                      color: 'var(--text-muted)', background: 'transparent', border: 'none',
                      borderRadius: '6px', padding: '5px 10px', cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl group overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
                {entry.photo_url && (
                  <button
                    onClick={() => setLightboxUrl(entry.photo_url!)}
                    style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'none', cursor: 'zoom-in' }}
                  >
                    <img
                      src={entry.photo_url}
                      alt="Bake photo"
                      style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                    />
                  </button>
                )}
                <div className="flex items-start gap-3 py-2 px-3">
                  <div className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: 'var(--accent)' }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
                      {formatBakeDate(entry.date)}
                    </span>
                    {entry.notes && (
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                        {entry.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => startEdit(origIdx, entry)}
                      title="Edit"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteEntry(origIdx)}
                      title="Delete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
// IngStatus imported from ../utils/pantryMatch

const STATUS_DOT: Record<IngStatus, string> = {
  'in-stock': '#6B9E6B',
  'missing': '#E8293A',
};

const METRIC_UNITS = '(g|ml|grams?|milliliters?|kg|kilograms?|liters?|l)';
const METRIC_UNIT_RE = new RegExp(METRIC_UNITS, 'i');

/**
 * Strip metric unit from combined unit strings.
 * Handles: "cups g", "cups/ml", "cups / grams", "grams" (standalone), etc.
 * If the whole unit is metric, returns empty string (we have no imperial fallback).
 */
function cleanUnit(unit: string): string {
  const s = unit
    .replace(new RegExp(`\\s*[/|]\\s*${METRIC_UNITS}\\s*$`, 'i'), '')  // "cups/g" → "cups"
    .replace(new RegExp(`\\s+${METRIC_UNITS}\\s*$`, 'i'), '')            // "cups g" → "cups"
    .trim();
  // If what remains is itself a pure metric unit, drop it entirely
  if (METRIC_UNIT_RE.test(s) && !s.match(/cup|tbsp|tsp|oz|lb|pound|tablespoon|teaspoon/i)) return '';
  return s;
}

/** Remove metric measurements from an amount string like "1 cup (240ml)" → "1 cup". */
function cleanAmount(amount: string): string {
  return amount
    .replace(new RegExp(`\\s*[/(]\\s*\\d+\\.?\\d*\\s*${METRIC_UNITS}\\s*\\)?\\s*`, 'gi'), '')
    .replace(/\s*\(\s*\)\s*/, '')  // remove empty parens left behind
    .trim();
}

/** Remove metric measurements from notes, preserving other content like "room temp". */
function cleanNotes(notes: string): string {
  return notes
    .replace(new RegExp(`\\d+\\.?\\d*\\s*${METRIC_UNITS}\\s*[,;]?\\s*`, 'gi'), '')
    .replace(/\(\s*\)/, '')        // remove empty parens
    .trim()
    .replace(/^[,;]\s*/, '')
    .trim();
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<Tab>('ingredients');
  const [scale, setScale] = useState(1);
  const [scaleInput, setScaleInput] = useState('1');
  const [customCatInput, setCustomCatInput] = useState('');
  const [showBaked, setShowBaked] = useState(false);
  const [showBaking, setShowBaking] = useState(false);
  const [showCookbook, setShowCookbook] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<{
    title: string;
    description: string;
    prep_time: string;
    cook_time: string;
    yield: string;
    ingredient_groups: import('../types').IngredientGroup[];
    instructions: string[];
    equipment: string[];
    image_url: string | null;
    ai_category: string | null;
    tags: string[];
  } | null>(null);

  // Pantry
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [showPantryModal, setShowPantryModal] = useState(false);
  const [, setBannerDismissed] = useState(false);
  const [addingToList, setAddingToList] = useState<Set<string>>(new Set());
  const [addingAll, setAddingAll] = useState(false);
  const [queuing, setQueuing] = useState(false);
  const [isQueued, setIsQueued] = useState(false);
  const [isOnShelf, setIsOnShelf] = useState(false);
  const [shelving, setShelving] = useState(false);

  // Cost tab price editing
  const [editingPriceKey, setEditingPriceKey] = useState<string | null>(null);
  const [priceForm, setPriceForm] = useState<{ price: string; amount: string; unit: PackageUnit }>({ price: '', amount: '', unit: 'oz' });
  const [priceVersion, setPriceVersion] = useState(0);
  const [aiPrices, setAiPrices] = useState<Record<string, AIPrice>>({});
  const [fetchingAI, setFetchingAI] = useState(false);

  useEffect(() => {
    if (!id) return;
    getRecipe(id)
      .then(setRecipe)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getRecipeCookbooks(id).then(books => {
      setIsQueued(books.some(b => b.name.toLowerCase() === 'queued'));
    }).catch(() => {});
    getShelf().then(ids => setIsOnShelf(ids.includes(id))).catch(() => {});
  }, [id]);

  useEffect(() => {
    getPantryItems().then(setPantryItems).catch(() => {});
  }, []);

  useEffect(() => {
    setBannerDismissed(false);
  }, [id]);

  // Fetch AI prices for unmatched ingredients when cost tab opens
  useEffect(() => {
    if (tab !== 'cost' || !recipe) return;

    const allIngredients = recipe.ingredient_groups.flatMap(g => g.ingredients);
    const unmatched = allIngredients.filter(ing => {
      const { cost } = estimateCost(ing.amount, ing.unit, ing.name);
      return cost === null;
    });
    if (!unmatched.length) return;

    // Load from localStorage cache first
    const fromCache: Record<string, AIPrice> = {};
    const needsFetch: string[] = [];
    const seen = new Set<string>();

    for (const ing of unmatched) {
      const key = ing.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const cached = getAIPrice(ing.name);
      if (cached) {
        fromCache[key] = cached;
      } else {
        needsFetch.push(ing.name);
      }
    }

    if (Object.keys(fromCache).length) {
      setAiPrices(prev => ({ ...prev, ...fromCache }));
    }
    if (!needsFetch.length) return;

    setFetchingAI(true);
    Promise.all(
      needsFetch.map(async name => {
        const result = await lookupIngredientPrice(name);
        if (result) {
          setAIPrice(name, result);
          return [name.toLowerCase(), result] as const;
        }
        return null;
      })
    ).then(results => {
      const newPrices: Record<string, AIPrice> = {};
      for (const r of results) {
        if (r) newPrices[r[0]] = r[1];
      }
      setAiPrices(prev => ({ ...prev, ...newPrices }));
    }).finally(() => setFetchingAI(false));
  }, [tab, recipe?.id]);

  async function handleShelf() {
    if (!recipe || shelving) return;
    setShelving(true);
    try {
      if (isOnShelf) {
        await removeFromShelf(recipe.id);
        setIsOnShelf(false);
      } else {
        await addToShelf(recipe.id);
        setIsOnShelf(true);
      }
    } finally {
      setShelving(false);
    }
  }

  async function handleQueue() {
    if (!recipe || queuing) return;
    setQueuing(true);
    try {
      if (isQueued) {
        // Remove from Queued cookbook
        const currentBooks = await getRecipeCookbooks(recipe.id);
        const queuedBook = currentBooks.find(b => b.name.toLowerCase() === 'queued');
        if (queuedBook) {
          const remaining = currentBooks.filter(b => b.id !== queuedBook.id).map(b => b.id);
          await setRecipeCookbooks(recipe.id, remaining);
        }
        setIsQueued(false);
      } else {
        // Add to Queued cookbook (create if doesn't exist)
        const allBooks = await getCookbooks();
        let queued = allBooks.find(b => b.name.toLowerCase() === 'queued');
        if (!queued) queued = await createCookbook('Queued');
        await addRecipesToCookbook(queued.id, [recipe.id]);
        setIsQueued(true);
      }
    } finally {
      setQueuing(false);
    }
  }

  function adjustScale(delta: number) {
    setScale(s => {
      const next = Math.max(0.5, Math.min(10, parseFloat((s + delta).toFixed(2))));
      setScaleInput(String(next));
      return next;
    });
  }

  function handleScaleInput(val: string) {
    setScaleInput(val);
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0.25 && n <= 20) setScale(n);
  }

  function commitScaleInput() {
    const n = parseFloat(scaleInput);
    if (isNaN(n) || n < 0.25) { setScale(0.25); setScaleInput('0.25'); }
    else if (n > 20) { setScale(20); setScaleInput('20'); }
    else { const rounded = parseFloat(n.toFixed(2)); setScale(rounded); setScaleInput(String(rounded)); }
  }

  function matchPantry(name: string): PantryItem | null {
    return findPantryMatch(name, pantryItems);
  }

  function getIngStatus(name: string): IngStatus {
    return getIngredientStatus(name, pantryItems);
  }

  const allIngredients = recipe?.ingredient_groups.flatMap(g => g.ingredients) ?? [];
  const hasMissingOrLow = pantryItems.length > 0 &&
    allIngredients.some(ing => getIngStatus(ing.name) !== 'in-stock');

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
        const capitalized = ingName.replace(/(^|[\s-])(\w)/g, (_, sep, c) => sep + c.toUpperCase());
        const newItem = await addPantryItem({ name: capitalized, quantity: 0, unit: '', needs_purchase: 1 });
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
      const missing = allIngredients.filter(ing => getIngStatus(ing.name) !== 'in-stock');
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

  function openEdit() {
    if (!recipe) return;
    setDraft({
      title: recipe.title,
      description: recipe.description ?? '',
      prep_time: recipe.prep_time ?? '',
      cook_time: recipe.cook_time ?? '',
      yield: recipe.yield ?? '',
      ingredient_groups: JSON.parse(JSON.stringify(recipe.ingredient_groups)),
      instructions: [...recipe.instructions],
      equipment: [...recipe.equipment],
      image_url: recipe.image_url ?? null,
      ai_category: recipe.ai_category ?? null,
      tags: recipe.tags ?? [],
    });
    const PRESETS = ['Cookies', 'Cakes', 'Bars'];
    setCustomCatInput(recipe.ai_category && !PRESETS.includes(recipe.ai_category) ? recipe.ai_category : '');
    setTagInput('');
    setIsEditing(true);
  }


  function cancelEdit() {
    setIsEditing(false);
    setDraft(null);
  }

  async function handleSaveEdit() {
    if (!id || !recipe || !draft || saving) return;
    setSaving(true);
    try {
      const updated = await updateRecipe(id, {
        title: draft.title.trim() || recipe.title,
        description: draft.description.trim() || undefined,
        prep_time: draft.prep_time.trim() || undefined,
        cook_time: draft.cook_time.trim() || undefined,
        yield: draft.yield.trim() || undefined,
        ingredient_groups: draft.ingredient_groups,
        instructions: draft.instructions.filter(s => s.trim()),
        equipment: draft.equipment.filter(e => e.trim()),
        image_url: draft.image_url !== recipe.image_url ? (draft.image_url ?? null) : undefined,
        ai_category: draft.ai_category !== recipe.ai_category ? (draft.ai_category ?? null) : undefined,
        tags: draft.tags,
      });
      setRecipe(updated);
      setIsEditing(false);
      setDraft(null);
    } finally {
      setSaving(false);
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
        style={{ height: '52vh', minHeight: 320, maxHeight: 640 }}
      >
        {(isEditing && draft ? draft.image_url : recipe.image_url) ? (
          <img
            src={(isEditing && draft ? draft.image_url : recipe.image_url)!}
            alt={recipe.title}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
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

        {/* Back arrow — top-left */}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => navigate(-1)}
            title="Go back"
            className="flex items-center justify-center rounded-full transition-all duration-200"
            style={{
              width: '2.25rem', height: '2.25rem',
              background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)',
              color: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Edit / Save / Delete — top-right */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={cancelEdit}
                className="flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                  height: '2.25rem', padding: '0 14px',
                  background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)',
                  color: 'rgba(255,255,255,0.75)', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 500,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!draft?.title.trim() || saving}
                className="flex items-center justify-center rounded-full transition-all duration-200 disabled:opacity-40"
                style={{
                  height: '2.25rem', padding: '0 16px',
                  background: 'var(--accent)', backdropFilter: 'blur(6px)',
                  color: 'white', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600,
                  boxShadow: '0 2px 12px var(--accent-glow)',
                }}
                onMouseEnter={e => { if (draft?.title.trim() && !saving) e.currentTarget.style.background = '#D94E7A'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={openEdit}
                title="Edit recipe"
                className="flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                  width: '2.25rem', height: '2.25rem',
                  background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)',
                  color: 'rgba(255,255,255,0.7)', border: 'none', cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                title="Delete recipe"
                className="flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                  width: '2.25rem', height: '2.25rem',
                  background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)',
                  color: 'rgba(255,255,255,0.7)', border: 'none', cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(176,80,80,0.8)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Breadcrumb + Title */}
        <div className="absolute inset-x-0 bottom-0 px-4 sm:px-6 pb-8 max-w-3xl mx-auto">
          <div className="mb-3" />
          {isEditing && draft ? (
            <input
              type="text"
              value={draft.title}
              onChange={e => setDraft(d => d ? { ...d, title: e.target.value } : d)}
              className="w-full text-white"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                fontWeight: 600,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                background: 'rgba(255,255,255,0.12)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                borderRadius: '10px',
                padding: '8px 14px',
                outline: 'none',
              }}
            />
          ) : (
            <h1
              className="text-white animate-fade-up inline-flex items-end gap-2"
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
              {recipe.source_url && (
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="hidden sm:inline-flex items-center justify-center"
                  style={{
                    flexShrink: 0,
                    marginBottom: '6px',
                    marginLeft: '12px',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1.5px solid rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(6px)',
                    color: 'rgba(255,255,255,0.6)',
                    transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              {recipe.source_url && (
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="sm:hidden inline-flex items-center justify-center"
                  style={{
                    flexShrink: 0,
                    marginBottom: '4px',
                    marginLeft: '10px',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1.5px solid rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(6px)',
                    color: 'rgba(255,255,255,0.6)',
                    transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </h1>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-32 sm:pb-16 pt-8">

        {/* Info card */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-6 animate-fade-up"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative',
          }}
        >
          {/* Shelf button — top-right of card (second from right) */}
          <button
            onClick={handleShelf}
            disabled={shelving}
            title={isOnShelf ? 'Remove from weekend shelf' : 'Bake this weekend'}
            className="flex items-center justify-center rounded-full transition-all duration-200"
            style={{
              position: 'absolute', top: '14px', right: '54px',
              width: '2rem', height: '2rem',
              background: isOnShelf ? 'rgba(255,152,0,0.12)' : 'transparent',
              border: `1.5px solid ${isOnShelf ? '#ff9800' : 'var(--border-strong)'}`,
              color: isOnShelf ? '#ff9800' : 'var(--text-muted)',
              cursor: shelving ? 'wait' : 'pointer',
            }}
            onMouseEnter={e => {
              if (!isOnShelf) {
                e.currentTarget.style.borderColor = '#ff9800';
                e.currentTarget.style.color = '#ff9800';
                e.currentTarget.style.background = 'rgba(255,152,0,0.10)';
              }
            }}
            onMouseLeave={e => {
              if (!isOnShelf) {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={isOnShelf ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>

          {/* Queue button — top-right of card */}
          <button
            onClick={handleQueue}
            disabled={queuing}
            title={isQueued ? 'In Queued cookbook' : 'Add to Queued'}
            className="flex items-center justify-center rounded-full transition-all duration-200"
            style={{
              position: 'absolute', top: '14px', right: '14px',
              width: '2rem', height: '2rem',
              background: isQueued ? 'var(--accent-dim)' : 'transparent',
              border: `1.5px solid ${isQueued ? 'var(--accent)' : 'var(--border-strong)'}`,
              color: isQueued ? 'var(--accent)' : 'var(--text-muted)',
              cursor: queuing ? 'wait' : 'pointer',
            }}
            onMouseEnter={e => {
              if (!isQueued) {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
                e.currentTarget.style.background = 'var(--accent-dim)';
              }
            }}
            onMouseLeave={e => {
              if (!isQueued) {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {isQueued ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
              </svg>
            )}
          </button>
          {/* Description */}
          {isEditing && draft ? (
            <textarea
              value={draft.description}
              onChange={e => setDraft(d => d ? { ...d, description: e.target.value } : d)}
              rows={3}
              placeholder="Add a description…"
              className="w-full resize-none mb-6 transition-all duration-200"
              style={{
                border: '1.5px solid var(--border-strong)', borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-body)', fontSize: '0.9375rem',
                color: 'var(--text)', padding: '0.625rem 0.875rem',
                outline: 'none', background: 'var(--bg-subtle)', lineHeight: 1.75,
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
            />
          ) : recipe.description ? (
            <p
              className="mb-6 leading-relaxed"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--text)',
                fontSize: '0.9375rem',
                lineHeight: 1.75,
                opacity: 0.85,
                paddingRight: '2.5rem',
              }}
            >
              {recipe.description}
            </p>
          ) : null}

          {/* Meta pills */}
          {isEditing && draft ? (
            <div className="flex gap-2 mb-6">
              {([
                { label: 'Prep', key: 'prep_time' as const, placeholder: 'e.g. 15 min' },
                { label: 'Cook', key: 'cook_time' as const, placeholder: 'e.g. 30 min' },
                { label: 'Yield', key: 'yield' as const, placeholder: 'e.g. 12 cookies' },
              ]).map(({ label, key, placeholder }) => (
                <div
                  key={key}
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
                    marginBottom: '4px', fontFamily: 'var(--font-body)',
                  }}>
                    {label}
                  </div>
                  <input
                    type="text"
                    value={draft[key]}
                    onChange={e => setDraft(d => d ? { ...d, [key]: e.target.value } : d)}
                    placeholder={placeholder}
                    style={{
                      width: '100%', border: 'none', outline: 'none',
                      fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                      fontWeight: 600, color: 'var(--text)', background: 'transparent',
                      padding: 0,
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (recipe.prep_time || recipe.cook_time || recipe.yield) ? (
            <>
              {/* Desktop: all in one row */}
              <div className="hidden sm:flex gap-2 mb-6">
                {[
                  recipe.prep_time && { label: 'Prep', value: recipe.prep_time },
                  recipe.cook_time && { label: 'Cook', value: recipe.cook_time },
                  recipe.yield && { label: 'Yield', value: recipe.yield },
                ].filter(Boolean).map((stat, i) => stat && (
                  <div key={i} style={{ flex: 1, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px', fontFamily: 'var(--font-body)' }}>{stat.label}</div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Mobile: prep + cook on row 1, yield on row 2 */}
              <div className="flex sm:hidden flex-col gap-2 mb-6">
                {(recipe.prep_time || recipe.cook_time) && (
                  <div className="flex gap-2">
                    {recipe.prep_time && (
                      <div style={{ flex: 1, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px', fontFamily: 'var(--font-body)' }}>Prep</div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>{recipe.prep_time}</div>
                      </div>
                    )}
                    {recipe.cook_time && (
                      <div style={{ flex: 1, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px', fontFamily: 'var(--font-body)' }}>Cook</div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>{recipe.cook_time}</div>
                      </div>
                    )}
                  </div>
                )}
                {recipe.yield && (
                  <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px', fontFamily: 'var(--font-body)' }}>Yield</div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>{recipe.yield}</div>
                  </div>
                )}
              </div>
            </>
          ) : null}

          {/* Pantry banner */}
          {hasMissingOrLow && (
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
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                You may be missing some ingredients.
                <button
                  onClick={() => setShowPantryModal(true)}
                  style={{ display: 'block', color: 'var(--teal)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', fontSize: '0.8125rem', marginTop: '2px' }}
                >
                  See what's needed →
                </button>
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5">
            {/* Start Baking — hero CTA */}
            {recipe.instructions.length > 0 && (
              <button
                onClick={() => setShowBaking(true)}
                className="w-full inline-flex items-center justify-center gap-2.5 font-semibold transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), #D94E7A)',
                  border: 'none',
                  color: 'white',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '1rem',
                  padding: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 16px var(--accent-glow)',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 20px var(--accent-glow)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 16px var(--accent-glow)'; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Start Baking
              </button>
            )}

            {/* Baked + Cookbook — always side by side */}
            <div className="flex flex-row gap-2">
              <button
                onClick={() => setShowBaked(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-all duration-200"
                style={
                  (recipe.bake_log?.length ?? 0) > 0
                    ? {
                        background: 'var(--accent-dim)',
                        border: '1.5px solid var(--accent)',
                        color: 'var(--accent)',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer',
                      }
                    : {
                        background: 'var(--surface)',
                        border: '1.5px solid var(--border-strong)',
                        color: 'var(--text)',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer',
                      }
                }
                onMouseEnter={e => {
                  if (!recipe.bake_log?.length) {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--accent)';
                    e.currentTarget.style.background = 'var(--accent-dim)';
                  }
                }}
                onMouseLeave={e => {
                  if (!recipe.bake_log?.length) {
                    e.currentTarget.style.borderColor = 'var(--border-strong)';
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.background = 'var(--surface)';
                  }
                }}
              >
                {(recipe.bake_log?.length ?? 0) > 0 ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span>Baked {recipe.bake_log!.length}×</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span className="sm:hidden">Baked</span>
                    <span className="hidden sm:inline">Mark as Baked</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowCookbook(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-all duration-200"
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
                <span className="sm:hidden">Cookbook</span>
                <span className="hidden sm:inline">Add to Cookbook</span>
              </button>
            </div>
          </div>

          {/* Bake history */}
          {(recipe.bake_log?.length ?? 0) > 0 && (
            <BakeHistory
              entries={recipe.bake_log!}
              onUpdate={async (log) => {
                const updated = await updateBakeLog(recipe.id, log);
                setRecipe(updated);
              }}
            />
          )}
        </div>


        {/* Tabs + Scale (inline on desktop, stacked on mobile) */}
        <div className="mb-6 animate-fade-up delay-2" style={{ borderBottom: '1.5px solid var(--border-strong)' }}>
          <div className="flex items-end justify-between">
            <div className="flex gap-0 flex-1">
              {(['ingredients', 'instructions', 'nutrition', 'cost'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="relative flex-1 text-center py-3 font-medium capitalize transition-colors duration-200 -mb-px px-1 sm:px-5 text-xs sm:text-sm"
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

          </div>
        </div>

        {/* Ingredients tab */}
        {tab === 'ingredients' && (
          <div className="space-y-7 animate-fade-up">
            {(isEditing && draft ? draft.ingredient_groups : recipe.ingredient_groups).map((group, gi) => (
              <div key={gi}>
                {isEditing && draft ? (
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={group.group_name ?? ''}
                      onChange={e => setDraft(d => {
                        if (!d) return d;
                        const gs = d.ingredient_groups.map((g, i) => i === gi ? { ...g, group_name: e.target.value || null } : g);
                        return { ...d, ingredient_groups: gs };
                      })}
                      placeholder="Group name (optional)"
                      style={{
                        flex: 1, border: 'none', borderBottom: '1.5px solid var(--border-strong)',
                        fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600,
                        color: 'var(--accent)', background: 'transparent', outline: 'none',
                        textTransform: 'uppercase', letterSpacing: '0.12em', paddingBottom: '2px',
                      }}
                    />
                    {draft.ingredient_groups.length > 1 && (
                      <button
                        onClick={() => setDraft(d => d ? { ...d, ingredient_groups: d.ingredient_groups.filter((_, i) => i !== gi) } : d)}
                        style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
                      >Remove group</button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mb-3">
                    {group.group_name && (
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] shrink-0" style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}>
                        {group.group_name}
                      </span>
                    )}
                    <div className="flex-1 h-px" style={{ background: 'var(--border-strong)' }} />
                    {gi === 0 && (
                      <div className="flex items-center shrink-0" style={{ border: '1.5px solid var(--border-strong)', borderRadius: '999px', overflow: 'hidden', background: 'var(--surface)' }}>
                        <button
                          onClick={() => adjustScale(-0.5)}
                          className="flex items-center justify-center transition-colors duration-150"
                          style={{ width: '1.75rem', height: '1.75rem', fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', paddingBottom: '2px' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >−</button>
                        <div style={{ width: '1px', height: '1rem', background: 'var(--border-strong)' }} />
                        <input
                          type="text"
                          inputMode="decimal"
                          value={scaleInput}
                          onChange={e => handleScaleInput(e.target.value)}
                          onBlur={commitScaleInput}
                          onKeyDown={e => e.key === 'Enter' && (e.currentTarget.blur())}
                          style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', width: '38px', textAlign: 'center', padding: '0 2px', background: 'transparent', border: 'none', outline: 'none' }}
                        />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', paddingRight: '3px', userSelect: 'none' }}>×</span>
                        <div style={{ width: '1px', height: '1rem', background: 'var(--border-strong)' }} />
                        <button
                          onClick={() => adjustScale(0.5)}
                          className="flex items-center justify-center transition-colors duration-150"
                          style={{ width: '1.75rem', height: '1.75rem', fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', paddingBottom: '2px' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >+</button>
                      </div>
                    )}
                  </div>
                )}

                {isEditing && draft ? (
                  <div className="space-y-2">
                    {group.ingredients.map((ing, ii) => (
                      <div key={ii} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={ing.amount}
                          onChange={e => setDraft(d => {
                            if (!d) return d;
                            const gs = d.ingredient_groups.map((g, gi2) => gi2 !== gi ? g : {
                              ...g, ingredients: g.ingredients.map((ing2, ii2) => ii2 !== ii ? ing2 : { ...ing2, amount: e.target.value }),
                            });
                            return { ...d, ingredient_groups: gs };
                          })}
                          placeholder="amt"
                          style={{ width: '52px', border: '1.5px solid var(--border-strong)', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text)', padding: '5px 7px', outline: 'none', background: 'var(--bg-subtle)' }}
                          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                          onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; }}
                        />
                        <input
                          type="text"
                          value={ing.unit}
                          onChange={e => setDraft(d => {
                            if (!d) return d;
                            const gs = d.ingredient_groups.map((g, gi2) => gi2 !== gi ? g : {
                              ...g, ingredients: g.ingredients.map((ing2, ii2) => ii2 !== ii ? ing2 : { ...ing2, unit: e.target.value }),
                            });
                            return { ...d, ingredient_groups: gs };
                          })}
                          placeholder="unit"
                          style={{ width: '64px', border: '1.5px solid var(--border-strong)', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text)', padding: '5px 7px', outline: 'none', background: 'var(--bg-subtle)' }}
                          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                          onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; }}
                        />
                        <input
                          type="text"
                          value={ing.name}
                          onChange={e => setDraft(d => {
                            if (!d) return d;
                            const gs = d.ingredient_groups.map((g, gi2) => gi2 !== gi ? g : {
                              ...g, ingredients: g.ingredients.map((ing2, ii2) => ii2 !== ii ? ing2 : { ...ing2, name: e.target.value }),
                            });
                            return { ...d, ingredient_groups: gs };
                          })}
                          placeholder="ingredient name"
                          style={{ flex: 1, border: '1.5px solid var(--border-strong)', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text)', padding: '5px 7px', outline: 'none', background: 'var(--bg-subtle)' }}
                          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                          onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; }}
                        />
                        <input
                          type="text"
                          value={ing.notes ?? ''}
                          onChange={e => setDraft(d => {
                            if (!d) return d;
                            const gs = d.ingredient_groups.map((g, gi2) => gi2 !== gi ? g : {
                              ...g, ingredients: g.ingredients.map((ing2, ii2) => ii2 !== ii ? ing2 : { ...ing2, notes: e.target.value || null }),
                            });
                            return { ...d, ingredient_groups: gs };
                          })}
                          placeholder="notes"
                          style={{ width: '90px', border: '1.5px solid var(--border-strong)', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)', padding: '5px 7px', outline: 'none', background: 'var(--bg-subtle)', fontStyle: 'italic' }}
                          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                          onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; }}
                        />
                        <button
                          onClick={() => setDraft(d => {
                            if (!d) return d;
                            const gs = d.ingredient_groups.map((g, gi2) => gi2 !== gi ? g : {
                              ...g, ingredients: g.ingredients.filter((_, ii2) => ii2 !== ii),
                            });
                            return { ...d, ingredient_groups: gs };
                          })}
                          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setDraft(d => {
                        if (!d) return d;
                        const gs = d.ingredient_groups.map((g, gi2) => gi2 !== gi ? g : {
                          ...g, ingredients: [...g.ingredients, { amount: '', unit: '', name: '', notes: null }],
                        });
                        return { ...d, ingredient_groups: gs };
                      })}
                      className="text-xs font-semibold mt-1"
                      style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', padding: '4px 0' }}
                    >
                      + Add ingredient
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {group.ingredients.map((ing, ii) => {
                      const status = getIngStatus(ing.name);
                      const dotColor = pantryItems.length > 0 ? STATUS_DOT[status] : 'var(--purple)';
                      return (
                        <li key={ii} className="flex items-baseline gap-3">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
                            style={{ background: dotColor }}
                            title={pantryItems.length > 0 ? status : undefined}
                          />
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--text)' }}>
                            {(() => {
                              const comps = splitCompound(ing.amount, ing.unit, ing.name);
                              const parts = comps ?? [{ amount: ing.amount, unit: ing.unit, name: ing.name }];
                              return parts.map((c, ci) => {
                                const unit = cleanUnit(c.unit);
                                const amount = cleanAmount(c.amount);
                                return (
                                  <span key={ci}>
                                    {ci > 0 && ' + '}
                                    <span key={`${scale}-${gi}-${ii}-${ci}`} className="font-semibold animate-amount">
                                      {[scaleAmount(amount, scale, unit), unit].filter(Boolean).join(' ')}
                                    </span>{' '}
                                    {c.name}
                                  </span>
                                );
                              });
                            })()}
                            {(() => {
                              const raw = ing.notes?.trim() ?? '';
                              if (!raw) return null;
                              const cleaned = cleanNotes(raw);
                              if (!cleaned) return null;
                              return (
                                <span className="ml-1" style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                                  ({cleaned})
                                </span>
                              );
                            })()}
                            {ing.optional && !ing.notes?.toLowerCase().includes('optional') && (
                              <span className="ml-1" style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                                (optional)
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}

            {isEditing && draft && (
              <button
                onClick={() => setDraft(d => d ? { ...d, ingredient_groups: [...d.ingredient_groups, { group_name: null, ingredients: [{ amount: '', unit: '', name: '', notes: null }] }] } : d)}
                className="text-sm font-semibold"
                style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                + Add ingredient group
              </button>
            )}

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
                {([['in-stock', 'In stock'], ['missing', 'Not in pantry']] as [IngStatus, string][]).map(([s, label]) => (
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
          isEditing && draft ? (
            <div className="space-y-3 animate-fade-up">
              {draft.instructions.map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0 mt-1"
                    style={{ background: 'var(--accent)', fontFamily: 'var(--font-body)', boxShadow: '0 2px 8px var(--accent-glow)' }}
                  >
                    {i + 1}
                  </span>
                  <textarea
                    value={step}
                    onChange={e => setDraft(d => {
                      if (!d) return d;
                      const ins = d.instructions.map((s, si) => si === i ? e.target.value : s);
                      return { ...d, instructions: ins };
                    })}
                    rows={3}
                    className="flex-1 resize-none transition-all duration-200"
                    style={{
                      border: '1.5px solid var(--border-strong)', borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-body)', fontSize: '0.9375rem',
                      color: 'var(--text)', padding: '0.625rem 0.875rem',
                      outline: 'none', background: 'var(--bg-subtle)', lineHeight: 1.8,
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    onClick={() => setDraft(d => d ? { ...d, instructions: d.instructions.filter((_, si) => si !== i) } : d)}
                    className="w-7 h-7 flex items-center justify-center rounded-full transition-colors mt-1 shrink-0"
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => setDraft(d => d ? { ...d, instructions: [...d.instructions, ''] } : d)}
                className="text-sm font-semibold mt-2"
                style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                + Add step
              </button>
            </div>
          ) : (
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
          )
        )}

        {/* Nutrition tab */}
        {tab === 'nutrition' && (
          <NutritionPanel
            ingredientGroups={recipe.ingredient_groups}
            yieldStr={recipe.yield}
            scale={scale}
          />
        )}

        {/* Cost tab */}
        {tab === 'cost' && (() => {
          // priceVersion is read here so React re-renders after a price save
          void priceVersion;
          const batchTotal = totalCost(recipe.ingredient_groups, scale, aiPrices);
          const yieldNum = recipe.yield ? parseFloat(recipe.yield.replace(/[^\d.]/g, '')) : null;
          const perItem = batchTotal != null && yieldNum && yieldNum > 0 ? batchTotal / (yieldNum * scale) : null;
          const coverage = costCoverage(recipe.ingredient_groups, scale, aiPrices);
          const unpriced = coverage.total - coverage.priced;

          return (
            <div className="animate-fade-up space-y-6">
              {/* Totals */}
              <div className="flex gap-3">
                <div className="flex-1 rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Batch cost</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
                    {batchTotal != null ? `~$${batchTotal.toFixed(2)}` : '—'}
                  </p>
                  {scale !== 1 && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{scale}× scale</p>}
                </div>
                {perItem != null && (
                  <div className="flex-1 rounded-2xl p-4" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '4px' }}>Per item</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                      ~${perItem.toFixed(2)}
                    </p>
                    {recipe.yield && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--accent)', opacity: 0.75, marginTop: '2px' }}>{recipe.yield}</p>}
                  </div>
                )}
              </div>

              {/* Status banner */}
              {fetchingAI ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-strong)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Estimating prices for unrecognized ingredients…
                  </p>
                </div>
              ) : unpriced > 0 && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-strong)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    {unpriced} ingredient{unpriced !== 1 ? 's' : ''} still couldn&apos;t be priced — click the pencil to add manually.
                  </p>
                </div>
              )}

              {/* Per-ingredient breakdown */}
              {recipe.ingredient_groups.map((group, gi) => (
                <div key={gi}>
                  {group.group_name && (
                    <div className="flex items-center gap-3 mb-3">
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)' }}>{group.group_name}</span>
                      <div style={{ flex: 1, height: '1px', background: 'var(--border-strong)' }} />
                    </div>
                  )}
                  <div className="space-y-2">
                    {group.ingredients.map((ing, ii) => {
                      // Handle compound ingredients (e.g. "large eggs + 1 egg yolk")
                      const comps = splitCompound(ing.amount, ing.unit, ing.name);
                      let cost: number | null;
                      let display: string;
                      if (comps) {
                        let sum = 0; let hasAny = false;
                        for (const c of comps) {
                          const ai = aiPrices[c.name.toLowerCase()];
                          const r = estimateCost(c.amount, c.unit, c.name, scale, ai);
                          if (r.cost != null) { sum += r.cost; hasAny = true; }
                        }
                        cost = hasAny ? sum : null;
                        display = cost == null ? '—' : cost < 0.01 ? '< $0.01' : `$${cost.toFixed(2)}`;
                      } else {
                        const aiPrice = aiPrices[ing.name.toLowerCase()];
                        ({ cost, display } = estimateCost(ing.amount, ing.unit, ing.name, scale, aiPrice));
                      }
                      const aiPrice = comps ? null : aiPrices[ing.name.toLowerCase()];
                      const entryKey = comps ? findEntryKey(comps[0].name) : findEntryKey(ing.name);
                      // AI-estimated items use 'ai::name' as their edit key
                      const aiEditKey = `ai::${ing.name}`;
                      const editKey = entryKey ?? (aiPrice ? aiEditKey : null);
                      const isEditing = editingPriceKey !== null && editingPriceKey === editKey;
                      const isOverridden = entryKey != null && hasUserOverride(entryKey);
                      const isAIEstimated = cost != null && entryKey == null && !!aiPrice;

                      // Scaled display string (handles compound)
                      const ingDisplayStr = comps
                        ? comps.map(c => [scaleAmount(c.amount, scale, c.unit), c.unit, c.name].filter(Boolean).join(' ')).join(' + ')
                        : [scaleAmount(ing.amount, scale, ing.unit), ing.unit, ing.name].filter(Boolean).join(' ');

                      return (
                        <div key={ii} style={{ borderBottom: '1px solid var(--border)' }}>
                          {/* Main row */}
                          <div className="flex items-center justify-between gap-3 py-2 group">
                            <div style={{ flex: 1 }}>
                              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>
                                {ingDisplayStr}
                              </span>
                              {ing.notes && <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}> ({ing.notes})</span>}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isOverridden && (
                                <span style={{
                                  fontFamily: 'var(--font-body)', fontSize: '0.625rem', fontWeight: 700,
                                  letterSpacing: '0.06em', textTransform: 'uppercase',
                                  color: 'var(--accent)', background: 'var(--accent-dim)',
                                  borderRadius: '4px', padding: '1px 5px',
                                }}>
                                  custom
                                </span>
                              )}
                              {isAIEstimated && !isOverridden && (
                                <span style={{
                                  fontFamily: 'var(--font-body)', fontSize: '0.625rem', fontWeight: 700,
                                  letterSpacing: '0.06em', textTransform: 'uppercase',
                                  color: 'var(--text-muted)', background: 'var(--bg-subtle)',
                                  border: '1px solid var(--border-strong)',
                                  borderRadius: '4px', padding: '1px 5px',
                                }}>
                                  AI est.
                                </span>
                              )}
                              {cost === null && !fetchingAI && (
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.625rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>no data</span>
                              )}
                              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: cost != null ? 'var(--text)' : 'var(--text-muted)' }}>
                                {cost != null ? `~${display}` : fetchingAI && !aiPrice ? '…' : display}
                              </span>
                              {(editKey != null || cost === null) && (
                                <button
                                  onClick={() => {
                                    if (isEditing) {
                                      setEditingPriceKey(null);
                                    } else if (entryKey != null) {
                                      const entries = getAllPriceEntries();
                                      const found = entries.find(e => e.key === entryKey);
                                      if (found) setPriceForm({ price: String(found.packagePrice), amount: String(found.packageAmount), unit: found.packageUnit });
                                      setEditingPriceKey(entryKey);
                                    } else {
                                      // AI-estimated or unpriced — pre-fill from AI data if available
                                      setPriceForm({
                                        price: aiPrice ? String(aiPrice.packagePrice) : '',
                                        amount: aiPrice ? String(aiPrice.packageAmount) : '',
                                        unit: (aiPrice?.packageUnit as PackageUnit) ?? 'oz',
                                      });
                                      setEditingPriceKey(aiEditKey);
                                    }
                                  }}
                                  title="Edit price"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: isEditing ? 'var(--accent)' : 'var(--text-muted)', padding: '2px 3px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Inline edit form */}
                          {isEditing && (
                            <div className="mb-2 px-3 py-2.5 rounded-xl space-y-2" style={{ background: 'var(--bg-subtle)', border: '1.5px solid var(--accent)' }}>
                              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', margin: 0 }}>
                                Package price
                              </p>
                              <div className="flex gap-2 items-center">
                                <div className="flex items-center gap-1" style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '6px', padding: '5px 8px', flex: '0 0 auto', width: '90px' }}>
                                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={priceForm.price}
                                    onChange={e => setPriceForm(f => ({ ...f, price: e.target.value }))}
                                    placeholder="3.49"
                                    style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text)', background: 'none', border: 'none', outline: 'none' }}
                                  />
                                </div>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>for</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={priceForm.amount}
                                  onChange={e => setPriceForm(f => ({ ...f, amount: e.target.value }))}
                                  placeholder="12"
                                  style={{
                                    flex: '0 0 auto', width: '70px',
                                    fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
                                    color: 'var(--text)', background: 'var(--surface)',
                                    border: '1px solid var(--border-strong)', borderRadius: '6px',
                                    padding: '5px 8px', outline: 'none',
                                  }}
                                />
                                <select
                                  value={priceForm.unit}
                                  onChange={e => setPriceForm(f => ({ ...f, unit: e.target.value as PackageUnit }))}
                                  style={{
                                    flex: 1,
                                    fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
                                    color: 'var(--text)', background: 'var(--surface)',
                                    border: '1px solid var(--border-strong)', borderRadius: '6px',
                                    padding: '5px 8px', outline: 'none',
                                  }}
                                >
                                  <option value="oz">oz</option>
                                  <option value="lb">lb</option>
                                  <option value="g">g</option>
                                  <option value="cup">cup</option>
                                  <option value="tbsp">tbsp</option>
                                  <option value="tsp">tsp</option>
                                  <option value="floz">fl oz</option>
                                  <option value="piece">piece</option>
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const p = parseFloat(priceForm.price);
                                    const a = parseFloat(priceForm.amount);
                                    if (!isNaN(p) && !isNaN(a) && a > 0) {
                                      if (entryKey != null) {
                                        setUserOverride(entryKey, { packagePrice: p, packageAmount: a, packageUnit: priceForm.unit });
                                        setPriceVersion(v => v + 1);
                                      } else {
                                        // Save as AI price (overwrites AI estimate)
                                        const updated: AIPrice = { packagePrice: p, packageAmount: a, packageUnit: priceForm.unit };
                                        setAIPrice(ing.name, updated);
                                        setAiPrices(prev => ({ ...prev, [ing.name.toLowerCase()]: updated }));
                                        setPriceVersion(v => v + 1);
                                      }
                                    }
                                    setEditingPriceKey(null);
                                  }}
                                  disabled={!priceForm.price || !priceForm.amount || parseFloat(priceForm.amount) <= 0}
                                  style={{
                                    flex: 1, fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600,
                                    color: '#fff', background: 'var(--accent)', border: 'none',
                                    borderRadius: '6px', padding: '5px 10px', cursor: 'pointer',
                                    opacity: (!priceForm.price || !priceForm.amount || parseFloat(priceForm.amount) <= 0) ? 0.5 : 1,
                                  }}
                                >
                                  Save
                                </button>
                                {isOverridden && entryKey != null && (
                                  <button
                                    onClick={() => {
                                      resetUserOverride(entryKey);
                                      setPriceVersion(v => v + 1);
                                      setEditingPriceKey(null);
                                    }}
                                    style={{
                                      fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600,
                                      color: 'var(--text-muted)', background: 'none',
                                      border: '1px solid var(--border-strong)',
                                      borderRadius: '6px', padding: '5px 10px', cursor: 'pointer',
                                    }}
                                  >
                                    Reset
                                  </button>
                                )}
                                <button
                                  onClick={() => setEditingPriceKey(null)}
                                  style={{
                                    fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
                                    color: 'var(--text-muted)', background: 'none', border: 'none',
                                    borderRadius: '6px', padding: '5px 10px', cursor: 'pointer',
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: '4px' }}>
                Estimated prices based on Trader Joe&apos;s / Tom Thumb averages. Click the pencil icon on any ingredient to enter your own package price.
              </p>
            </div>
          );
        })()}

        {/* Category badge — always at very bottom of page content */}
        {recipe.ai_category && !isEditing && (
          <div className="flex flex-wrap items-center gap-2 pt-5 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: '999px',
              background: 'var(--accent-dim)', border: '1px solid var(--accent)',
              color: 'var(--accent)', fontFamily: 'var(--font-body)',
              fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em',
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--accent)">
                <path d="M12 2C12 2 13 8 18 9C13 10 12 16 12 16C12 16 11 10 6 9C11 8 12 2 12 2Z"/>
              </svg>
              {recipe.ai_category}
            </span>
          </div>
        )}
        {isEditing && (
          <div className="flex flex-wrap gap-2 items-center pt-5 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
            {['Cookies', 'Cakes', 'Bars'].map(cat => (
              <button
                key={cat}
                onClick={() => { setDraft(d => d ? { ...d, ai_category: cat } : d); setCustomCatInput(''); }}
                style={{
                  padding: '4px 12px', borderRadius: '999px', border: '1.5px solid',
                  borderColor: draft?.ai_category === cat ? 'var(--accent)' : 'var(--border-strong)',
                  background: draft?.ai_category === cat ? 'var(--accent-dim)' : 'transparent',
                  color: draft?.ai_category === cat ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-body)', fontSize: '0.75rem',
                  fontWeight: draft?.ai_category === cat ? 600 : 400, cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
            <form
              onSubmit={e => { e.preventDefault(); const val = customCatInput.trim(); if (val) setDraft(d => d ? { ...d, ai_category: val } : d); }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <input
                placeholder="Custom…"
                value={customCatInput}
                onChange={e => { setCustomCatInput(e.target.value); if (e.target.value.trim()) setDraft(d => d ? { ...d, ai_category: e.target.value.trim() } : d); }}
                style={{
                  padding: '4px 10px', borderRadius: '999px', border: '1.5px solid',
                  borderColor: draft?.ai_category && !['Cookies','Cakes','Bars'].includes(draft.ai_category) && customCatInput ? 'var(--accent)' : 'var(--border-strong)',
                  fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text)',
                  background: 'var(--bg-subtle)', outline: 'none', width: '90px',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                onBlur={e => { e.target.style.borderColor = draft?.ai_category && !['Cookies','Cakes','Bars'].includes(draft.ai_category) && customCatInput ? 'var(--accent)' : 'var(--border-strong)'; }}
              />
              <button type="submit" style={{ padding: '4px 10px', borderRadius: '999px', border: '1.5px solid var(--border-strong)', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                Set
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="w-full rounded-2xl overflow-hidden"
            style={{ maxWidth: '360px', background: 'var(--surface)', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(232,41,58,0.1)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8293A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                Delete recipe?
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text)' }}>{recipe.title}</strong> will be permanently deleted and cannot be recovered.
              </p>
            </div>
            <div className="flex border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-4 text-sm font-semibold transition-colors duration-150"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', borderRight: '1px solid var(--border)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-4 text-sm font-semibold transition-colors duration-150"
                style={{ fontFamily: 'var(--font-body)', color: '#E8293A', background: 'none', border: 'none', cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.6 : 1 }}
                onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = 'rgba(232,41,58,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Modals */}
      {showBaking && (
        <BakingMode
          recipe={recipe}
          scale={scale}
          onClose={() => setShowBaking(false)}
          onRate={() => setShowBaked(true)}
        />
      )}
      {showBaked && (
        <BakedModal recipe={recipe} onClose={() => setShowBaked(false)} onSave={setRecipe} />
      )}
      {showCookbook && (
        <CookbookModal recipeId={recipe.id} onClose={() => setShowCookbook(false)} />
      )}


      {/* Pantry check modal */}
      {showPantryModal && createPortal(
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
                  const status = getIngStatus(ing.name);
                  const icon = status === 'in-stock' ? '✓' : '−';
                  const iconColor = status === 'in-stock' ? '#6B9E6B' : '#E03E3E';
                  const isAdding = addingToList.has(ing.name);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{
                        background: status === 'missing' ? 'rgba(224,62,62,0.05)' : 'transparent',
                      }}
                    >
                      <span className="text-sm font-bold shrink-0 w-4 text-center" style={{ color: iconColor }}>{icon}</span>
                      <span
                        style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text)' }}
                      >
                        {(() => {
                          const c = splitCompound(ing.amount, ing.unit, ing.name);
                          return c
                            ? c.map(p => [scaleAmount(p.amount, 1, p.unit), p.unit, p.name].filter(Boolean).join(' ')).join(' + ')
                            : [scaleAmount(ing.amount, 1, ing.unit), ing.unit, ing.name].filter(Boolean).join(' ');
                        })()}
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
                disabled={addingAll || allIngredients.every(ing => getIngStatus(ing.name) === 'in-stock')}
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
      , document.body)}
    </div>
  );
}
