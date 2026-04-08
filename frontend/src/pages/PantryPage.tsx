import { useState, useEffect, useRef, useCallback } from 'react';
import { getPantryItems, addPantryItem, updatePantryItem, deletePantryItem, categorizePantryItem } from '../api';
import type { PantryItem } from '../types';

// ─── Status helpers ────────────────────────────────────────────────────────────

type Status = 'in-stock' | 'low' | 'out';

function getStatus(item: PantryItem): Status {
  if (item.status) return item.status;
  return item.needs_purchase ? 'out' : 'in-stock';
}

const STATUS_CYCLE: Status[] = ['in-stock', 'low', 'out'];

function nextStatus(s: Status): Status {
  const i = STATUS_CYCLE.indexOf(s);
  return STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];
}

const STATUS_META: Record<Status, { label: string; dot: string; color: string; bg: string }> = {
  'in-stock': { label: 'In Stock', dot: '#4caf50', color: '#4caf50', bg: 'rgba(76,175,80,0.12)' },
  'low':      { label: 'Low',      dot: '#ff9800', color: '#ff9800', bg: 'rgba(255,152,0,0.12)' },
  'out':      { label: 'Out',      dot: '#e53935', color: '#e53935', bg: 'rgba(229,57,53,0.12)' },
};

// ─── Category order ────────────────────────────────────────────────────────────

const CATEGORY_ORDER = [
  'Dairy', 'Flours', 'Sweeteners', 'Fats & Oils', 'Chocolate',
  'Spices', 'Extracts', 'Leavening', 'Nuts', 'Other',
];


function normalizeCategory(cat: string | undefined): string {
  return cat?.trim() || 'Other';
}

function groupByCategory(items: PantryItem[]): { category: string; items: PantryItem[] }[] {
  const map = new Map<string, PantryItem[]>();

  for (const item of items) {
    const cat = normalizeCategory(item.category);
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }

  const STATUS_PRIORITY: Record<Status, number> = { out: 0, low: 1, 'in-stock': 2 };

  // Sort each group: out first, then low, then in-stock; alphabetically within each tier
  for (const arr of map.values()) {
    arr.sort((a, b) => {
      const pa = STATUS_PRIORITY[getStatus(a)];
      const pb = STATUS_PRIORITY[getStatus(b)];
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name);
    });
  }

  // Build ordered list: known categories first, then any unknown ones alphabetically
  const knownGroups = CATEGORY_ORDER
    .filter(cat => map.has(cat))
    .map(cat => ({ category: cat, items: map.get(cat)! }));

  const unknownGroups = [...map.keys()]
    .filter(cat => !CATEGORY_ORDER.includes(cat))
    .sort()
    .map(cat => ({ category: cat, items: map.get(cat)! }));

  return [...knownGroups, ...unknownGroups];
}

// ─── Filter type ───────────────────────────────────────────────────────────────

type Filter = 'all' | 'low' | 'out';

// ─── Optimistic placeholder ID prefix ─────────────────────────────────────────

let _tempId = 0;
function tempId() { return `__temp_${++_tempId}`; }

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PantryPage() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab
  const [tab, setTab] = useState<'pantry' | 'shopping'>('pantry');

  // Shopping list: track which items are being checked off
  const [shoppingChecking, setShoppingChecking] = useState<Set<string>>(new Set());

  // Filter
  const [filter, setFilter] = useState<Filter>('all');

  // Add form
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Inline rename
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load items
  const didCategorize = useRef(false);
  useEffect(() => {
    getPantryItems().then(items => {
      setItems(items);
      // Background: auto-categorize any items that have no category yet
      if (didCategorize.current) return;
      didCategorize.current = true;
      const uncategorized = items.filter(i => !i.category || i.category === 'Other');
      uncategorized.forEach(item => {
        categorizePantryItem(item.id)
          .then(updated => setItems(prev => prev.map(p => p.id === updated.id ? updated : p)))
          .catch(() => {});
      });
    }).finally(() => setLoading(false));
  }, []);

  // Focus rename input when entering rename mode
  useEffect(() => {
    if (renamingId) {
      setTimeout(() => renameInputRef.current?.focus(), 10);
    }
  }, [renamingId]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || saving) return;

    setSaving(true);
    setAddError(null);

    // Optimistic placeholder
    const placeholder: PantryItem = {
      id: tempId(),
      name,
      quantity: 0,
      unit: '',
      needs_purchase: 0,
      status: 'in-stock',
      category: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setItems(prev => [...prev, placeholder]);
    setNewName('');
    nameInputRef.current?.focus();

    try {
      const item = await addPantryItem({ name, status: 'in-stock' });
      setItems(prev => prev.map(p => p.id === placeholder.id ? item : p));
    } catch (err) {
      // Roll back
      setItems(prev => prev.filter(p => p.id !== placeholder.id));
      setNewName(name);
      setAddError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setSaving(false);
    }
  }

  const handleCycleStatus = useCallback(async (item: PantryItem) => {
    const current = getStatus(item);
    const next = nextStatus(current);

    // Optimistic update
    setItems(prev => prev.map(p => p.id === item.id ? { ...p, status: next } : p));

    try {
      const updated = await updatePantryItem(item.id, { status: next });
      setItems(prev => prev.map(p => p.id === item.id ? updated : p));
    } catch {
      // Roll back
      setItems(prev => prev.map(p => p.id === item.id ? item : p));
    }
  }, []);

  function startRename(item: PantryItem) {
    setRenamingId(item.id);
    setRenameValue(item.name);
  }

  async function commitRename(item: PantryItem) {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name || name === item.name) return;

    // Optimistic
    setItems(prev => prev.map(p => p.id === item.id ? { ...p, name } : p));

    try {
      const updated = await updatePantryItem(item.id, { name });
      setItems(prev => prev.map(p => p.id === item.id ? updated : p));
    } catch {
      // Roll back
      setItems(prev => prev.map(p => p.id === item.id ? item : p));
    }
  }

  const handleShoppingCheck = useCallback(async (item: PantryItem) => {
    if (shoppingChecking.has(item.id)) return;
    setShoppingChecking(prev => new Set([...prev, item.id]));
    setItems(prev => prev.map(p => p.id === item.id ? { ...p, status: 'in-stock' as Status } : p));
    try {
      await updatePantryItem(item.id, { status: 'in-stock' });
    } catch {
      setItems(prev => prev.map(p => p.id === item.id ? item : p));
    } finally {
      setShoppingChecking(prev => { const s = new Set(prev); s.delete(item.id); return s; });
    }
  }, [shoppingChecking]);

  async function handleDelete(item: PantryItem) {
    setItems(prev => prev.filter(p => p.id !== item.id));
    try {
      await deletePantryItem(item.id);
    } catch {
      // Roll back
      setItems(prev => [...prev, item]);
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────────

  const filteredItems = items.filter(item => {
    const s = getStatus(item);
    if (filter === 'low') return s === 'low';
    if (filter === 'out') return s === 'out';
    return true;
  });

  const groups = groupByCategory(filteredItems).filter(g => g.items.length > 0);

  const lowCount = items.filter(i => getStatus(i) === 'low').length;
  const outCount = items.filter(i => getStatus(i) === 'out').length;
  const shoppingCount = lowCount + outCount;
  const shoppingItems = items.filter(i => { const s = getStatus(i); return s === 'low' || s === 'out'; });
  const shoppingGroups = groupByCategory(shoppingItems).filter(g => g.items.length > 0);

  // ── Skeleton ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-24 pb-32 sm:pb-16">
        <div className="mb-8">
          <div className="skeleton h-3 w-20 rounded mb-2" />
          <div className="skeleton h-12 w-56 rounded-lg mb-3" />
          <div className="skeleton h-1 w-10 rounded" />
        </div>
        <div className="skeleton h-11 w-full rounded-full mb-6" />
        <div className="flex gap-2 mb-8">
          {[80, 96, 112].map(w => (
            <div key={w} className="skeleton h-8 rounded-full" style={{ width: w }} />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-24 pb-32 sm:pb-16">

      {/* ── Page header ── */}
      <div className="mb-6 animate-fade-up">
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: '6px',
        }}>
          The Pantry
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

      {/* ── Add item form ── */}
      <div className="animate-fade-up delay-1 mb-5">
        <form onSubmit={handleAdd}>
          <div
            className="flex items-stretch overflow-hidden"
            style={{
              borderRadius: '999px',
              border: '1.5px solid var(--border-strong)',
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Search icon */}
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '16px', color: 'var(--text-muted)', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>

            <input
              ref={nameInputRef}
              type="text"
              value={newName}
              onChange={e => { setNewName(e.target.value); setAddError(null); }}
              onKeyDown={e => { if (e.key === 'Escape') setNewName(''); }}
              placeholder="Add an ingredient…"
              autoComplete="off"
              className="w-full"
              style={{
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9375rem',
                color: 'var(--text)',
                padding: '0.75rem 0.75rem 0.75rem 10px',
                background: 'transparent',
                minWidth: 0,
                flex: 1,
              }}
            />

            {newName && (
              <button
                type="button"
                onClick={() => setNewName('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 8px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}

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

        {addError && (
          <p style={{ marginTop: '6px', fontSize: '0.8125rem', color: '#e53935', fontFamily: 'var(--font-body)', paddingLeft: '1rem' }}>
            {addError}
          </p>
        )}
      </div>

      {/* ── Filter chips ── */}
      <div className="flex items-center gap-2 mb-8 animate-fade-up delay-2 flex-wrap">
        {(
          [
            { key: 'all' as Filter, label: 'All', count: items.length },
            { key: 'low' as Filter, label: 'Low Stock', count: lowCount },
            { key: 'out' as Filter, label: 'Out of Stock', count: outCount },
          ] as const
        ).map(({ key, label, count }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                borderRadius: '999px',
                border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--border-strong)',
                background: active ? 'var(--accent-dim)' : 'var(--surface)',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
              {count > 0 && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '999px',
                  background: active ? 'var(--accent)' : 'var(--bg-subtle)',
                  color: active ? '#fff' : 'var(--text-muted)',
                  lineHeight: 1.5,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Category groups ── */}
      {groups.length === 0 ? (
        <div
          className="py-14 text-center rounded-2xl animate-fade-up delay-3"
          style={{ border: '1.5px dashed var(--border-strong)' }}
        >
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.9375rem' }}>
            {filter !== 'all'
              ? `No ${filter === 'low' ? 'low stock' : 'out of stock'} items.`
              : 'Your pantry is empty — add some ingredients above!'}
          </p>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-up delay-3">
          {groups.map(({ category, items: groupItems }) => (
            <section key={category}>
              {/* Category header */}
              <div className="flex items-center gap-2 mb-3" style={{ userSelect: 'none' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-strong)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {category}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  opacity: 0.6,
                  flexShrink: 0,
                }}>
                  {groupItems.length}
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              {/* Items */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {groupItems.map((item, idx) => (
                  <PantryRow
                    key={item.id}
                    item={item}
                    isLast={idx === groupItems.length - 1}
                    isRenaming={renamingId === item.id}
                    confirmingDelete={confirmDeleteId === item.id}
                    renameValue={renameValue}
                    renameInputRef={renameInputRef}
                    onCycleStatus={handleCycleStatus}
                    onStartRename={startRename}
                    onRenameChange={setRenameValue}
                    onRenameCommit={commitRename}
                    onRenameCancel={() => setRenamingId(null)}
                    onDeleteRequest={() => setConfirmDeleteId(item.id)}
                    onDeleteConfirm={() => { setConfirmDeleteId(null); handleDelete(item); }}
                    onDeleteCancel={() => setConfirmDeleteId(null)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PantryRow subcomponent ────────────────────────────────────────────────────

interface PantryRowProps {
  item: PantryItem;
  isLast: boolean;
  isRenaming: boolean;
  confirmingDelete: boolean;
  renameValue: string;
  renameInputRef: React.RefObject<HTMLInputElement | null>;
  onCycleStatus: (item: PantryItem) => void;
  onStartRename: (item: PantryItem) => void;
  onRenameChange: (val: string) => void;
  onRenameCommit: (item: PantryItem) => void;
  onRenameCancel: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

function PantryRow({
  item,
  isLast,
  isRenaming,
  confirmingDelete,
  renameValue,
  renameInputRef,
  onCycleStatus,
  onStartRename,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: PantryRowProps) {
  const status = getStatus(item);
  const meta = STATUS_META[status];
  const isTemp = item.id.startsWith('__temp_');

  return (
    <div
      className="flex items-center gap-3 group"
      style={{
        padding: '12px 14px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        opacity: isTemp ? 0.6 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Status pill — clickable to cycle */}
      <button
        onClick={() => !isTemp && onCycleStatus(item)}
        disabled={isTemp}
        title={`Status: ${meta.label} — click to cycle`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '999px',
          border: 'none',
          background: meta.bg,
          color: meta.color,
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: '0.7rem',
          letterSpacing: '0.02em',
          cursor: isTemp ? 'default' : 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
        onMouseEnter={e => {
          if (!isTemp) {
            e.currentTarget.style.filter = 'brightness(0.92)';
            e.currentTarget.style.transform = 'scale(1.04)';
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.filter = '';
          e.currentTarget.style.transform = '';
        }}
      >
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: meta.dot,
          flexShrink: 0,
        }} />
        {meta.label}
      </button>

      {/* Item name — click to rename */}
      {isRenaming ? (
        <input
          ref={renameInputRef}
          type="text"
          value={renameValue}
          onChange={e => onRenameChange(e.target.value)}
          onBlur={() => onRenameCommit(item)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); onRenameCommit(item); }
            if (e.key === 'Escape') { e.preventDefault(); onRenameCancel(); }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            borderBottom: '1.5px solid var(--accent)',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            fontSize: '0.9375rem',
            color: 'var(--text)',
            background: 'transparent',
            padding: '1px 2px',
          }}
        />
      ) : (
        <p
          className="flex-1 min-w-0 truncate"
          title="Click to rename"
          onClick={() => !isTemp && onStartRename(item)}
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            color: 'var(--text)',
            fontSize: '0.9375rem',
            cursor: isTemp ? 'default' : 'text',
            userSelect: 'none',
          }}
        >
          {item.name}
          {isTemp && (
            <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              saving…
            </span>
          )}
        </p>
      )}

      {/* Delete / confirm */}
      {!isTemp && (
        confirmingDelete ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onDeleteConfirm}
              style={{
                fontSize: '0.7rem', fontFamily: 'var(--font-body)', fontWeight: 700,
                padding: '3px 8px', borderRadius: '999px', border: 'none',
                background: '#ef4444', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Delete
            </button>
            <button
              onClick={onDeleteCancel}
              style={{
                fontSize: '0.7rem', fontFamily: 'var(--font-body)', fontWeight: 500,
                padding: '3px 8px', borderRadius: '999px',
                border: '1px solid var(--border-strong)',
                background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={onDeleteRequest}
            title="Remove item"
            className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 shrink-0"
            style={{
              width: '26px', height: '26px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', border: 'none', borderRadius: '50%',
              background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,57,53,0.10)'; e.currentTarget.style.color = '#e53935'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11"/>
            </svg>
          </button>
        )
      )}
    </div>
  );
}
