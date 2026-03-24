import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const { pathname } = useLocation();
  const isActive = (to: string) => pathname.startsWith(to);

  const logoHeight = 174;
  const navHeight = 72;

  return (
    <nav className="sticky top-0 z-40"
      style={{
        background: 'rgba(246,245,255,0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        height: `${navHeight}px`,
        overflow: 'visible',
      }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-12 h-full flex items-center justify-between">
        <Link
          to="/cookbooks"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            height: `${navHeight}px`,
          }}
        >
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              height: `${logoHeight}px`,
              width: 'auto',
              display: 'block',
              position: 'absolute',
              top: `${(navHeight - logoHeight) / 2}px`,
            }}
          />
        </Link>

        <div className="flex items-center gap-1">
          {[
            { to: '/cookbooks', label: 'Cookbooks' },
            { to: '/recipes',   label: 'Recipes' },
            { to: '/pantry',    label: 'Pantry' },
          ].map(({ to, label }) => {
            const active = isActive(to);
            return (
              <Link key={to} to={to}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  textDecoration: 'none',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--bg-subtle)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; } }}
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
