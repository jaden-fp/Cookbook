import { Link } from 'react-router-dom';
import type { Cookbook } from '../types';

interface Props {
  cookbook: Cookbook;
}

const ACCENT_COLORS = [
  'var(--color-terra)',
  'var(--color-forest)',
  '#8B6914',
  '#6B4C8A',
  '#2A6B8A',
  '#8A2A4A',
];

export default function CookbookCard({ cookbook }: Props) {
  const accent = ACCENT_COLORS[cookbook.id % ACCENT_COLORS.length];

  return (
    <Link
      to={`/cookbooks/${cookbook.id}`}
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 shadow-warm-sm"
      style={{ border: '1px solid var(--color-warm-border-light)' }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(44,26,14,0.12), 0 4px 10px rgba(44,26,14,0.07)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Color accent bar */}
      <div className="h-1.5 w-full" style={{ background: accent }} />

      <div className="p-5 flex flex-col gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18` }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ color: accent }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>

        <div>
          <h3
            className="text-bark leading-tight transition-colors duration-200"
            style={{
              fontFamily: 'var(--font-editorial)',
              fontSize: '1.0625rem',
              fontWeight: 600,
              color: 'var(--color-bark)',
            }}
          >
            {cookbook.name}
          </h3>
          <p
            className="mt-1 text-xs"
            style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}
          >
            {cookbook.recipe_count} {cookbook.recipe_count === 1 ? 'recipe' : 'recipes'}
          </p>
        </div>
      </div>
    </Link>
  );
}
