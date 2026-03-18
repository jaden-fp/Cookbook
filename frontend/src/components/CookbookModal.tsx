import { useState, useEffect } from 'react';
import Modal from './Modal';
import { getCookbooks, createCookbook, getRecipeCookbooks, setRecipeCookbooks } from '../api';
import type { Cookbook } from '../types';

interface Props {
  recipeId: number;
  onClose: () => void;
}

export default function CookbookModal({ recipeId, onClose }: Props) {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([getCookbooks(), getRecipeCookbooks(recipeId)]).then(([all, mine]) => {
      setCookbooks(all);
      setSelected(new Set(mine.map(c => c.id)));
    });
  }, [recipeId]);

  function toggle(id: number) {
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
      <div className="space-y-4">
        {/* Cookbook list */}
        {cookbooks.length > 0 ? (
          <div
            className="space-y-1 max-h-52 overflow-y-auto rounded-xl p-1"
            style={{ background: 'var(--color-cream)' }}
          >
            {cookbooks.map(cb => {
              const checked = selected.has(cb.id);
              return (
                <label
                  key={cb.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150"
                  style={{
                    background: checked ? 'var(--color-terra-muted)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!checked) e.currentTarget.style.background = 'var(--color-cream-dark)'; }}
                  onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Custom checkbox */}
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all duration-150"
                    style={{
                      border: checked ? 'none' : '1.5px solid var(--color-warm-border)',
                      background: checked ? 'var(--color-terra)' : 'white',
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
                  <span
                    className="flex-1 text-sm"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: 'var(--color-bark)',
                      fontWeight: checked ? 500 : 400,
                    }}
                  >
                    {cb.name}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    {cb.recipe_count}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <p
            className="text-sm text-center py-2"
            style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}
          >
            No cookbooks yet — create one below.
          </p>
        )}

        {/* Create new */}
        <div
          className="rounded-xl p-3"
          style={{
            background: 'var(--color-cream)',
            border: '1.5px dashed var(--color-warm-border)',
          }}
        >
          <p
            className="text-xs font-medium uppercase tracking-wider mb-2"
            style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}
          >
            New Cookbook
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Give it a name…"
              className="flex-1 rounded-lg text-sm transition-all duration-200"
              style={{
                padding: '0.5rem 0.75rem',
                border: '1.5px solid var(--color-warm-border)',
                background: 'white',
                color: 'var(--color-bark)',
                fontFamily: 'var(--font-body)',
                outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-terra)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-warm-border)'; }}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              style={{
                background: 'var(--color-terra-muted)',
                color: 'var(--color-terra-dark)',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-terra)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-terra-muted)'; e.currentTarget.style.color = 'var(--color-terra-dark)'; }}
            >
              {creating ? '…' : '+ Add'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-full transition-colors duration-200"
            style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-cream-dark)'; e.currentTarget.style.color = 'var(--color-bark)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-bark-muted)'; }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white rounded-full transition-all duration-200 disabled:opacity-40"
            style={{
              background: 'var(--color-terra)',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 2px 8px rgba(196,98,45,0.30)',
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--color-terra-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-terra)'; }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
