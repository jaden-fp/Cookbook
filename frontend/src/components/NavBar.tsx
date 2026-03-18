import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ImportBar from './ImportBar';

export default function NavBar() {
  const { pathname } = useLocation();
  const [showImport, setShowImport] = useState(false);

  const isActive = (to: string) => pathname.startsWith(to);

  return (
    <>
      <nav
        className="sticky top-0 z-40 bg-cream/95 border-b border-warm-border-light backdrop-blur-sm"
        style={{ boxShadow: '0 1px 0 rgba(221,208,196,0.8)' }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link
            to="/cookbooks"
            className="flex items-center gap-2.5 shrink-0"
            style={{ fontFamily: 'var(--font-editorial)' }}
          >
            <span
              className="text-terra text-xl"
              style={{ fontStyle: 'italic', fontWeight: 600, letterSpacing: '-0.01em' }}
            >
              La Cuisine
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <Link
              to="/cookbooks"
              className="relative px-4 py-2 text-sm font-medium transition-colors duration-200"
              style={{
                color: isActive('/cookbooks') ? 'var(--color-terra)' : 'var(--color-bark-muted)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Cookbooks
              {isActive('/cookbooks') && (
                <span
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-terra"
                />
              )}
            </Link>
            <Link
              to="/recipes"
              className="relative px-4 py-2 text-sm font-medium transition-colors duration-200"
              style={{
                color: isActive('/recipes') ? 'var(--color-terra)' : 'var(--color-bark-muted)',
                fontFamily: 'var(--font-body)',
              }}
            >
              All Recipes
              {isActive('/recipes') && (
                <span
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-terra"
                />
              )}
            </Link>
          </div>

          {/* Import button */}
          <button
            onClick={() => setShowImport(true)}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white transition-all duration-200"
            style={{
              background: 'var(--color-terra)',
              boxShadow: '0 2px 8px rgba(196,98,45,0.30)',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-terra-dark)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-terra)')}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Import Recipe
          </button>
        </div>
      </nav>

      {/* Import modal */}
      {showImport && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-bark/40 backdrop-blur-sm animate-fade-in"
          onClick={e => e.target === e.currentTarget && setShowImport(false)}
        >
          <div className="w-full max-w-xl animate-scale-in">
            <div
              className="bg-cream rounded-2xl p-6 shadow-warm-lg"
              style={{ border: '1px solid var(--color-warm-border-light)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-lg text-bark"
                  style={{ fontFamily: 'var(--font-editorial)', fontWeight: 600 }}
                >
                  Import a Recipe
                </h2>
                <button
                  onClick={() => setShowImport(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-bark-muted hover:bg-cream-dark hover:text-bark transition-colors text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <ImportBar onSuccess={() => setShowImport(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
