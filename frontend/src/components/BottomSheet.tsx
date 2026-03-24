import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const isMobile = window.matchMedia('(max-width: 639px)').matches;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 animate-fade-in"
      style={{ background: 'rgba(15,12,30,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {isMobile ? (
        /* Mobile: slide up from bottom */
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--surface)',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            boxShadow: 'var(--shadow-xl)',
            animation: 'slideUp 0.3s ease-out both',
            paddingBottom: 'env(safe-area-inset-bottom)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '4px' }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border-strong)' }} />
          </div>

          {title && (
            <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text)', letterSpacing: '-0.01em' }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ color: 'var(--text-muted)', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l10 10M11 1L1 11"/>
                </svg>
              </button>
            </div>
          )}

          <div className="px-6 py-5">
            {children}
          </div>
        </div>
      ) : (
        /* Desktop: centered modal */
        <div
          className="flex items-center justify-center p-4 min-h-full"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <div
            className="w-full max-w-xs animate-scale-in"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.375rem', color: 'var(--text)', letterSpacing: '-0.01em' }}>
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150"
                  style={{ color: 'var(--text-muted)', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 1l10 10M11 1L1 11"/>
                  </svg>
                </button>
              </div>
            )}
            <div className="px-6 py-5">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
