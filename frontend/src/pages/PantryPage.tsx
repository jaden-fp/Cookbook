import { useState, useEffect, useRef } from 'react';
import { getPantryItems, addPantryItem, updatePantryItem, deletePantryItem } from '../api';
import type { PantryItem } from '../types';

type Suggestion = { name: string; unit: string };

const INGREDIENT_SUGGESTIONS: Suggestion[] = [
  // Sugars
  { name: 'Granulated sugar', unit: 'cups' },
  { name: 'Light brown sugar', unit: 'cups' },
  { name: 'Dark brown sugar', unit: 'cups' },
  { name: 'Powdered sugar', unit: 'cups' },
  { name: 'Raw sugar', unit: 'cups' },
  { name: 'Coconut sugar', unit: 'cups' },
  { name: 'Honey', unit: 'tbsp' },
  { name: 'Maple syrup', unit: 'tbsp' },
  { name: 'Molasses', unit: 'tbsp' },
  { name: 'Corn syrup', unit: 'tbsp' },
  // Flours & starches
  { name: 'All-purpose flour', unit: 'cups' },
  { name: 'Bread flour', unit: 'cups' },
  { name: 'Cake flour', unit: 'cups' },
  { name: 'Whole wheat flour', unit: 'cups' },
  { name: 'Almond flour', unit: 'cups' },
  { name: 'Coconut flour', unit: 'cups' },
  { name: 'Rice flour', unit: 'cups' },
  { name: 'Cornstarch', unit: 'tbsp' },
  { name: 'Rolled oats', unit: 'cups' },
  // Fats
  { name: 'Unsalted butter', unit: 'sticks' },
  { name: 'Salted butter', unit: 'sticks' },
  { name: 'Vegetable oil', unit: 'cups' },
  { name: 'Olive oil', unit: 'tbsp' },
  { name: 'Coconut oil', unit: 'tbsp' },
  { name: 'Shortening', unit: 'cups' },
  // Dairy
  { name: 'Whole milk', unit: 'cups' },
  { name: 'Buttermilk', unit: 'cups' },
  { name: 'Heavy cream', unit: 'cups' },
  { name: 'Sour cream', unit: 'cups' },
  { name: 'Cream cheese', unit: 'oz' },
  { name: 'Evaporated milk', unit: 'cups' },
  { name: 'Sweetened condensed milk', unit: 'cups' },
  // Eggs
  { name: 'Eggs', unit: 'whole' },
  // Leavening & salt
  { name: 'Baking soda', unit: 'tsp' },
  { name: 'Baking powder', unit: 'tsp' },
  { name: 'Cream of tartar', unit: 'tsp' },
  { name: 'Active dry yeast', unit: 'tsp' },
  { name: 'Instant yeast', unit: 'tsp' },
  { name: 'Salt', unit: 'tsp' },
  { name: 'Sea salt', unit: 'tsp' },
  // Extracts & flavorings
  { name: 'Vanilla extract', unit: 'tsp' },
  { name: 'Almond extract', unit: 'tsp' },
  { name: 'Peppermint extract', unit: 'tsp' },
  { name: 'Lemon juice', unit: 'tbsp' },
  { name: 'Orange juice', unit: 'tbsp' },
  // Chocolate & cocoa
  { name: 'Cocoa powder', unit: 'cups' },
  { name: 'Dutch-process cocoa', unit: 'cups' },
  { name: 'Chocolate chips', unit: 'cups' },
  { name: 'Semi-sweet chocolate', unit: 'oz' },
  { name: 'Dark chocolate', unit: 'oz' },
  { name: 'White chocolate', unit: 'oz' },
  // Spices
  { name: 'Cinnamon', unit: 'tsp' },
  { name: 'Nutmeg', unit: 'tsp' },
  { name: 'Ginger', unit: 'tsp' },
  { name: 'Cardamom', unit: 'tsp' },
  { name: 'Cloves', unit: 'tsp' },
  { name: 'Allspice', unit: 'tsp' },
  // Nuts & mix-ins
  { name: 'Walnuts', unit: 'cups' },
  { name: 'Pecans', unit: 'cups' },
  { name: 'Almonds', unit: 'cups' },
  { name: 'Peanuts', unit: 'cups' },
  { name: 'Shredded coconut', unit: 'cups' },
  { name: 'Raisins', unit: 'cups' },
  { name: 'Dried cranberries', unit: 'cups' },
  { name: 'Sprinkles', unit: 'tbsp' },
];

const UNITS = ['', 'whole', 'sticks', 'cups', 'tsp', 'tbsp', 'oz', 'g', 'ml', 'lbs'];

const COMMON_STAPLES = [
  { name: 'Butter', unit: 'sticks' },
  { name: 'Eggs', unit: 'whole' },
  { name: 'All-purpose flour', unit: 'cups' },
  { name: 'Sugar', unit: 'cups' },
  { name: 'Brown sugar', unit: 'cups' },
  { name: 'Powdered sugar', unit: 'cups' },
  { name: 'Baking soda', unit: 'tsp' },
  { name: 'Baking powder', unit: 'tsp' },
  { name: 'Salt', unit: 'tsp' },
  { name: 'Vanilla extract', unit: 'tsp' },
  { name: 'Milk', unit: 'cups' },
  { name: 'Vegetable oil', unit: 'cups' },
  { name: 'Cream cheese', unit: 'oz' },
  { name: 'Heavy cream', unit: 'cups' },
  { name: 'Cocoa powder', unit: 'cups' },
];

function getDefaultUnit(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('egg')) return 'whole';
  if (n.includes('butter')) return 'sticks';
  if (n.includes('flour') || n.includes('sugar') || n.includes('milk') || n.includes('cream') || n.includes('oil')) return 'cups';
  if (n.includes('soda') || n.includes('powder') || n.includes('salt') || n.includes('vanilla') || n.includes('extract')) return 'tsp';
  return '';
}

export default function PantryPage() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Suggestion dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);

  // Quick add modal
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickSelected, setQuickSelected] = useState<Set<string>>(new Set());
  const [quickAdding, setQuickAdding] = useState(false);

  // Mark as bought modal
  const [boughtItem, setBoughtItem] = useState<PantryItem | null>(null);
  const [boughtQty, setBoughtQty] = useState('');
  const [boughtUnit, setBoughtUnit] = useState('');
  const [buyingSaving, setBuyingSaving] = useState(false);

  useEffect(() => {
    getPantryItems().then(setItems).finally(() => setLoading(false));
  }, []);


  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowQuickAdd(false); setBoughtItem(null); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (showQuickAdd || boughtItem) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showQuickAdd, boughtItem]);

  const inStock = items.filter(i => i.needs_purchase === 0);
  const shoppingList = items.filter(i => i.needs_purchase === 1);
  const effectiveUnit = newUnit === '__other__' ? customUnit : newUnit;

  const filteredSuggestions = newName.trim().length > 0
    ? INGREDIENT_SUGGESTIONS
        .filter(s => s.name.toLowerCase().includes(newName.toLowerCase()))
        .slice(0, 8)
    : [];

  function handleNameChange(value: string) {
    setNewName(value);
    setHighlightIdx(-1);
    setShowSuggestions(true);
    if (!newUnit || newUnit === '') {
      const suggested = getDefaultUnit(value);
      if (suggested) setNewUnit(suggested);
    }
  }

  function selectSuggestion(s: Suggestion) {
    setNewName(s.name);
    setNewUnit(s.unit || getDefaultUnit(s.name));
    setShowSuggestions(false);
    setHighlightIdx(-1);
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || filteredSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      selectSuggestion(filteredSuggestions[highlightIdx]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  const [addError, setAddError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || saving) return;
    setSaving(true);
    setAddError(null);
    try {
      const item = await addPantryItem({
        name: newName.trim(),
        quantity: parseFloat(newQty) || 0,
        unit: effectiveUnit,
      });
      setItems(prev => [...prev, item]);
      setNewName('');
      setNewQty('');
      setNewUnit('');
      setCustomUnit('');
      nameRef.current?.focus();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setSaving(false);
    }
  }

  async function handleAdjustQty(item: PantryItem, delta: number) {
    const newQ = Math.max(0, item.quantity + delta);
    const updates: { quantity: number; needs_purchase?: number } = { quantity: newQ };
    if (newQ === 0) updates.needs_purchase = 1;
    const updated = await updatePantryItem(item.id, updates);
    setItems(prev => prev.map(p => p.id === updated.id ? updated : p));
  }

  async function handleNeedToBuy(item: PantryItem) {
    const updated = await updatePantryItem(item.id, { needs_purchase: 1 });
    setItems(prev => prev.map(p => p.id === updated.id ? updated : p));
  }

  async function handleBoughtConfirm() {
    if (!boughtItem || buyingSaving) return;
    setBuyingSaving(true);
    try {
      const updated = await updatePantryItem(boughtItem.id, {
        quantity: parseFloat(boughtQty) || 0,
        unit: boughtUnit || boughtItem.unit,
        needs_purchase: 0,
      });
      setItems(prev => prev.map(p => p.id === updated.id ? updated : p));
      setBoughtItem(null);
    } finally {
      setBuyingSaving(false);
    }
  }

  async function handleDelete(item: PantryItem) {
    await deletePantryItem(item.id);
    setItems(prev => prev.filter(p => p.id !== item.id));
  }

  function toggleQuick(name: string) {
    setQuickSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  async function handleQuickAdd() {
    if (!quickSelected.size || quickAdding) return;
    setQuickAdding(true);
    try {
      const existingNames = new Set(items.map(i => i.name.toLowerCase()));
      const toAdd = COMMON_STAPLES.filter(
        s => quickSelected.has(s.name) && !existingNames.has(s.name.toLowerCase())
      );
      const added: PantryItem[] = [];
      for (const staple of toAdd) {
        const item = await addPantryItem({ name: staple.name, quantity: 0, unit: staple.unit });
        added.push(item);
      }
      setItems(prev => [...prev, ...added]);
      setShowQuickAdd(false);
      setQuickSelected(new Set());
    } finally {
      setQuickAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-20">
        <div className="skeleton h-8 w-48 rounded-lg mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-20">

      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: '6px',
        }}>
          Your Kitchen
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: '10px',
        }}>
          My Pantry
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'var(--accent)', borderRadius: '2px' }} />
      </div>

      {/* Add ingredient form */}
      <div className="animate-fade-up delay-1 mb-6">
        <form onSubmit={handleAdd}>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">

            {/* Name */}
            <div className="flex-1" style={{ minWidth: '160px', position: 'relative' }}>
              <label style={{
                display: 'block', fontSize: '0.75rem', fontWeight: 600,
                color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
                marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Ingredient
              </label>
              <input
                ref={nameRef}
                type="text"
                value={newName}
                onChange={e => handleNameChange(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="e.g. Butter"
                autoComplete="off"
                className="w-full transition-all duration-200"
                style={{
                  border: '1.5px solid var(--border-strong)', borderRadius: '10px',
                  fontFamily: 'var(--font-body)', fontSize: '0.9375rem',
                  color: 'var(--text)', padding: '0.5625rem 0.875rem',
                  outline: 'none', background: 'var(--surface)',
                }}
                onMouseEnter={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
                onMouseLeave={e => { if (document.activeElement !== e.target) { (e.target as HTMLInputElement).style.borderColor = 'var(--border-strong)'; (e.target as HTMLInputElement).style.boxShadow = 'none'; } }}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: 'var(--surface)',
                    border: '1.5px solid var(--border-strong)',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(15,12,30,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  {filteredSuggestions.map((s, i) => {
                    const q = newName.toLowerCase();
                    const idx = s.name.toLowerCase().indexOf(q);
                    return (
                      <div
                        key={s.name}
                        onMouseDown={() => selectSuggestion(s)}
                        style={{
                          padding: '0.5rem 0.875rem',
                          cursor: 'pointer',
                          background: i === highlightIdx ? 'var(--surface-hover)' : 'white',
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.875rem',
                          color: 'var(--text)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          borderBottom: i < filteredSuggestions.length - 1 ? '1px solid var(--surface-hover)' : 'none',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-hover)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = i === highlightIdx ? 'var(--surface-hover)' : 'white'; }}
                      >
                        <span>
                          {idx >= 0 ? (
                            <>
                              {s.name.slice(0, idx)}
                              <strong style={{ color: 'var(--accent)' }}>{s.name.slice(idx, idx + q.length)}</strong>
                              {s.name.slice(idx + q.length)}
                            </>
                          ) : s.name}
                        </span>
                        {s.unit && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                            {s.unit}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div style={{ width: '80px' }}>
              <label style={{
                display: 'block', fontSize: '0.75rem', fontWeight: 600,
                color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
                marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Qty <span style={{ textTransform: 'none', fontWeight: 400, fontSize: '0.7rem' }}>(opt.)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={newQty}
                onChange={e => setNewQty(e.target.value)}
                placeholder="?"
                className="w-full transition-all duration-200"
                style={{
                  border: '1.5px solid var(--border-strong)', borderRadius: '10px',
                  fontFamily: 'var(--font-body)', fontSize: '0.9375rem',
                  color: 'var(--text)', padding: '0.5625rem 0.75rem',
                  outline: 'none', background: 'var(--surface)',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Unit */}
            <div className="flex items-end gap-2">
              <div>
                <label style={{
                  display: 'block', fontSize: '0.75rem', fontWeight: 600,
                  color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
                  marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Unit
                </label>
                <select
                  value={newUnit}
                  onChange={e => setNewUnit(e.target.value)}
                  style={{
                    border: '1.5px solid var(--border-strong)', borderRadius: '10px',
                    fontFamily: 'var(--font-body)', fontSize: '0.9375rem',
                    color: 'var(--text)', padding: '0.5625rem 0.75rem',
                    outline: 'none', background: 'var(--surface)', height: '44px',
                  }}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u || '—'}</option>)}
                  <option value="__other__">other…</option>
                </select>
              </div>
              {newUnit === '__other__' && (
                <input
                  type="text"
                  value={customUnit}
                  onChange={e => setCustomUnit(e.target.value)}
                  placeholder="unit"
                  autoFocus
                  style={{
                    border: '1.5px solid var(--border-strong)', borderRadius: '10px',
                    fontFamily: 'var(--font-body)', fontSize: '0.9375rem',
                    color: 'var(--text)', padding: '0.5625rem 0.75rem',
                    outline: 'none', background: 'var(--surface)', width: '88px', height: '44px',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
                />
              )}
            </div>

            {/* Submit */}
            <div>
              <label style={{ visibility: 'hidden', display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Add</label>
              <button
                type="submit"
                disabled={!newName.trim() || saving}
                className="px-5 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--accent)', borderRadius: '10px',
                  fontFamily: 'var(--font-body)',
                  boxShadow: '0 2px 8px var(--accent-glow)',
                  height: '44px', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (newName.trim()) e.currentTarget.style.background = '#D0155A'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
              >
                {saving ? 'Adding…' : '+ Add to Pantry'}
              </button>
            </div>
          </div>
        </form>

        <p style={{ minHeight: '20px', marginTop: '6px', fontSize: '0.875rem', color: '#C0392B', fontFamily: 'var(--font-body)', visibility: addError ? 'visible' : 'hidden' }}>
          {addError ?? ' '}
        </p>

        <div className="mt-3">
          <button
            onClick={() => { setShowQuickAdd(true); setQuickSelected(new Set()); }}
            className="text-sm transition-colors duration-200"
            style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)', fontWeight: 500 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#D0155A'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--accent)'; }}
          >
            ✦ Quick add common baking ingredients
          </button>
        </div>
      </div>

      <div style={{ borderBottom: '1px solid var(--border-strong)', marginBottom: '24px' }} />

      {/* In Stock */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
            In Stock
          </h2>
          {inStock.length > 0 && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--surface-hover)', color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
            >
              {inStock.length}
            </span>
          )}
        </div>

        {inStock.length === 0 ? (
          <div className="py-10 text-center rounded-2xl" style={{ border: '1.5px dashed var(--border-strong)' }}>
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>
              No ingredients in stock yet. Add some above!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {inStock.map(item => (
              <div
                key={item.id}
                className="rounded-xl p-4 transition-all duration-200"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-strong)',
                  boxShadow: '0 1px 4px rgba(81,42,24,0.06)',
                }}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--text)', fontSize: '0.9375rem' }}>
                      {item.name}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', marginTop: '1px' }}>
                      {item.quantity > 0
                        ? <span style={{ color: 'var(--text-muted)' }}>{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                        : <span style={{ color: '#FFC107', fontWeight: 500 }}>no quantity set</span>
                      }
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Qty stepper */}
                    <div
                      className="inline-flex items-center rounded-full overflow-hidden"
                      style={{ border: '1.5px solid var(--border-strong)', background: 'var(--surface)' }}
                    >
                      <button
                        onClick={() => handleAdjustQty(item, -1)}
                        className="flex items-center justify-center transition-colors duration-150"
                        style={{ width: '2rem', height: '2rem', color: 'var(--text)', fontSize: '1rem', background: 'var(--surface-hover)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-strong)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                      >
                        −
                      </button>
                      <span
                        className="text-sm font-bold text-center"
                        style={{
                          minWidth: '2.5rem', color: 'var(--text)', fontFamily: 'var(--font-body)',
                          borderLeft: '1px solid var(--border-strong)', borderRight: '1px solid var(--border-strong)',
                          padding: '0.25rem',
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleAdjustQty(item, 1)}
                        className="flex items-center justify-center transition-colors duration-150"
                        style={{ width: '2rem', height: '2rem', color: 'var(--text)', fontSize: '1rem', background: 'var(--surface-hover)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-strong)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                      >
                        +
                      </button>
                    </div>

                    {/* Need to Buy */}
                    <button
                      onClick={() => handleNeedToBuy(item)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200"
                      style={{ border: '1.5px solid var(--accent)', color: 'var(--accent)', fontFamily: 'var(--font-body)', background: 'var(--surface)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                    >
                      Need to Buy
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item)}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-lg leading-none transition-colors duration-200"
                      style={{ color: 'rgba(81,42,24,0.3)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(81,42,24,0.3)'; }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Shopping List */}
      {shoppingList.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
              Shopping List
            </h2>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent)', color: 'white', fontFamily: 'var(--font-body)' }}
            >
              {shoppingList.length}
            </span>
          </div>

          <div className="space-y-3">
            {shoppingList.map(item => (
              <div
                key={item.id}
                className="rounded-xl p-4 flex items-center justify-between gap-4"
                style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-strong)' }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--text)', fontSize: '0.9375rem' }}>
                      {item.name}
                    </p>
                    {item.unit && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                        {item.unit}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setBoughtItem(item); setBoughtQty(''); setBoughtUnit(item.unit); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all duration-200"
                    style={{ background: 'var(--bg-subtle)', fontFamily: 'var(--font-body)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#38BABA'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                  >
                    Mark as Bought
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-lg leading-none transition-colors duration-200"
                    style={{ color: 'rgba(81,42,24,0.3)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(81,42,24,0.3)'; }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          style={{ background: 'var(--text-muted)' }}
          onClick={e => e.target === e.currentTarget && setShowQuickAdd(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl animate-scale-in flex flex-col"
            style={{ border: '1px solid var(--border-strong)', boxShadow: '0 20px 60px rgba(81,42,24,0.15)', maxHeight: '80vh' }}
          >
            <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-strong)' }}>
              <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text)' }}>
                Quick Add Common Ingredients
              </h2>
              <button
                onClick={() => setShowQuickAdd(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-xl leading-none"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-4">
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                Select the ingredients you have on hand:
              </p>
              <div className="space-y-1">
                {COMMON_STAPLES.map(staple => {
                  const checked = quickSelected.has(staple.name);
                  const alreadyHave = items.some(i => i.name.toLowerCase() === staple.name.toLowerCase());
                  return (
                    <div
                      key={staple.name}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                      style={{
                        background: checked ? 'var(--surface-hover)' : 'transparent',
                        border: checked ? '1.5px solid var(--border-strong)' : '1.5px solid transparent',
                        opacity: alreadyHave ? 0.45 : 1,
                        cursor: alreadyHave ? 'default' : 'pointer',
                      }}
                      onClick={() => !alreadyHave && toggleQuick(staple.name)}
                    >
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: '18px', height: '18px', borderRadius: '5px',
                          border: checked ? 'none' : '1.5px solid var(--border-strong)',
                          background: checked ? 'var(--accent)' : 'white',
                        }}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--text)', fontWeight: checked ? 600 : 400 }}>
                        {staple.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                        {alreadyHave ? 'already added' : staple.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderTop: '1px solid var(--border-strong)' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                {quickSelected.size > 0 ? `${quickSelected.size} selected` : 'Select ingredients to add'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="px-4 py-2 text-sm rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickAdd}
                  disabled={!quickSelected.size || quickAdding}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent)', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={e => { if (quickSelected.size && !quickAdding) e.currentTarget.style.background = '#D0155A'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
                >
                  {quickAdding ? 'Adding…' : `Add${quickSelected.size > 0 ? ` ${quickSelected.size}` : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Bought Modal */}
      {boughtItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          style={{ background: 'var(--text-muted)' }}
          onClick={e => e.target === e.currentTarget && setBoughtItem(null)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-2xl animate-scale-in"
            style={{ border: '1px solid var(--border-strong)', boxShadow: '0 20px 60px rgba(81,42,24,0.15)' }}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-strong)' }}>
              <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text)' }}>
                Mark as Bought
              </h2>
              <button
                onClick={() => setBoughtItem(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-xl leading-none"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--text)', fontSize: '0.9375rem' }}>
                  {boughtItem.name}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  How much did you buy? <span style={{ fontStyle: 'italic' }}>(leave blank if you're not sure)</span>
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={boughtQty}
                  onChange={e => setBoughtQty(e.target.value)}
                  placeholder="0"
                  autoFocus
                  style={{
                    flex: 1, border: '1.5px solid var(--border-strong)', borderRadius: '8px',
                    fontFamily: 'var(--font-body)', fontSize: '0.9375rem',
                    color: 'var(--text)', padding: '0.5625rem 0.875rem',
                    outline: 'none', background: 'var(--surface)',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
                />
                <select
                  value={boughtUnit}
                  onChange={e => setBoughtUnit(e.target.value)}
                  style={{
                    border: '1.5px solid var(--border-strong)', borderRadius: '8px',
                    fontFamily: 'var(--font-body)', fontSize: '0.9375rem',
                    color: 'var(--text)', padding: '0.5625rem 0.75rem',
                    outline: 'none', background: 'var(--surface)',
                  }}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u || '—'}</option>)}
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setBoughtItem(null)}
                  className="px-4 py-2 text-sm rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBoughtConfirm}
                  disabled={buyingSaving}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-40"
                  style={{ background: 'var(--bg-subtle)', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={e => { if (!buyingSaving) e.currentTarget.style.background = '#38BABA'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                >
                  {buyingSaving ? 'Saving…' : boughtQty ? 'Confirm' : 'Mark as In Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
