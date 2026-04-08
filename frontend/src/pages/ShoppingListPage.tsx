import { useState, useEffect, useCallback } from 'react';
import { getPantryItems, updatePantryItem } from '../api';
import type { PantryItem } from '../types';

type Status = 'in-stock' | 'low' | 'out';

function getStatus(item: PantryItem): Status {
  if (item.status) return item.status;
  return item.needs_purchase ? 'out' : 'in-stock';
}

const CATEGORY_ORDER = [
  'Dairy', 'Flours', 'Sweeteners', 'Fats & Oils', 'Chocolate',
  'Spices', 'Extracts', 'Leavening', 'Nuts', 'Other',
];

function groupByCategory(items: PantryItem[]): { category: string; items: PantryItem[] }[] {
  const map = new Map<string, PantryItem[]>();
  for (const item of items) {
    const cat = item.category?.trim() || 'Other';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => {
      const pa = getStatus(a) === 'out' ? 0 : 1;
      const pb = getStatus(b) === 'out' ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name);
    });
  }
  const known = CATEGORY_ORDER.filter(c => map.has(c)).map(c => ({ category: c, items: map.get(c)! }));
  const unknown = [...map.keys()].filter(c => !CATEGORY_ORDER.includes(c)).sort().map(c => ({ category: c, items: map.get(c)! }));
  return [...known, ...unknown];
}

export default function ShoppingListPage() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<Set<string>>(new Set());

  useEffect(() => {
    getPantryItems()
      .then(all => setItems(all.filter(i => getStatus(i) === 'low' || getStatus(i) === 'out')))
      .finally(() => setLoading(false));
  }, []);

  const handleCheck = useCallback(async (item: PantryItem) => {
    if (checking.has(item.id)) return;
    setChecking(prev => new Set([...prev, item.id]));

    // Optimistic: remove from list
    setItems(prev => prev.filter(p => p.id !== item.id));

    try {
      await updatePantryItem(item.id, { status: 'in-stock' });
    } catch {
      // Roll back
      setItems(prev => [...prev, item]);
    } finally {
      setChecking(prev => { const s = new Set(prev); s.delete(item.id); return s; });
    }
  }, [checking]);

  const groups = groupByCategory(items).filter(g => g.items.length > 0);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-24 pb-32 sm:pb-16">
        <div className="mb-8">
          <div className="skeleton h-3 w-20 rounded mb-2" />
          <div className="skeleton h-12 w-56 rounded-lg mb-3" />
          <div className="skeleton h-1 w-10 rounded" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-24 pb-32 sm:pb-16">

      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '6px',
        }}>
          Shopping
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 'clamp(2.25rem, 5vw, 3.25rem)', color: 'var(--text)',
          letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '10px',
        }}>
          Shopping List
        </h1>
        <div style={{ width: '40px', height: '3px', background: 'var(--accent)', borderRadius: '2px' }} />
      </div>

      {groups.length === 0 ? (
        <div
          className="py-20 text-center rounded-2xl animate-fade-up"
          style={{ border: '1.5px dashed var(--border-strong)' }}
        >
          <p style={{ fontSize: '2rem', marginBottom: '12px' }}>✓</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
            All stocked up!
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            No items are low or out of stock.
          </p>
        </div>
      ) : (
        <>
          <p className="animate-fade-up" style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            {items.length} {items.length === 1 ? 'item' : 'items'} to pick up — tap to mark as in stock
          </p>

          <div className="space-y-8 animate-fade-up">
            {groups.map(({ category, items: groupItems }) => (
              <section key={category}>
                {/* Category header */}
                <div className="flex items-center gap-2 mb-3">
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '3px 10px', borderRadius: '999px',
                    background: 'var(--bg-subtle)', border: '1px solid var(--border-strong)',
                    fontFamily: 'var(--font-body)', fontSize: '0.6875rem', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {category}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                </div>

                {/* Items */}
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
                }}>
                  {groupItems.map((item, idx) => {
                    const isOut = getStatus(item) === 'out';
                    const isChecking = checking.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3"
                        style={{
                          padding: '13px 14px',
                          borderBottom: idx === groupItems.length - 1 ? 'none' : '1px solid var(--border)',
                          opacity: isChecking ? 0.4 : 1,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => handleCheck(item)}
                          disabled={isChecking}
                          style={{
                            width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                            border: `2px solid ${isOut ? '#e53935' : '#ff9800'}`,
                            background: 'transparent', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = isOut ? 'rgba(229,57,53,0.12)' : 'rgba(255,152,0,0.12)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        />

                        {/* Name */}
                        <p style={{
                          flex: 1, minWidth: 0,
                          fontFamily: 'var(--font-body)', fontWeight: 500,
                          fontSize: '0.9375rem', color: 'var(--text)',
                        }}>
                          {item.name}
                        </p>

                        {/* Status badge */}
                        <span style={{
                          flexShrink: 0, fontSize: '0.7rem', fontWeight: 700,
                          fontFamily: 'var(--font-body)', letterSpacing: '0.02em',
                          padding: '3px 8px', borderRadius: '999px',
                          background: isOut ? 'rgba(229,57,53,0.10)' : 'rgba(255,152,0,0.10)',
                          color: isOut ? '#e53935' : '#ff9800',
                        }}>
                          {isOut ? 'Out' : 'Low'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
