import { useState } from 'react';
import Modal from './Modal';
import StarPicker from './StarPicker';
import { rateRecipe } from '../api';
import type { Recipe } from '../types';

interface Props {
  recipe: Recipe;
  onClose: () => void;
  onSave: (updated: Recipe) => void;
}

export default function BakedModal({ recipe, onClose, onSave }: Props) {
  const [rating, setRating] = useState(recipe.rating || 0);
  const [review, setReview] = useState(recipe.review || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!rating) return;
    setSaving(true);
    try {
      const updated = await rateRecipe(recipe.id, rating, review);
      onSave(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="How did it turn out?" onClose={onClose}>
      <div className="space-y-5">
        <div className="flex flex-col items-center py-2">
          <StarPicker value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}>
            Notes (optional)
          </label>
          <textarea
            value={review}
            onChange={e => setReview(e.target.value)}
            rows={3}
            placeholder="What did you think? Any tweaks for next time?"
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
          <button onClick={onClose}
            className="px-4 py-2 text-sm transition-colors duration-200"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!rating || saving}
            className="px-5 py-2 text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)', color: '#0D0D0D', fontFamily: 'var(--font-body)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { if (!saving && rating) e.currentTarget.style.background = '#D94E7A'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
