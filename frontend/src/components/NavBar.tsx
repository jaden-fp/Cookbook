import { Link, useLocation } from 'react-router-dom';

const MAGENTA = '#C91686';

export default function NavBar() {
  const { pathname } = useLocation();

  const isActive = (to: string) => pathname.startsWith(to);

  return (
    <nav
      className="sticky top-0 z-40"
      style={{
        background: MAGENTA,
        height: '72px',
        boxShadow: `0 2px 16px rgba(201,22,134,0.3)`,
        overflow: 'visible',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-12 h-full flex items-center justify-between">
        {/* Logo overflows below the nav bar */}
        <img
          src="/logo.png"
          alt="Cox Cookie Co."
          style={{
            height: '172px',
            width: 'auto',
            position: 'relative',
            top: '44px',
            zIndex: 50,
            filter: `drop-shadow(0 6px 16px rgba(201,22,134,0.4))`,
          }}
        />

        <div className="flex items-center gap-1">
          {[
            { to: '/cookbooks', label: 'Cookbooks' },
            { to: '/recipes', label: 'All Recipes' },
            { to: '/pantry', label: 'Pantry' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="relative px-4 py-2 text-sm transition-all duration-200"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: isActive(to) ? 'white' : 'rgba(255,255,255,0.65)',
                borderBottom: isActive(to) ? '2px solid white' : '2px solid transparent',
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                if (!isActive(to)) e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
              }}
              onMouseLeave={e => {
                if (!isActive(to)) e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
