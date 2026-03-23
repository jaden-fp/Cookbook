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
      <form onSubmit={handleUrlImport} className="relative flex items-stretch overflow-hidden"
        style={{
          borderRadius: '999px',
          border: focused ? '1.5px solid var(--caramel)' : '1.5px solid var(--bone)',
          boxShadow: focused ? '0 0 0 3px rgba(196,114,42,0.12)' : 'var(--shadow-sm)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          background: 'white',
        }}
      >
        <input
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
            color: 'var(--espresso)',
            padding: '0.75rem 1.25rem',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <button
          type="submit"
          disabled={importing || !url.trim()}
          className="text-white transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          style={{
            background: 'var(--caramel)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '0.875rem',
            padding: '0 1.5rem',
            borderRadius: '999px',
            margin: '4px',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={e => { if (!importing && url.trim()) e.currentTarget.style.background = '#A85E22'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--caramel)'; }}
        >
          {importing ? (
            <>
              <span className="import-dots shrink-0"><span /><span /><span /></span>
              Importing
            </>
          ) : 'Import Recipe'}
        </button>
      </form>

      {importing && (
        <div className="mt-3 flex items-center gap-2 justify-center" key={importMsgIdx}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: 'var(--caramel)' }} />
          <p className="text-sm animate-msg" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
            {IMPORT_MESSAGES[importMsgIdx]}
          </p>
        </div>
      )}

      {importError && !importing && (
        <p className="mt-2.5 text-sm text-center" style={{ color: '#B94040', fontFamily: 'var(--font-body)' }}>
          {importError}
        </p>
      )}
    </div>
  );
}
