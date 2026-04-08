import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTimer } from '../context/TimerContext';

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function FloatingTimer() {
  const { timer, start, pause, resume, dismiss } = useTimer();
  const [showInput, setShowInput] = useState(false);
  const [inputMin, setInputMin] = useState('');

  if (!timer && !showInput) {
    return createPortal(
      <button
        onClick={() => setShowInput(true)}
        className="sm:hidden fixed z-50 flex items-center justify-center rounded-full transition-all duration-200"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 76px)',
          right: '16px',
          width: '44px', height: '44px',
          background: 'var(--surface)', border: '1.5px solid var(--border-strong)',
          color: 'var(--text-muted)', boxShadow: '0 4px 14px rgba(15,12,30,0.12)',
          cursor: 'pointer',
        }}
        title="Set a timer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <polyline points="12 7 12 12 15 15"/>
        </svg>
      </button>,
      document.body
    );
  }

  if (showInput && !timer) {
    return createPortal(
      <div
        className="fixed z-50 flex items-center gap-2 rounded-2xl"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 72px)',
          left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface)', border: '1.5px solid var(--border-strong)',
          padding: '10px 14px', boxShadow: '0 8px 32px rgba(15,12,30,0.18)',
        }}
      >
        <input
          autoFocus
          type="number"
          min="1"
          max="999"
          placeholder="min"
          value={inputMin}
          onChange={e => setInputMin(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && inputMin) {
              start(parseInt(inputMin) * 60);
              setShowInput(false);
              setInputMin('');
            }
            if (e.key === 'Escape') { setShowInput(false); setInputMin(''); }
          }}
          style={{
            width: '56px', textAlign: 'center', border: 'none', outline: 'none',
            fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600,
            color: 'var(--text)', background: 'transparent',
          }}
        />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>min</span>
        <button
          onClick={() => { if (inputMin) { start(parseInt(inputMin) * 60); setShowInput(false); setInputMin(''); } }}
          style={{
            padding: '5px 12px', borderRadius: '999px', border: 'none',
            background: 'var(--accent)', color: '#fff',
            fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          Start
        </button>
        <button
          onClick={() => { setShowInput(false); setInputMin(''); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>,
      document.body
    );
  }

  if (!timer) return null;

  const pct = timer.total > 0 ? (timer.remaining / timer.total) * 100 : 0;

  return createPortal(
    <div
      className="fixed z-50 flex items-center gap-3 rounded-2xl"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom) + 72px)',
        left: '50%', transform: 'translateX(-50%)',
        background: timer.done ? 'rgba(76,175,80,0.95)' : 'var(--surface)',
        border: `1.5px solid ${timer.done ? 'rgba(76,175,80,0.5)' : 'var(--border-strong)'}`,
        padding: '10px 16px',
        boxShadow: '0 8px 32px rgba(15,12,30,0.18)',
        minWidth: '200px',
      }}
    >
      {/* Progress arc indicator */}
      <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="3"/>
          <circle cx="18" cy="18" r="15" fill="none"
            stroke={timer.done ? '#fff' : 'var(--accent)'}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 15}`}
            strokeDashoffset={`${2 * Math.PI * 15 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '18px 18px', transition: 'stroke-dashoffset 0.9s linear' }}
          />
        </svg>
        <span style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '8px', fontWeight: 700, fontFamily: 'var(--font-body)',
          color: timer.done ? '#fff' : 'var(--text)',
        }}>
          {timer.done ? '✓' : formatTime(timer.remaining)}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 700, color: timer.done ? '#fff' : 'var(--text)' }}>
          {timer.done ? 'Time\'s up!' : formatTime(timer.remaining)}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: timer.done ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
          {timer.label}
        </p>
      </div>

      {!timer.done && (
        <button
          onClick={timer.running ? pause : resume}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', flexShrink: 0 }}
        >
          {timer.running ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>
      )}

      <button
        onClick={dismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: timer.done ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', padding: '4px', flexShrink: 0 }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>,
    document.body
  );
}
