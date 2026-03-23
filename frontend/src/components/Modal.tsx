import { useEffect } from 'react';

interface Props {
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

export default function Modal({ onClose, children, title }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      style={{ background: 'rgba(26,10,4,0.45)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md animate-scale-in flex flex-col"
        style={{
          maxHeight: 'calc(100vh - 2rem)',
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--bone)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--cream-deep)' }}
        >
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.375rem',
            fontWeight: 600,
            color: 'var(--espresso)',
            letterSpacing: '-0.01em',
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 text-lg leading-none"
            style={{ color: 'var(--muted)', border: 'none', background: 'transparent', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream-deep)'; e.currentTarget.style.color = 'var(--espresso)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
