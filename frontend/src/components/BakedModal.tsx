import { useState, useRef } from 'react';
import Modal from './Modal';
import StarPicker from './StarPicker';
import { logBake, rateRecipe, uploadBakePhoto, updatePantryItem } from '../api';
import type { Recipe, PantryItem } from '../types';
import { findPantryMatch } from '../utils/pantryMatch';

interface Props {
  recipe: Recipe;
  pantryItems?: PantryItem[];
  onClose: () => void;
  onSave: (updated: Recipe) => void;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function BakedModal({ recipe, pantryItems = [], onClose, onSave }: Props) {
  const [date, setDate] = useState(todayStr());
  const [rating, setRating] = useState(recipe.rating || 0);
  const [notes, setNotes] = useState('');
  const [changes, setChanges] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pantry deduct step
  const [savedRecipe, setSavedRecipe] = useState<Recipe | null>(null);
  const [deductChecked, setDeductChecked] = useState<Set<string>>(new Set());
  const [deducting, setDeducting] = useState(false);

  // Compute matched in-stock pantry items for this recipe
  const matchedPantryItems = pantryItems.filter(item => {
    if (item.status === 'out') return false;
    return recipe.ingredient_groups.some(g =>
      g.ingredients.some(ing => findPantryMatch(ing.name, [item]) !== null)
    );
  });

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhotoDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!date) return;
    setSaving(true);
    try {
      let photo_url: string | undefined;
      if (photoDataUrl) {
        photo_url = await uploadBakePhoto(recipe.id, photoDataUrl);
      }
      // Combine changes + notes into a single notes string
      const combinedNotes = [
        changes.trim() ? `What I changed: ${changes.trim()}` : '',
        notes.trim(),
      ].filter(Boolean).join('\n\n') || undefined;

      let updated = await logBake(recipe.id, date, combinedNotes, photo_url);
      if (rating) {
        updated = await rateRecipe(recipe.id, rating, combinedNotes ?? '');
      }
      onSave(updated);

      // If there are matched pantry items, show deduct step
      if (matchedPantryItems.length > 0) {
        setSavedRecipe(updated);
        // Pre-select all matched items
        setDeductChecked(new Set(matchedPantryItems.map(i => i.id)));
      } else {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeduct() {
    setDeducting(true);
    try {
      await Promise.all(
        matchedPantryItems
          .filter(item => deductChecked.has(item.id))
          .map(item => updatePantryItem(item.id, { status: 'out' }))
      );
    } finally {
      setDeducting(false);
      onClose();
    }
  }

  // ── Pantry deduct step ────────────────────────────────────────────────────

  if (savedRecipe) {
    return (
      <Modal title="Update Pantry" onClose={onClose}>
        <div className="space-y-4">
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--text)', lineHeight: 1.6 }}>
            Bake logged! Which ingredients did you use up?
          </p>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
          >
            {matchedPantryItems.map((item, idx) => {
              const checked = deductChecked.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => setDeductChecked(prev => {
                    const next = new Set(prev);
                    if (next.has(item.id)) next.delete(item.id);
                    else next.add(item.id);
                    return next;
                  })}
                  className="flex items-center gap-3 w-full text-left transition-colors duration-100"
                  style={{
                    padding: '11px 14px',
                    border: 'none',
                    borderBottom: idx < matchedPantryItems.length - 1 ? '1px solid var(--border)' : 'none',
                    background: checked ? 'var(--accent-dim)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    width: '18px', height: '18px', flexShrink: 0,
                    borderRadius: '5px',
                    border: `2px solid ${checked ? 'var(--accent)' : 'var(--border-strong)'}`,
                    background: checked ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {checked && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 6l3 3 5-5"/>
                      </svg>
                    )}
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--text)', flex: 1 }}>
                    {item.name}
                  </span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-body)',
                    padding: '2px 8px', borderRadius: '999px',
                    background: 'rgba(76,175,80,0.12)', color: '#4caf50',
                  }}>In Stock</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={onClose}
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', padding: '8px 12px' }}
            >
              Skip
            </button>
            <button
              onClick={handleDeduct}
              disabled={deductChecked.size === 0 || deducting}
              className="px-5 py-2 text-sm font-bold transition-all duration-200 disabled:opacity-40"
              style={{ background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-body)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
            >
              {deducting ? 'Updating…' : `Mark ${deductChecked.size} as Out`}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Log bake form ─────────────────────────────────────────────────────────

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

        {/* Photo (optional) */}
        <div>
          <label
            className="block text-xs font-semibold mb-2 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}
          >
            Photo <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span>
          </label>
          {photoDataUrl ? (
            <div className="relative" style={{ display: 'inline-block', width: '100%' }}>
              <img
                src={photoDataUrl}
                alt="Bake preview"
                style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: 'var(--radius-md)', display: 'block' }}
              />
              <button
                onClick={() => { setPhotoDataUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                  width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff', fontSize: '14px', lineHeight: 1,
                }}
                title="Remove photo"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-sm transition-all duration-200"
              style={{
                padding: '0.75rem 1rem',
                border: '1.5px dashed var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              Add a photo
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
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

        {/* What I changed */}
        <div>
          <label
            className="block text-xs font-semibold mb-2 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}
          >
            What I changed <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            value={changes}
            onChange={e => setChanges(e.target.value)}
            rows={2}
            placeholder="Any substitutions or tweaks you made…"
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
            rows={2}
            placeholder="How did it turn out? Notes for next time…"
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
