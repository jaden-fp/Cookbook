import { useState } from 'react';

interface Props {
  value: number;
  onChange: (v: number) => void;
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Amazing!'];

export default function StarPicker({ value, onChange }: Props) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => {
          const star = i + 1;
          const filled = star <= active;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-all duration-150"
              style={{
                fontSize: '2.25rem',
                color: filled ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                transform: hovered === star ? 'scale(1.2)' : filled ? 'scale(1.05)' : 'scale(1)',
                filter: filled ? 'drop-shadow(0 0 8px rgba(232,184,75,0.5))' : 'none',
                lineHeight: 1,
                padding: '2px 4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ★
            </button>
          );
        })}
      </div>
      <p className="text-sm transition-all duration-200" style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        minHeight: '1.25rem',
      }}>
        {LABELS[active] || 'Select a rating'}
      </p>
    </div>
  );
}
