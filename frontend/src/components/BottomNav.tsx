import { Link, useLocation } from 'react-router-dom';

const tabs = [
  {
    to: '/cookbooks',
    label: 'Cookbooks',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    to: '/recipes',
    label: 'Recipes',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        {/* Chef's hat */}
        <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6z"/>
        <line x1="6" y1="17" x2="18" y2="17"/>
      </svg>
    ),
  },
  {
    to: '/pantry',
    label: 'Pantry',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        {/* Mason jar */}
        <path d="M8 2h8"/>
        <path d="M7 4h10l1 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6l1-2z"/>
        <path d="M6 9h12"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const isActive = (to: string) => pathname.startsWith(to);

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'var(--accent)',
        borderTop: 'none',
        boxShadow: '0 -4px 24px rgba(244,102,150,0.25)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch" style={{ height: '56px' }}>
        {tabs.map(({ to, label, icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center justify-center gap-0.5"
              style={{
                textDecoration: 'none',
                color: active ? 'white' : 'rgba(255,255,255,0.55)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.6875rem',
                fontWeight: active ? 700 : 500,
                letterSpacing: '-0.01em',
                transition: 'color 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {icon(active)}
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
