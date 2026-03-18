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
        {/* Star picker */}
        <div className="flex flex-col items-center py-2">
          <StarPicker value={rating} onChange={setRating} />
        </div>

        {/* Review textarea */}
        <div>
          <label
            className="block text-xs font-semibold mb-2 uppercase tracking-wider"
            style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)' }}
          >
            Notes (optional)
          </label>
          <textarea
            value={review}
            onChange={e => setReview(e.target.value)}
            rows={3}
            placeholder="What did you think? Any tweaks for next time?"
            className="w-full rounded-xl text-sm resize-none transition-all duration-200"
            style={{
              padding: '0.75rem 1rem',
              border: '1.5px solid #FFC3E8',
              background: 'white',
              color: '#512A18',
              fontFamily: 'var(--font-body)',
              outline: 'none',
              lineHeight: 1.6,
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
            disabled={!rating || saving}
            className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: '#FF61B4',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 2px 8px rgba(255,97,180,0.25)',
            }}
            onMouseEnter={e => { if (!saving && rating) e.currentTarget.style.background = '#E0489E'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FF61B4'; }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
