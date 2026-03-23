import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const { pathname } = useLocation();
  const isActive = (to: string) => pathname.startsWith(to);

  return (
    <nav
      className="sticky top-0 z-40"
      style={{
        background: 'var(--cream)',
        borderBottom: '1px solid var(--bone)',
        height: '64px',
      }}
    >
      <div
        className="max-w-6xl mx-auto px-6 lg:px-12 h-full flex items-center justify-between"
      >
        {/* Wordmark */}
        <Link
          to="/cookbooks"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '6px' }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--espresso)',
              letterSpacing: '-0.01em',
              lineHeight: 1,
            }}
          >
            Cox Cookie Co.
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.875rem',
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'var(--caramel)',
              letterSpacing: '0.01em',
            }}
          >
            recipes
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {[
            { to: '/cookbooks', label: 'Cookbooks' },
            { to: '/recipes',   label: 'Recipes' },
            { to: '/pantry',    label: 'Pantry' },
          ].map(({ to, label }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: active ? 600 : 400,
                  fontSize: '0.875rem',
                  color: active ? 'var(--espresso)' : 'var(--muted)',
                  textDecoration: 'none',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: active ? 'var(--cream-deep)' : 'transparent',
                  transition: 'all 0.18s ease',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--espresso)';
                    e.currentTarget.style.background = 'var(--cream-deep)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--muted)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
