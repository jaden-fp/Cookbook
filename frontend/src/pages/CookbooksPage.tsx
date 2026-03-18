import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ImportBar from '../components/ImportBar';
import CookbookCard from '../components/CookbookCard';
import { getCookbooks } from '../api';
import type { Cookbook } from '../types';

export default function CookbooksPage() {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCookbooks()
      .then(setCookbooks)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--color-bark) 0%, var(--color-bark-mid) 60%, #7A4020 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10" style={{ background: 'var(--color-terra-light)' }} />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full opacity-8" style={{ background: 'var(--color-gold)' }} />

        <div className="relative max-w-3xl mx-auto px-6 py-16 text-center">
          <p
            className="text-xs font-medium uppercase tracking-[0.2em] mb-4 animate-fade-up"
            style={{ color: 'var(--color-gold-light)', fontFamily: 'var(--font-body)' }}
          >
            Your Personal Collection
          </p>
          <h1
            className="text-4xl sm:text-5xl text-white mb-4 animate-fade-up delay-1"
            style={{
              fontFamily: 'var(--font-editorial)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            Your Recipe<br />
            <span style={{ fontStyle: 'italic', color: 'var(--color-gold-light)' }}>Collection</span>
          </h1>
          <p
            className="text-base mb-10 animate-fade-up delay-2"
            style={{
              color: 'rgba(250,247,242,0.65)',
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
            }}
          >
            Save recipes from anywhere. Organize them into cookbooks.
          </p>

          <div className="animate-fade-up delay-3">
            <ImportBar variant="hero" />
          </div>
        </div>
      </div>

      {/* Cookbooks grid */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-36 rounded-2xl" />
            ))}
          </div>
        ) : cookbooks.length === 0 ? (
          <div className="text-center py-20 animate-fade-up">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'var(--color-terra-muted)' }}
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--color-terra)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3
              className="text-lg mb-1"
              style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-bark)' }}
            >
              No cookbooks yet
            </h3>
            <p
              className="text-sm"
              style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}
            >
              Import a recipe above, then add it to a new cookbook.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg"
                style={{ fontFamily: 'var(--font-editorial)', fontWeight: 600, color: 'var(--color-bark)' }}
              >
                Your Cookbooks
              </h2>
              <Link
                to="/recipes"
                className="text-sm transition-colors duration-200"
                style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-terra)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-bark-muted)'; }}
              >
                View all recipes →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {cookbooks.map((cb, i) => (
                <div key={cb.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <CookbookCard cookbook={cb} />
                </div>
              ))}
              {/* Create new dashed card */}
              <Link
                to="/recipes"
                className="flex flex-col items-center justify-center rounded-2xl p-5 transition-all duration-200 min-h-[132px]"
                style={{
                  border: '2px dashed var(--color-warm-border)',
                  color: 'var(--color-bark-muted)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-terra)';
                  e.currentTarget.style.color = 'var(--color-terra)';
                  e.currentTarget.style.background = 'var(--color-terra-muted)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-warm-border)';
                  e.currentTarget.style.color = 'var(--color-bark-muted)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center mb-2 text-lg">+</div>
                <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                  Import a recipe
                </span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
