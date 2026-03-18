import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { importRecipe, searchRecipes } from '../api';
import type { SearchResult } from '../types';

const IMPORT_MESSAGES = [
  'Fetching recipe page…',
  'Extracting ingredients…',
  'Parsing instructions…',
  'Saving to your cookbook…',
];

type Mode = 'search' | 'url';

interface Props {
  variant?: 'default' | 'hero';
  onSuccess?: () => void;
}

export default function ImportBar({ variant = 'default', onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>('search');

  // URL paste state
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsgIdx, setImportMsgIdx] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);

  // Search state
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [importingUrl, setImportingUrl] = useState<string | null>(null);

  const navigate = useNavigate();
  const importIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (importing) {
      setImportMsgIdx(0);
      importIntervalRef.current = setInterval(() => {
        setImportMsgIdx(i => Math.min(i + 1, IMPORT_MESSAGES.length - 1));
      }, 2200);
    } else {
      if (importIntervalRef.current) clearInterval(importIntervalRef.current);
    }
    return () => { if (importIntervalRef.current) clearInterval(importIntervalRef.current); };
  }, [importing]);

  // ── URL import ──
  async function handleUrlImport(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setImporting(true);
    setImportError(null);
    try {
      const recipe = await importRecipe(url.trim());
      setUrl('');
      onSuccess?.();
      navigate(`/recipes/${recipe.id}`);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  // ── Search ──
  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setResults([]);
    setHasSearched(true);
    try {
      const data = await searchRecipes(query.trim());
      setResults(data);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 503) {
        setSearchError('not_configured');
      } else if (status === 429 || status === 403) {
        setSearchError('quota');
      } else {
        setSearchError(err instanceof Error ? err.message : 'Search failed');
      }
    } finally {
      setSearching(false);
    }
  }

  // ── Import from search result ──
  async function handleResultImport(resultUrl: string) {
    setImportingUrl(resultUrl);
    setImportError(null);
    try {
      const recipe = await importRecipe(resultUrl);
      onSuccess?.();
      navigate(`/recipes/${recipe.id}`);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
      setImportingUrl(null);
    }
  }

  const isHero = variant === 'hero';
  const inputPy = isHero ? '1rem' : '0.625rem';
  const inputPx = isHero ? '1.5rem' : '1.125rem';
  const inputFs = isHero ? '1rem' : '0.875rem';
  const btnPy = isHero ? '0.6875rem' : '0.5rem';
  const btnPx = isHero ? '1.5rem' : '1.125rem';
  const btnFs = isHero ? '0.9375rem' : '0.8125rem';

  return (
    <div className="w-full">
      {/* ── Mode toggle ── */}
      <div className="flex justify-center mb-3">
        <div
          className="inline-flex items-center p-1 rounded-full"
          style={{
            background: 'rgba(44,26,14,0.08)',
            gap: '2px',
          }}
        >
          {(['search', 'url'] as Mode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setSearchError(null); setImportError(null); }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
              style={{
                fontFamily: 'var(--font-body)',
                background: mode === m ? 'var(--color-terra)' : 'transparent',
                color: mode === m ? 'white' : 'var(--color-bark-muted)',
                boxShadow: mode === m ? '0 1px 4px rgba(196,98,45,0.30)' : 'none',
              }}
            >
              {m === 'search' ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  Search
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  Paste URL
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search mode ── */}
      {mode === 'search' && (
        <div>
          <form onSubmit={handleSearch} className="relative flex items-center">
            <span
              className="absolute left-4 pointer-events-none"
              style={{ color: 'var(--color-bark-muted)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search for a recipe…"
              disabled={searching}
              className="w-full rounded-full border bg-white text-bark placeholder-bark-muted transition-all duration-200"
              style={{
                borderColor: 'var(--color-warm-border)',
                fontFamily: 'var(--font-body)',
                fontSize: inputFs,
                padding: `${inputPy} ${inputPx}`,
                paddingLeft: '2.75rem',
                paddingRight: '9rem',
                boxShadow: '0 2px 16px rgba(44,26,14,0.07)',
                outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-terra)'; e.target.style.boxShadow = '0 2px 16px rgba(44,26,14,0.07), 0 0 0 3px rgba(196,98,45,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-warm-border)'; e.target.style.boxShadow = '0 2px 16px rgba(44,26,14,0.07)'; }}
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="absolute right-1.5 rounded-full font-medium text-white transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--color-terra)',
                fontFamily: 'var(--font-body)',
                fontSize: btnFs,
                padding: `${btnPy} ${btnPx}`,
                boxShadow: '0 2px 8px rgba(196,98,45,0.30)',
              }}
              onMouseEnter={e => { if (!searching) e.currentTarget.style.background = 'var(--color-terra-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-terra)'; }}
            >
              {searching ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Searching
                </>
              ) : 'Search'}
            </button>
          </form>

          {/* Search errors */}
          {searchError === 'not_configured' && (
            <p className="mt-3 text-sm text-center" style={{ color: 'var(--color-bark-muted)', fontStyle: 'italic', fontFamily: 'var(--font-body)' }}>
              Search isn't configured yet — use{' '}
              <button
                onClick={() => setMode('url')}
                className="underline"
                style={{ color: 'var(--color-terra)' }}
              >
                Paste URL
              </button>{' '}
              for now.
            </p>
          )}
          {searchError === 'quota' && (
            <p className="mt-3 text-sm text-center" style={{ color: 'var(--color-bark-muted)', fontStyle: 'italic', fontFamily: 'var(--font-body)' }}>
              Search limit reached for today — you can still{' '}
              <button
                onClick={() => setMode('url')}
                className="underline"
                style={{ color: 'var(--color-terra)' }}
              >
                paste a URL
              </button>{' '}
              directly.
            </p>
          )}
          {searchError && searchError !== 'not_configured' && searchError !== 'quota' && (
            <p className="mt-2.5 text-sm text-center" style={{ color: '#C0392B', fontFamily: 'var(--font-body)' }}>
              {searchError}
            </p>
          )}

          {/* Import error (from result click) */}
          {importError && (
            <p className="mt-2.5 text-sm text-center" style={{ color: '#C0392B', fontFamily: 'var(--font-body)' }}>
              {importError}
            </p>
          )}

          {/* Search results */}
          {results.length > 0 && (
            <div className="mt-3 space-y-2 animate-fade-up">
              {results.map((result, i) => {
                const isImporting = importingUrl === result.url;
                return (
                  <div
                    key={i}
                    className="group flex items-start gap-3 bg-white rounded-2xl p-4 transition-all duration-200 cursor-pointer"
                    style={{
                      border: '1px solid var(--color-warm-border-light)',
                      boxShadow: '0 1px 4px rgba(44,26,14,0.05)',
                      animationDelay: `${i * 35}ms`,
                      opacity: importingUrl && !isImporting ? 0.5 : 1,
                    }}
                    onClick={() => !importingUrl && handleResultImport(result.url)}
                    onMouseEnter={e => {
                      if (!importingUrl) {
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(44,26,14,0.10)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(44,26,14,0.05)';
                      e.currentTarget.style.transform = '';
                    }}
                  >
                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <h4
                        className="line-clamp-1 leading-snug mb-0.5"
                        style={{
                          fontFamily: 'var(--font-editorial)',
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: 'var(--color-bark)',
                        }}
                      >
                        {result.title}
                      </h4>
                      <div className="flex items-center gap-1 mb-1">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: 'var(--color-bark-muted)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                        </svg>
                        <span
                          className="text-xs truncate"
                          style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}
                        >
                          {result.displayUrl}
                        </span>
                      </div>
                      <p
                        className="text-xs line-clamp-2 leading-relaxed"
                        style={{ color: 'var(--color-bark-mid)', fontFamily: 'var(--font-body)' }}
                      >
                        {result.snippet}
                      </p>
                    </div>

                    {/* Import button */}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); if (!importingUrl) handleResultImport(result.url); }}
                      disabled={!!importingUrl}
                      className="shrink-0 self-center flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all duration-200 disabled:opacity-50"
                      style={{
                        background: isImporting ? 'var(--color-bark-muted)' : 'var(--color-terra)',
                        fontFamily: 'var(--font-body)',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 1px 6px rgba(196,98,45,0.25)',
                      }}
                    >
                      {isImporting ? (
                        <>
                          <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
                            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Importing
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Import
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* No results */}
          {hasSearched && !searching && results.length === 0 && !searchError && (
            <div className="mt-4 text-center py-6 animate-fade-up">
              <p
                className="text-sm"
                style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}
              >
                No results found — try a different search
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── URL paste mode ── */}
      {mode === 'url' && (
        <div>
          <form onSubmit={handleUrlImport} className="relative flex items-center">
            <input
              id="recipe-url-input"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Paste a recipe URL to import…"
              disabled={importing}
              className="w-full rounded-full border bg-white text-bark placeholder-bark-muted transition-all duration-200"
              style={{
                borderColor: 'var(--color-warm-border)',
                fontFamily: 'var(--font-body)',
                fontSize: inputFs,
                padding: `${inputPy} ${inputPx}`,
                paddingRight: '9.5rem',
                boxShadow: '0 2px 16px rgba(44,26,14,0.07)',
                outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-terra)'; e.target.style.boxShadow = '0 2px 16px rgba(44,26,14,0.07), 0 0 0 3px rgba(196,98,45,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-warm-border)'; e.target.style.boxShadow = '0 2px 16px rgba(44,26,14,0.07)'; }}
            />
            <button
              type="submit"
              disabled={importing || !url.trim()}
              className="absolute right-1.5 rounded-full font-medium text-white transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--color-terra)',
                fontFamily: 'var(--font-body)',
                fontSize: btnFs,
                padding: `${btnPy} ${btnPx}`,
                boxShadow: '0 2px 8px rgba(196,98,45,0.30)',
              }}
              onMouseEnter={e => { if (!importing) e.currentTarget.style.background = 'var(--color-terra-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-terra)'; }}
            >
              {importing ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Importing
                </>
              ) : 'Import Recipe'}
            </button>
          </form>

          {/* Status messages */}
          {importing && (
            <div className="mt-3 flex items-center gap-2 justify-center" key={importMsgIdx}>
              <span className="w-1.5 h-1.5 rounded-full bg-terra animate-pulse shrink-0" />
              <p
                className="text-sm animate-msg"
                style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}
              >
                {IMPORT_MESSAGES[importMsgIdx]}
              </p>
            </div>
          )}

          {importError && !importing && (
            <p className="mt-2.5 text-sm text-center" style={{ color: '#C0392B', fontFamily: 'var(--font-body)' }}>
              {importError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
