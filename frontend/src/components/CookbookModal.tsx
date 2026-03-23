import { useState, useEffect } from 'react';
import Modal from './Modal';
import { getCookbooks, createCookbook, getRecipeCookbooks, setRecipeCookbooks } from '../api';
import type { Cookbook } from '../types';

interface Props {
  recipeId: string;
  onClose: () => void;
}

export default function CookbookModal({ recipeId, onClose }: Props) {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([getCookbooks(), getRecipeCookbooks(recipeId)]).then(([all, mine]) => {
      setCookbooks(all);
      setSelected(new Set(mine.map(c => c.id)));
    });
  }, [recipeId]);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const cookbook = await createCookbook(newName.trim());
      setCookbooks(prev => [cookbook, ...prev]);
      setSelected(prev => new Set([...prev, cookbook.id]));
      setNewName('');
    } finally {
      setCreating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setRecipeCookbooks(recipeId, Array.from(selected));
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add to Cookbook" onClose={onClose}>
      <div className="space-y-3">
        {cookbooks.length > 0 ? (
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {cookbooks.map(cb => {
              const checked = selected.has(cb.id);
              return (
                <label
                  key={cb.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
                  style={{
                    background: checked ? 'rgba(196,114,42,0.07)' : 'transparent',
                    border: checked ? '1.5px solid var(--caramel)' : '1.5px solid transparent',
                    borderRadius: 'var(--radius-md)',
                  }}
                  onMouseEnter={e => { if (!checked) e.currentTarget.style.background = 'var(--cream-deep)'; }}
                  onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span className="flex-1 text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--espresso)', fontWeight: checked ? 600 : 400 }}>
                    {cb.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>{cb.recipe_count}</span>
                  <div
                    className="flex items-center justify-center shrink-0 transition-all duration-150"
                    style={{
                      width: '18px', height: '18px', borderRadius: '5px',
                      border: checked ? 'none' : '1.5px solid var(--bone)',
                      background: checked ? 'var(--caramel)' : 'white',
                    }}
                    onClick={() => toggle(cb.id)}
                  >
                    {checked && (
                      <svg className="w-2.5 h-2.5" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(cb.id)} />
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-center py-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
            No cookbooks yet — create one below.
          </p>
        )}

        <div style={{ height: '1px', background: 'var(--cream-deep)' }} />

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}>
            New Cookbook
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Give it a name…"
              className="flex-1 text-sm transition-all duration-200"
              style={{
                padding: '0.5625rem 0.75rem',
                border: '1.5px solid var(--bone)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--cream)',
                color: 'var(--espresso)',
                fontFamily: 'var(--font-body)',
                outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--caramel)'; e.target.style.boxShadow = '0 0 0 3px rgba(196,114,42,0.10)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--bone)'; e.target.style.boxShadow = 'none'; }}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="px-3 py-1.5 text-sm font-semibold transition-all duration-200 disabled:opacity-40"
              style={{ background: 'var(--caramel)', color: 'white', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#A85E22'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--caramel)'; }}
            >
              {creating ? '…' : '+ Add'}
            </button>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm transition-colors duration-200"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream-deep)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40"
            style={{
              background: 'var(--caramel)',
              fontFamily: 'var(--font-body)',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(196,114,42,0.25)',
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#A85E22'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--caramel)'; }}
          >
            {saving ? 'Saving…' : 'Done'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
