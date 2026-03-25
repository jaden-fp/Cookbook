import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Recipe } from '../types';

// ── Timer detection ────────────────────────────────────────────────────────

interface DetectedTimer {
  label: string;
  seconds: number;
}

function detectTimers(text: string): DetectedTimer[] {
  const results: DetectedTimer[] = [];
  const pattern = /(\d+(?:\.\d+)?)\s*(?:[-–to]+\s*(\d+(?:\.\d+)?)\s*)?(minute|min|second|sec|hour|hr)s?/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const lo = parseFloat(match[1]);
    const hi = match[2] ? parseFloat(match[2]) : lo;
    const avg = lo; // use short end of range
    const unit = match[3].toLowerCase();
    let secs = 0;
    if (unit.startsWith('sec')) secs = avg;
    else if (unit.startsWith('min')) secs = avg * 60;
    else if (unit.startsWith('hour') || unit === 'hr') secs = avg * 3600;
    if (secs >= 5) {
      const unitShort = unit.startsWith('sec') ? 'sec' : unit.startsWith('min') ? 'min' : 'hr';
      const label = match[2] ? `${lo}–${hi} ${unitShort}` : `${lo} ${unitShort}`;
      results.push({ label, seconds: Math.round(secs) });
    }
  }
  return results;
}

// ── Ingredient matching per step ───────────────────────────────────────────

function stepIngredients(step: string, recipe: Recipe): string[] {
  const stepLower = step.toLowerCase();
  const found: string[] = [];
  const SKIP = new Set(['the', 'a', 'an', 'and', 'or', 'with', 'in', 'of', 'to', 'until', 'for', 'into']);
  for (const group of recipe.ingredient_groups) {
    for (const ing of group.ingredients) {
      const parts = ing.name.toLowerCase().split(/[\s,]+/).filter(w => w.length > 2 && !SKIP.has(w));
      if (parts.some(w => stepLower.includes(w))) {
        found.push([ing.amount, ing.unit, ing.name].filter(Boolean).join(' '));
      }
    }
  }
  return found;
}

// ── Audio beep ────────────────────────────────────────────────────────────

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const pattern = [880, 0, 880, 0, 1047];
    let time = ctx.currentTime;
    for (const freq of pattern) {
      if (freq === 0) { time += 0.1; continue; }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
      osc.start(time); osc.stop(time + 0.35);
      time += 0.4;
    }
  } catch { /* not available */ }
}

function vibrate() {
  if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 400]);
}

// ── Confetti ──────────────────────────────────────────────────────────────

function Confetti() {
  const COUNT = 36;
  const colors = ['#F46696', '#FFB3CA', '#7040DC', '#00C4B4', '#E9557A', '#FFD6E5'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: COUNT }).map((_, i) => {
        const angle = (i / COUNT) * 360;
        const delay = (i % 6) * 0.08;
        const size = 6 + (i % 4) * 4;
        return (
          <div key={i} style={{
            position: 'absolute', left: '50%', top: '40%',
            width: size, height: size * 0.6,
            background: colors[i % colors.length],
            borderRadius: '2px',
            transform: `rotate(${angle}deg)`,
            animation: `confettiBurst 1.2s ${delay}s cubic-bezier(0.23,1,0.32,1) forwards`,
          }} />
        );
      })}
    </div>
  );
}

// ── Format time ───────────────────────────────────────────────────────────

function fmtTime(secs: number): string {
  if (secs >= 3600) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

// ── Component ─────────────────────────────────────────────────────────────

interface Props {
  recipe: Recipe;
  onClose: () => void;
  onRate: () => void;
}

interface TimerState {
  total: number;
  remaining: number;
  running: boolean;
  done: boolean;
}

export default function BakingMode({ recipe, onClose, onRate }: Props) {
  const steps = recipe.instructions;
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [showIngredients, setShowIngredients] = useState(true);
  const [finished, setFinished] = useState(false);
  const [stepKey, setStepKey] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const isLast = step === steps.length - 1;
  const pct = ((step + 1) / steps.length) * 100;
  const currentStep = steps[step] ?? '';
  const timers = detectTimers(currentStep);
  const relatedIngredients = stepIngredients(currentStep, recipe);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goBack();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (!timer?.running) return;
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (!t) return null;
        const next = t.remaining - 1;
        if (next <= 0) {
          clearInterval(intervalRef.current!);
          playBeep(); vibrate();
          return { ...t, remaining: 0, running: false, done: true };
        }
        return { ...t, remaining: next };
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [timer?.running]);

  useEffect(() => {
    clearInterval(intervalRef.current!);
    setTimer(null);
    setShowIngredients(true);
    setStepKey(k => k + 1);
  }, [step]);

  const goNext = useCallback(() => {
    if (isLast) { setFinished(true); return; }
    setStep(s => s + 1);
  }, [isLast]);

  const goBack = useCallback(() => {
    if (step === 0) return;
    setStep(s => s - 1);
  }, [step]);

  function startTimer(t: DetectedTimer) {
    clearInterval(intervalRef.current!);
    setTimer({ total: t.seconds, remaining: t.seconds, running: true, done: false });
  }

  function toggleTimer() {
    setTimer(t => t ? { ...t, running: !t.running } : null);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
      if (dx < 0) goNext(); else goBack();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  // ── Finish screen ──────────────────────────────────────────────────────

  if (finished) {
    return createPortal(
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <style>{`
          @keyframes confettiBurst {
            0%   { opacity: 1; transform: rotate(var(--r,0deg)) translate(0,0) scale(1); }
            100% { opacity: 0; transform: rotate(var(--r,0deg)) translate(var(--tx,120px),var(--ty,-160px)) scale(0.4); }
          }
          @keyframes popIn {
            0%   { transform: scale(0.7); opacity: 0; }
            70%  { transform: scale(1.05); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
        <div className="relative flex flex-col items-center text-center px-8" style={{ animation: 'popIn 0.6s ease both' }}>
          <Confetti />
          <div style={{ fontSize: '5rem', marginBottom: '24px', filter: 'drop-shadow(0 0 24px rgba(244,102,150,0.4))' }}>
            🎉
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 6vw, 3rem)',
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: '10px',
          }}>
            Batch Complete!
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.0625rem',
            color: 'var(--text-muted)',
            marginBottom: '36px',
            maxWidth: '300px',
            lineHeight: 1.6,
          }}>
            {recipe.title} is ready. How did it turn out?
          </p>

          <div className="flex flex-col gap-3 w-full" style={{ maxWidth: '320px' }}>
            <button
              onClick={() => { onClose(); onRate(); }}
              className="w-full py-4 font-semibold text-white transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, var(--accent), #D94E7A)',
                borderRadius: '16px', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '1rem',
                letterSpacing: '-0.01em',
                boxShadow: '0 6px 24px var(--accent-glow)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
            >
              Rate This Bake ★
            </button>

            {recipe.source_url && (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 text-center font-semibold transition-all duration-200"
                style={{
                  color: 'var(--text)',
                  background: 'var(--surface)',
                  borderRadius: '16px',
                  border: '1.5px solid var(--border-strong)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  textDecoration: 'none',
                  display: 'block',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text)'; }}
              >
                Share Original Recipe ↗
              </a>
            )}

            <button
              onClick={onClose}
              style={{
                color: 'var(--text-muted)', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.875rem', padding: '8px',
              }}
            >
              Back to Recipe
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  // ── Main screen ────────────────────────────────────────────────────────

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'var(--bg)', touchAction: 'none' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes timerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Progress bar */}
      <div style={{ height: '3px', background: 'var(--border)', flexShrink: 0 }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, var(--accent), #D94E7A)',
          transition: 'width 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 shrink-0"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 14px)',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: '0.6875rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)',
        }}>
          Start Baking
        </span>

        <span style={{
          fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
          fontWeight: 600, color: 'var(--text-muted)',
        }}>
          {step + 1} / {steps.length}
        </span>

        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-full transition-all duration-150"
          style={{
            width: '2.25rem', height: '2.25rem',
            background: 'var(--bg-subtle)',
            border: '1.5px solid var(--border-strong)',
            color: 'var(--text-muted)', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1l10 10M11 1L1 11"/>
          </svg>
        </button>
      </div>

      {/* Step label */}
      <div className="px-6 pt-5 pb-2 shrink-0">
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '0.6875rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)',
        }}>
          Step {step + 1}
        </p>
      </div>

      {/* Step text + extras — scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pb-4" style={{ touchAction: 'pan-y' }}>
        <p
          key={stepKey}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.375rem, 4.5vw, 2rem)',
            fontWeight: 600,
            color: 'var(--text)',
            lineHeight: 1.5,
            letterSpacing: '-0.02em',
            animation: 'stepIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          {currentStep}
        </p>

        {/* Timer buttons */}
        {timers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {timers.map((t, i) => {
              const isActive = timer !== null;
              const isDone = timer?.done;
              return (
                <button
                  key={i}
                  onClick={() => { if (isActive && !isDone) toggleTimer(); else startTimer(t); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-200"
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600,
                    color: isDone ? '#3DAD6B' : 'var(--accent)',
                    background: isDone ? 'rgba(61,173,107,0.08)' : 'var(--accent-dim)',
                    border: `1.5px solid ${isDone ? 'rgba(61,173,107,0.35)' : 'rgba(244,102,150,0.3)'}`,
                    cursor: 'pointer',
                    animation: isActive && timer?.running && !isDone ? 'timerPulse 1.5s ease-in-out infinite' : 'none',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {isDone
                    ? '✓ Done!'
                    : isActive && timer?.running
                    ? fmtTime(timer!.remaining)
                    : isActive && !timer?.running
                    ? `Paused — ${fmtTime(timer!.remaining)}`
                    : `${t.label} timer`}
                </button>
              );
            })}
          </div>
        )}

        {/* Ingredients for this step */}
        {relatedIngredients.length > 0 && (
          <div className="mt-5">
            <button
              onClick={() => setShowIngredients(v => !v)}
              className="flex items-center gap-1.5 mb-3"
              style={{
                fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: showIngredients ? 'var(--accent)' : 'var(--text-muted)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                transition: 'color 0.15s ease',
              }}
            >
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: showIngredients ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
              >
                <path d="M2 3.5l3 3 3-3"/>
              </svg>
              Ingredients ({relatedIngredients.length})
            </button>

            {showIngredients && (
              <div
                className="rounded-2xl p-4 space-y-2"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {relatedIngredients.map((ing, i) => (
                  <div key={i} className="flex items-baseline gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ background: 'var(--accent)' }} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--text)', lineHeight: 1.5 }}>
                      {ing}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-1.5 py-3 shrink-0">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            style={{
              width: i === step ? '20px' : '6px',
              height: '6px',
              borderRadius: '99px',
              background: i === step ? 'var(--accent)' : i < step ? 'rgba(244,102,150,0.4)' : 'var(--border-strong)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          />
        ))}
      </div>

      {/* Bottom nav */}
      <div
        className="flex gap-3 px-5 shrink-0"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
          paddingTop: '12px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <button
          onClick={goBack}
          disabled={step === 0}
          className="flex items-center justify-center rounded-2xl transition-all duration-200"
          style={{
            width: '56px', height: '64px',
            background: step === 0 ? 'var(--bg-subtle)' : 'var(--surface)',
            border: `1.5px solid ${step === 0 ? 'var(--border)' : 'var(--border-strong)'}`,
            color: step === 0 ? 'var(--border-strong)' : 'var(--text-muted)',
            cursor: step === 0 ? 'default' : 'pointer',
            flexShrink: 0,
          }}
          onMouseEnter={e => { if (step > 0) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)'; } }}
          onMouseLeave={e => { if (step > 0) { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--surface)'; } }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <button
          onClick={goNext}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200"
          style={{
            height: '64px',
            background: isLast
              ? 'linear-gradient(135deg, #3DAD6B, #2E8B57)'
              : 'linear-gradient(135deg, var(--accent), #D94E7A)',
            border: 'none', color: 'white', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: '1.0625rem', letterSpacing: '-0.01em',
            boxShadow: isLast ? '0 4px 20px rgba(61,173,107,0.35)' : '0 4px 20px var(--accent-glow)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
        >
          {isLast ? (
            <>All Done! <span style={{ fontSize: '1.125rem' }}>🎉</span></>
          ) : (
            <>
              Next Step
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </>
          )}
        </button>
      </div>
    </div>,
    document.body,
  );
}
