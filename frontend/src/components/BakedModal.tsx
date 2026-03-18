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
    <Modal title="Mark as Baked" onClose={onClose}>
      <div className="space-y-5">
        {/* Star picker */}
        <div
          className="rounded-2xl p-5 flex flex-col items-center"
          style={{ background: 'var(--color-terra-muted)' }}
        >
          <p
            className="text-sm mb-3"
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--color-bark-mid)',
              fontStyle: 'italic',
            }}
          >
            How did it turn out?
          </p>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        {/* Review textarea */}
        <div>
          <label
            className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
            style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}
          >
            Notes (optional)
          </label>
          <textarea
            value={review}
            onChange={e => setReview(e.target.value)}
            rows={3}
            placeholder="What did you think? Any tweaks you'd make next time?"
            className="w-full rounded-xl text-sm resize-none transition-all duration-200"
            style={{
              padding: '0.75rem 1rem',
              border: '1.5px solid var(--color-warm-border)',
              background: 'white',
              color: 'var(--color-bark)',
              fontFamily: 'var(--font-body)',
              outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--color-terra)'; e.target.style.boxShadow = '0 0 0 3px rgba(196,98,45,0.10)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--color-warm-border)'; e.target.style.boxShadow = 'none'; }}
          />
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
            disabled={!rating || saving}
            className="px-5 py-2 text-sm font-medium text-white rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'var(--color-terra)',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 2px 8px rgba(196,98,45,0.30)',
            }}
            onMouseEnter={e => { if (!saving && rating) e.currentTarget.style.background = 'var(--color-terra-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-terra)'; }}
          >
            {saving ? 'Saving…' : 'Save Review'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
