import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { importRecipe } from '../api';
import RecipeImportLoader from './RecipeImportLoader';

const IMPORT_MESSAGES = [
  'Whisking up your link…',
  'Just a batter of time...',
  "We're baking it happen!",
  'Good things come to those who bake!',
  'Proofing your request...',
  'Please don\'t dessert us.',
  'Rising to the occasion!',
  'Accepting all cookies...',
  'Taking a mega-bite...',
  'Preheating the servers...',
  'Taking this to the next layer...',
  'This is going to be a piece of cake.',
  'Getting a little hot in here...',
  'Frosting the details...',
  "Any way you slice it, it's almost done!",
  'I knead you to wait...',
  "Butter believe it's loading!",
  'Bake it till you make it.',
  "Let's get ready to crumble.",
  'Whisk me away!',
  'Muffin compares to this wait.',
  'I loaf you for being patient.',
  'History in the baking.',
  "Don't go breaking my tart.",
  'Bready or not, here I crumb!',
  'Life is what you bake it.',
  "I'm on a roll. A cinnamon roll!",
  "Doughn't worry, it's coming.",
  'This is the yeast I could do.',
  "You're the icing on the cake.",
  'Sweet things take time.',
  'Sugar-coating the loading bar...',
  'Sifting through the files...',
  "You're the zest!",
  'Holy crepe, it\'s almost done!',
  'Donut close the app!',
  'Please stand pie...',
  'Whisk-y business ahead...',
  'Hold your croissants!',
  'Rolling out the red velvet...',
  'Choux-ing away the bugs...',
  'Baking sure everything is perfect!',
  'This loading screen is half-baked.',
  'Whipping it into shape...',
  'Piping the final pixels...',
  'Baking the internet great again...',
  'Oh my ganache, just a few more seconds...',
  'Brownie points for your patience!',
  'Muffin to see here, just loading...',
  'Gathering the final crumbs...',
  'Oh fudge, still processing.',
  'Baking the world a batter place.',
  'Challah at me when it\'s done!',
  'Torte-ly worth the wait!',
  'Piping hot content coming right up!',
  "We're preheating the servers to 350 degrees, please stand pie.",
  'Whipping the data together until it forms stiff peaks.',
  "Don't close the app, or your data soufflé might collapse!",
  'Letting the dough rise so your content is perfectly fluffy.',
  "We promise this wait will be a lot better than getting a soggy bottom!",
  "We're currently stuck in a sticky bun situation, please hold.",
  'Beating the butter and sugar together until light, fluffy, and fully downloaded.',
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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const navigate = useNavigate();
  const importIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (importing) {
      setImportMsgIdx(Math.floor(Math.random() * IMPORT_MESSAGES.length));
      importIntervalRef.current = setInterval(() => {
        setImportMsgIdx(() => Math.floor(Math.random() * IMPORT_MESSAGES.length));
      }, 2500);
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
    <>
    {importing && <RecipeImportLoader url={url} />}
    <div className="w-full">
      <form onSubmit={handleUrlImport} className="relative flex items-stretch overflow-hidden"
        style={{
          borderRadius: '999px',
          border: focused ? '1.5px solid var(--accent)' : '1.5px solid var(--border-strong)',
          boxShadow: focused ? `0 0 0 3px var(--accent-dim), var(--shadow-md)` : 'var(--shadow-sm)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          background: 'var(--surface)',
        }}
      >
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={isMobile ? 'Paste a recipe URL…' : 'Paste a recipe URL to import…'}
          disabled={importing}
          className="flex-1 bg-transparent"
          style={{
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
            fontWeight: 400,
            color: 'var(--text)',
            padding: '0.75rem 1.25rem',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <button
          type="submit"
          disabled={importing || !url.trim()}
          className="transition-all duration-200 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{
            background: 'var(--accent)',
            color: '#FFFFFF',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '0.875rem',
            padding: '0 1.5rem',
            borderRadius: '999px',
            margin: '4px',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0',
          }}
          onMouseEnter={e => { if (!importing && url.trim()) e.currentTarget.style.background = '#D94E7A'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
        >
          {importing ? (
            <>
              <span className="import-dots shrink-0"><span /><span /><span /></span>
              Importing
            </>
          ) : <><span className="hidden sm:inline">Import Recipe</span><span className="sm:hidden">Import</span></>}
        </button>
      </form>

      <div style={{ minHeight: '20px', marginTop: '4px' }}>
        {importing && (
          <div className="flex items-center gap-2 justify-center" key={importMsgIdx}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
            <p className="text-sm animate-msg" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
              {IMPORT_MESSAGES[importMsgIdx]}
            </p>
          </div>
        )}
        {importError && !importing && (
          <p className="text-sm text-center" style={{ color: 'var(--danger)', fontFamily: 'var(--font-body)' }}>
            {importError}
          </p>
        )}
      </div>
    </div>
    </>
  );
}
