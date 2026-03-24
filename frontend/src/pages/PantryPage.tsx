import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

  // Edit item modal
  const [editItem, setEditItem] = useState<PantryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    getPantryItems().then(setItems).finally(() => setLoading(false));
  }, []);


  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowQuickAdd(false); setBoughtItem(null); setEditItem(null); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (showQuickAdd || boughtItem || editItem) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showQuickAdd, boughtItem, editItem]);

  const inStock = items.filter(i => i.needs_purchase === 0).sort((a, b) => a.name.localeCompare(b.name));
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

  async function handleEditSave() {
    if (!editItem || !editName.trim() || editSaving) return;
    setEditSaving(true);
    try {
      const updated = await updatePantryItem(editItem.id, {
        name: editName.trim(),
        quantity: parseFloat(editQty) || 0,
        unit: editUnit,
      });
      setItems(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditItem(null);
    } finally {
      setEditSaving(false);
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-24 pb-24 sm:pb-16">
        <div className="skeleton h-8 w-48 rounded-lg mb-8" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-24 pb-24 sm:pb-16">

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
          fontWeight: 700,
          fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: '10px',
        }}>
          My Pantry
        </h1>
        <div style={{ width: '40px', height: '3px', background: 'var(--accent)', borderRadius: '2px' }} />
      </div>

      {/* Add ingredient form */}
      <div className="animate-fade-up delay-1 mb-8" style={{ position: 'relative', zIndex: 10 }}>
        <form onSubmit={handleAdd}>
          {/* Single-row pill form */}
          <div
            className="flex items-stretch overflow-hidden"
            style={{
              borderRadius: '999px',
              border: '1.5px solid var(--border-strong)',
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Name input — takes up all remaining space */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={{ display: 'none' }}>Ingredient</label>
              <input
                ref={nameRef}
                type="text"
                value={newName}
                onChange={e => handleNameChange(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Add an ingredient…"
                autoComplete="off"
                className="w-full"
                style={{
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  color: 'var(--text)',
                  padding: '0.75rem 1.25rem',
                  background: 'transparent',
                  minWidth: 0,
                }}
              />
            </div>

            {/* Separator — desktop only */}
            <div className="hidden sm:block" style={{ width: '1px', background: 'var(--border-strong)', margin: '8px 0', flexShrink: 0 }} />

            {/* Qty input — desktop only */}
            <input
              type="text"
              inputMode="decimal"
              value={newQty}
              onChange={e => setNewQty(e.target.value)}
              placeholder="qty"
              className="hidden sm:block"
              style={{
                border: 'none', outline: 'none',
                fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                color: 'var(--text)', padding: '0.75rem 0.5rem',
                background: 'transparent', width: '52px', textAlign: 'center',
              }}
            />

            {/* Separator — desktop only */}
            <div className="hidden sm:block" style={{ width: '1px', background: 'var(--border-strong)', margin: '8px 0', flexShrink: 0 }} />

            {/* Unit select — desktop only */}
            <select
              value={newUnit}
              onChange={e => setNewUnit(e.target.value)}
              className="hidden sm:block"
              style={{
                border: 'none', outline: 'none',
                fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                color: newUnit ? 'var(--text)' : 'var(--text-muted)',
                padding: '0.75rem 0.5rem',
                background: 'transparent', cursor: 'pointer',
              }}
            >
              <option value="">unit</option>
              {UNITS.filter(u => u !== '').map(u => <option key={u} value={u}>{u}</option>)}
              <option value="__other__">other…</option>
            </select>

            {newUnit === '__other__' && (
              <input
                type="text"
                value={customUnit}
                onChange={e => setCustomUnit(e.target.value)}
                placeholder="unit"
                autoFocus
                className="hidden sm:block"
                style={{
                  border: 'none', outline: 'none',
                  fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                  color: 'var(--text)', padding: '0.75rem 0.5rem',
                  background: 'transparent', width: '72px',
                }}
              />
            )}

            {/* Add button — inset pink pill */}
            <button
              type="submit"
              disabled={!newName.trim() || saving}
              className="transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '999px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '0.875rem',
                padding: '0 1.25rem',
                margin: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (newName.trim()) e.currentTarget.style.background = '#D94E7A'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>

        {/* Suggestions dropdown — outside pill to avoid overflow:hidden clipping */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 200,
              background: 'var(--surface)',
              border: '1.5px solid var(--border-strong)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-md)',
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
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    background: i === highlightIdx ? 'var(--surface-hover)' : 'white',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    borderBottom: i < filteredSuggestions.length - 1 ? '1px solid var(--border)' : 'none',
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

        {addError && (
          <p style={{ marginTop: '6px', fontSize: '0.875rem', color: '#C0392B', fontFamily: 'var(--font-body)', paddingLeft: '1.25rem' }}>
            {addError}
          </p>
        )}
      </div>

      {/* Shopping List */}
      {shoppingList.length > 0 && (
        <section className="mb-10 animate-fade-up delay-2">
          <div className="flex items-center gap-2 mb-3">
            <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Shopping List
            </h2>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent)', color: 'white', fontFamily: 'var(--font-body)' }}
            >
              {shoppingList.length}
            </span>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {shoppingList.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-3 group"
                style={{
                  padding: '14px 16px',
                  borderBottom: i < shoppingList.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--text)', fontSize: '0.9375rem' }}>
                    {item.name}
                  </p>
                  {item.unit && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {item.unit}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={async () => { const u = await updatePantryItem(item.id, { needs_purchase: 0 }); setItems(prev => prev.map(p => p.id === u.id ? u : p)); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200"
                    style={{
                      background: 'rgba(0,196,180,0.1)',
                      color: '#00A89A',
                      border: 'none',
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,196,180,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,196,180,0.1)'; }}
                  >
                    Got it
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* In Stock */}
      <section className="mb-10 animate-fade-up delay-3">
        <div className="flex items-center gap-2 mb-3">
          <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            In Stock
          </h2>
          {inStock.length > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
            >
              {inStock.length}
            </span>
          )}
        </div>

        {inStock.length === 0 ? (
          <div className="py-12 text-center rounded-2xl" style={{ border: '1.5px dashed var(--border-strong)' }}>
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>
              No ingredients in stock yet — add some above!
            </p>
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {inStock.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-3 group"
                style={{ padding: '12px 16px', borderBottom: i < inStock.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                {/* Name */}
                <p className="flex-1 min-w-0 truncate" style={{ fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--text)', fontSize: '0.9375rem' }}>
                  {item.name}
                </p>

                {/* Right side: stepper (if qty) + list button + edit */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setEditItem(item); setEditName(item.name); setEditQty(item.quantity > 0 ? String(item.quantity) : ''); setEditUnit(item.unit); }}
                    title="Edit item"
                    className="shrink-0 flex items-center justify-center rounded-full transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100"
                    style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>

                  {item.quantity > 0 && (
                    <div
                      className="inline-flex items-center"
                      style={{ border: '1.5px solid var(--border-strong)', borderRadius: '999px', overflow: 'hidden', height: '30px' }}
                    >
                      <button
                        onClick={() => handleAdjustQty(item, -1)}
                        style={{ width: '28px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1, background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, paddingTop: '3px' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >−</button>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text)', padding: '0 8px', whiteSpace: 'nowrap', borderLeft: '1px solid var(--border-strong)', borderRight: '1px solid var(--border-strong)' }}>
                        {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                      </span>
                      <button
                        onClick={() => handleAdjustQty(item, 1)}
                        style={{ width: '28px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1, background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, paddingTop: '3px' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >+</button>
                    </div>
                  )}

                  <button
                    onClick={() => handleNeedToBuy(item)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200"
                    style={{ background: 'rgba(0,196,180,0.1)', color: '#00A89A', border: 'none', fontFamily: 'var(--font-body)', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,196,180,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,196,180,0.1)'; }}
                  >+ List</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>



      {/* Edit Item Modal */}
      {editItem && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          style={{ background: 'rgba(15,12,30,0.45)' }}
          onClick={e => e.target === e.currentTarget && setEditItem(null)}
        >
          <div
            className="w-full max-w-xs animate-scale-in"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text)', letterSpacing: '-0.01em' }}>
                Edit Item
              </h2>
              <button
                onClick={() => setEditItem(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150"
                style={{ color: 'var(--text-muted)', border: 'none', background: 'transparent', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                  className="w-full transition-all duration-200"
                  style={{
                    border: '1.5px solid var(--border-strong)', borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-body)', fontSize: '0.9375rem',
                    color: 'var(--text)', padding: '0.625rem 0.875rem',
                    outline: 'none', background: 'var(--bg-subtle)',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div className="flex gap-3">
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Quantity
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editQty}
                    onChange={e => setEditQty(e.target.value)}
                    placeholder="—"
                    className="w-full transition-all duration-200"
                    style={{
                      border: '1.5px solid var(--border-strong)', borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-body)', fontSize: '0.9375rem',
                      color: 'var(--text)', padding: '0.625rem 0.875rem',
                      outline: 'none', background: 'var(--bg-subtle)',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Unit
                  </label>
                  <select
                    value={editUnit}
                    onChange={e => setEditUnit(e.target.value)}
                    style={{
                      border: '1.5px solid var(--border-strong)', borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-body)', fontSize: '0.9375rem',
                      color: 'var(--text)', padding: '0.625rem 0.75rem',
                      outline: 'none', background: 'var(--bg-subtle)', height: '42px',
                    }}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u || '—'}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => { handleDelete(editItem!); setEditItem(null); }}
                  className="px-4 py-2 text-sm rounded-lg transition-all duration-150"
                  style={{ color: '#e05555', fontFamily: 'var(--font-body)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,85,85,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Delete
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={!editName.trim() || editSaving}
                  className="px-5 py-2 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40"
                  style={{
                    background: 'var(--accent)', fontFamily: 'var(--font-body)',
                    borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (editName.trim() && !editSaving) e.currentTarget.style.background = '#D94E7A'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
                >
                  {editSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Quick Add Modal */}
      {showQuickAdd && createPortal(
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
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
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
                  onMouseEnter={e => { if (quickSelected.size && !quickAdding) e.currentTarget.style.background = '#D94E7A'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
                >
                  {quickAdding ? 'Adding…' : `Add${quickSelected.size > 0 ? ` ${quickSelected.size}` : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Mark as Bought Modal */}
      {boughtItem && createPortal(
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
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
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
                  type="text"
                  inputMode="decimal"
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
      , document.body)}
    </div>
  );
}
