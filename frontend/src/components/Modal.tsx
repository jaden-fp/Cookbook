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
      style={{ background: 'rgba(44,26,14,0.45)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-[20px] bg-cream animate-scale-in"
        style={{
          border: '1px solid var(--color-warm-border-light)',
          boxShadow: '0 20px 60px rgba(44,26,14,0.20), 0 8px 20px rgba(44,26,14,0.10)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--color-warm-border-light)' }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-editorial)',
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--color-bark)',
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-bark-muted hover:bg-cream-dark hover:text-bark transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
