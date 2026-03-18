import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { importRecipe } from '../api';

const IMPORT_MESSAGES = [
  'Fetching recipe page…',
  'Extracting ingredients…',
  'Parsing instructions…',
  'Saving to your cookbook…',
];

interface Props {
  onSuccess?: () => void;
}

export default function ImportBar({ onSuccess }: Props) {
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsgIdx, setImportMsgIdx] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

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

  return (
    <div className="w-full">
      <form
        onSubmit={handleUrlImport}
        className="relative flex items-stretch overflow-hidden"
        style={{
          borderRadius: '999px',
          border: focused ? '1.5px solid #C91686' : '1.5px solid #FFC3E8',
          boxShadow: focused ? '0 0 0 3px rgba(201,22,134,0.12)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          background: 'white',
        }}
      >
        <input
          id="recipe-url-input"
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste a recipe URL to import…"
          disabled={importing}
          className="flex-1 bg-transparent"
          style={{
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
            fontWeight: 400,
            color: '#512A18',
            padding: '0.6875rem 1.125rem',
            borderRadius: '999px 0 0 999px',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <button
          type="submit"
          disabled={importing || !url.trim()}
          className="text-white transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          style={{
            background: '#C91686',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '0.875rem',
            padding: '0 1.375rem',
            borderRadius: '999px',
            margin: '3px',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { if (!importing && url.trim()) e.currentTarget.style.background = '#A8117A'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#C91686'; }}
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

      {importing && (
        <div className="mt-3 flex items-center gap-2 justify-center" key={importMsgIdx}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: '#C91686' }} />
          <p
            className="text-sm animate-msg"
            style={{ color: 'rgba(81,42,24,0.55)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}
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
  );
}
