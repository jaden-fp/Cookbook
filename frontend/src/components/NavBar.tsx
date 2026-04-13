import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function NavBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const isActive = (to: string) => to === '/' ? pathname === '/' : pathname.startsWith(to);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate(`/recipes?q=${encodeURIComponent(term)}`);
    setQ('');
  }

  return (
    <>
    <nav className="hidden sm:block sticky top-0 z-40"
      style={{
        background: '#F46696',
        borderBottom: 'none',
        height: '72px',
        overflow: 'visible',
        position: 'relative',
      }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 h-full flex items-center gap-4">
        <Link to="/cookbooks" className="shrink-0" style={{ textDecoration: 'none' }}>
          <img
            src="/logo.png"
            alt="Logo"
            className="nav-logo"
            style={{ flexShrink: 0 }}
          />
        </Link>

        {/* Global search */}
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '320px' }}>
          <div style={{ position: 'relative' }}>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search recipes…"
              style={{
                width: '100%',
                paddingLeft: '34px',
                paddingRight: q ? '32px' : '14px',
                paddingTop: '7px',
                paddingBottom: '7px',
                background: 'rgba(255,255,255,0.18)',
                border: '1.5px solid rgba(255,255,255,0.25)',
                borderRadius: '999px',
                color: 'white',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'background 0.15s, border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.28)'; e.target.style.borderColor = 'rgba(255,255,255,0.5)'; }}
              onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.18)'; e.target.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', padding: 0,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l10 10M11 1L1 11"/>
                </svg>
              </button>
            )}
          </div>
        </form>

        <div className="flex items-center gap-0.5 sm:gap-1 min-w-0 ml-auto">
          {[
            { to: '/',          label: 'Home' },
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
    </>
  );
}
