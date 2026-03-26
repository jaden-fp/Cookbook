import { Link, useLocation } from 'react-router-dom';

const tabs = [
  {
    to: '/cookbooks',
    label: 'Cookbooks',
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    to: '/recipes',
    label: 'Recipes',
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6z"/>
        <line x1="6" y1="17" x2="18" y2="17"/>
      </svg>
    ),
  },
  {
    to: '/pantry',
    label: 'Pantry',
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
        {/* Shopping bag */}
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const isActive = (to: string) => pathname.startsWith(to);

  return (
    <nav
      className="bottom-nav sm:hidden fixed left-0 right-0 z-50"
      style={{
        bottom: 0,
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)',
        paddingTop: '8px',
        paddingLeft: '16px',
        paddingRight: '16px',
        background: 'linear-gradient(to top, var(--bg) 55%, transparent)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '22px',
          boxShadow: '0 4px 28px rgba(15,12,30,0.10), 0 1px 6px rgba(15,12,30,0.06)',
          display: 'flex',
          height: '58px',
          pointerEvents: 'auto',
          border: '1px solid var(--border)',
        }}
      >
        {tabs.map(({ to, label, icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center justify-center gap-[3px]"
              style={{
                textDecoration: 'none',
                color: active ? 'var(--accent)' : '#9CA3AF',
                fontFamily: 'var(--font-body)',
                fontSize: '0.625rem',
                fontWeight: active ? 700 : 500,
                letterSpacing: '0.01em',
                transition: 'color 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
                borderRadius: '18px',
                position: 'relative',
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: '6px 16px 5px',
                borderRadius: '14px',
                background: active ? 'var(--accent-dim)' : 'transparent',
                transition: 'background 0.15s ease',
              }}>
                {icon(active)}
                <span>{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
