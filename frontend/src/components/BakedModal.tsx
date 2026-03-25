import { useState } from 'react';
import Modal from './Modal';
import StarPicker from './StarPicker';
import { logBake, rateRecipe } from '../api';
import type { Recipe } from '../types';

interface Props {
  recipe: Recipe;
  onClose: () => void;
  onSave: (updated: Recipe) => void;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function BakedModal({ recipe, onClose, onSave }: Props) {
  const [date, setDate] = useState(todayStr());
  const [rating, setRating] = useState(recipe.rating || 0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!date) return;
    setSaving(true);
    try {
      let updated = await logBake(recipe.id, date, notes || undefined);
      if (rating) {
        updated = await rateRecipe(recipe.id, rating, notes);
      }
      onSave(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Mark as Baked" onClose={onClose}>
      <div className="space-y-5">

        {/* Date */}
        <div>
          <label
            className="block text-xs font-semibold mb-2 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}
          >
            Date made
          </label>
          <input
            type="date"
            value={date}
            max={todayStr()}
            onChange={e => setDate(e.target.value)}
            className="w-full text-sm transition-all duration-200"
            style={{
              padding: '0.75rem 1rem',
              border: '1.5px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
              outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Rating (optional) */}
        <div>
          <label
            className="block text-xs font-semibold mb-2 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}
          >
            Rating <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span>
          </label>
          <div className="flex items-center">
            <StarPicker value={rating} onChange={setRating} />
            {rating > 0 && (
              <button
                onClick={() => setRating(0)}
                className="ml-3 text-xs"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Notes (optional) */}
        <div>
          <label
            className="block text-xs font-semibold mb-2 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}
          >
            Notes <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Any tweaks or notes for next time?"
            className="w-full text-sm resize-none transition-all duration-200"
            style={{
              padding: '0.75rem 1rem',
              border: '1.5px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
              outline: 'none',
              lineHeight: 1.6,
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm transition-colors duration-200"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!date || saving}
            className="px-5 py-2 text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)', color: '#FFFFFF', fontFamily: 'var(--font-body)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { if (!saving && date) e.currentTarget.style.background = '#D94E7A'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
          >
            {saving ? 'Saving…' : 'Log Bake'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
