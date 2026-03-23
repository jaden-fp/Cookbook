import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const { pathname } = useLocation();
  const isActive = (to: string) => pathname.startsWith(to);

  return (
    <nav
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(13,13,13,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        height: '62px',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-12 h-full flex items-center justify-between">

        {/* Wordmark */}
        <Link to="/cookbooks" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 600,
            color: 'var(--text)',
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}>
            Cox Cookie Co.
          </span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.875rem',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--accent)',
          }}>
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
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  textDecoration: 'none',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  transition: 'all 0.15s ease',
                  letterSpacing: '0',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.background = 'var(--surface)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--text-muted)';
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
