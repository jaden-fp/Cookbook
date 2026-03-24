import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const { pathname } = useLocation();
  const isActive = (to: string) => pathname.startsWith(to);

  return (
    <>
      {/* Mobile header — logo only */}
      <header className="sm:hidden sticky top-0 z-40 flex items-center justify-center"
        style={{ background: '#F46696', height: '52px', overflow: 'visible' }}>
        <Link to="/cookbooks" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
        </Link>
      </header>

    <nav className="hidden sm:block sticky top-0 z-40"
      style={{
        background: '#F46696',
        borderBottom: 'none',
        height: '72px',
        overflow: 'visible',
        position: 'relative',
      }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 h-full flex items-center gap-2 sm:justify-between">
        <Link to="/cookbooks" className="shrink-0" style={{ textDecoration: 'none' }}>
          <img
            src="/logo.png"
            alt="Logo"
            className="nav-logo"
            style={{ flexShrink: 0 }}
          />
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-1 min-w-0 ml-auto sm:ml-0">
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
                  fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                  color: active ? 'white' : 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  padding: '6px 10px',
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
