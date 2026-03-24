import { useFAB } from '../context/FABContext';

export default function FAB() {
  const { action } = useFAB();

  if (!action) return null;

  return (
    <button
      onClick={action}
      className="sm:hidden fixed z-40"
      style={{
        bottom: 'calc(56px + env(safe-area-inset-bottom) + 16px)',
        right: '20px',
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        background: 'var(--accent)',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-lg)',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      aria-label="Add"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>
  );
}
