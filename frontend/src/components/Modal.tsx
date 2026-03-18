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
      style={{ background: 'rgba(81,42,24,0.4)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white animate-scale-in"
        style={{
          border: '1px solid #FFC3E8',
          boxShadow: '0 20px 60px rgba(81,42,24,0.15), 0 8px 20px rgba(81,42,24,0.08)',
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #FFC3E8' }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.0625rem',
              fontWeight: 700,
              color: '#512A18',
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-xl leading-none"
            style={{ color: 'rgba(81,42,24,0.55)' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF0F8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            ×
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
