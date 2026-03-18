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
      <div className="space-y-3">
        {/* Cookbook list */}
        {cookbooks.length > 0 ? (
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {cookbooks.map(cb => {
              const checked = selected.has(cb.id);
              return (
                <label
                  key={cb.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
                  style={{
                    background: checked ? '#FFF0F8' : 'transparent',
                    border: checked ? '1.5px solid #FF61B4' : '1.5px solid transparent',
                  }}
                  onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#FFF0F8'; }}
                  onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span
                    className="flex-1 text-sm"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: '#512A18',
                      fontWeight: checked ? 600 : 400,
                    }}
                  >
                    {cb.name}
                  </span>

                  <span
                    className="text-xs"
                    style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)' }}
                  >
                    {cb.recipe_count}
                  </span>

                  {/* Custom checkbox */}
                  <div
                    className="flex items-center justify-center shrink-0 transition-all duration-150"
                    style={{
                      width: '18px', height: '18px', borderRadius: '5px',
                      border: checked ? 'none' : '1.5px solid #FFC3E8',
                      background: checked ? '#FF61B4' : 'white',
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
          <p
            className="text-sm text-center py-3"
            style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)' }}
          >
            No cookbooks yet — create one below.
          </p>
        )}

        {/* Divider */}
        <div style={{ height: '1px', background: '#FFC3E8' }} />

        {/* Create new */}
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)' }}
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
                padding: '0.5625rem 0.75rem',
                border: '1.5px solid #FFC3E8',
                background: 'white',
                color: '#512A18',
                fontFamily: 'var(--font-body)',
                outline: 'none',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#FF61B4';
                e.target.style.boxShadow = '0 0 0 3px rgba(255,97,180,0.10)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#FFC3E8';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-40"
              style={{
                background: '#FF61B4',
                color: 'white',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E0489E'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FF61B4'; }}
            >
              {creating ? '…' : '+ Add'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg transition-colors duration-200"
            style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF0F8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-200 disabled:opacity-40"
            style={{
              background: '#FF61B4',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 2px 8px rgba(255,97,180,0.25)',
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#E0489E'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FF61B4'; }}
          >
            {saving ? 'Saving…' : 'Done'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
