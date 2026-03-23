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
      <div className="flex gap-2">
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
                fontSize: '2.5rem',
                color: filled ? 'var(--caramel)' : 'var(--bone)',
                transform: hovered === star ? 'scale(1.15)' : 'scale(1)',
                filter: filled ? 'drop-shadow(0 2px 6px rgba(196,114,42,0.45))' : 'none',
                lineHeight: 1,
                padding: '2px',
              }}
            >
              ★
            </button>
          );
        })}
      </div>
      <p
        className="text-sm transition-all duration-200"
        style={{
          fontFamily: 'var(--font-editorial)',
          fontStyle: 'italic',
          color: active ? 'var(--color-terra)' : 'var(--color-bark-muted)',
          minHeight: '1.25rem',
        }}
      >
        {LABELS[active] || 'Select a rating'}
      </p>
    </div>
  );
}
