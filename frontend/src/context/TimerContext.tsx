import { createContext, useContext, useState, useEffect, useRef } from 'react';

interface TimerState {
  label: string;
  total: number;
  remaining: number;
  running: boolean;
  done: boolean;
}

interface TimerContextValue {
  timer: TimerState | null;
  start: (seconds: number, label?: string) => void;
  pause: () => void;
  resume: () => void;
  dismiss: () => void;
}

const TimerContext = createContext<TimerContextValue>({
  timer: null,
  start: () => {},
  pause: () => {},
  resume: () => {},
  dismiss: () => {},
});

export function useTimer() { return useContext(TimerContext); }

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(); osc.stop(ctx.currentTime + 0.6);
  } catch {}
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timer, setTimer] = useState<TimerState | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!timer?.running) return;
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (!t) return null;
        const next = t.remaining - 1;
        if (next <= 0) {
          clearInterval(intervalRef.current!);
          playBeep();
          if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
          return { ...t, remaining: 0, running: false, done: true };
        }
        return { ...t, remaining: next };
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [timer?.running]);

  function start(seconds: number, label = 'Timer') {
    clearInterval(intervalRef.current!);
    setTimer({ label, total: seconds, remaining: seconds, running: true, done: false });
  }

  function pause() {
    setTimer(t => t ? { ...t, running: false } : t);
  }

  function resume() {
    setTimer(t => t && t.remaining > 0 ? { ...t, running: true, done: false } : t);
  }

  function dismiss() {
    clearInterval(intervalRef.current!);
    setTimer(null);
  }

  return (
    <TimerContext.Provider value={{ timer, start, pause, resume, dismiss }}>
      {children}
    </TimerContext.Provider>
  );
}
