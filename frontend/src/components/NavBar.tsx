import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const { pathname } = useLocation();
  const isActive = (to: string) => pathname.startsWith(to);

  return (
    <nav className="sticky top-0 z-40"
      style={{
        background: '#FE3F8D',
        borderBottom: 'none',
        height: '72px',
        overflow: 'visible',
        position: 'relative',
      }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-12 h-full flex items-center justify-between">
        <Link to="/cookbooks" style={{ textDecoration: 'none' }}>
          <img
            src="/logo.png"
            alt="Logo"
            className="nav-logo"
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
                  color: active ? 'white' : 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: active ? 'rgba(255,255,255,0.25)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'transparent'; } }}
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
