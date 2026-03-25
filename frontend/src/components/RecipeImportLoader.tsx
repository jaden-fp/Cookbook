import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const PUNS = [
  // Warming up
  "Warming up the oven (and the server)…",
  "Gathering the finest ingredients for you!",
  "Trying not to get our dough in a knot…",
  "Preheating to your exact specifications…",
  "Cracking some eggs to get things started!",
  // In progress
  "Kneading your request into shape!",
  "Don't get salty — we're almost there!",
  "Whipping this into peak perfection…",
  "Measuring up to your high standards…",
  "Letting it rest (it's a yeast thing)…",
  "Hope this doesn't go against the grain!",
  "Folding in the details ever so gently…",
  "Patience is the secret ingredient. Trust.",
  "Our servers are really on a roll right now.",
  "Mixing things up so you don't have to!",
  "Sifting through approximately 1,000 tabs…",
  "This one is really proving itself!",
  "We'd never half-bake a response. Ever.",
  "Getting our pie-charts in order…",
  "Butter believe this is worth the wait.",
  "Shortbread notice, but we're hustling!",
  "Getting a little glaze-y with the details…",
  "Sugar, we promise it'll be worth it.",
  "Trying to rise to your occasion…",
  // Finishing
  "Frosting the final details just for you!",
  "About to plate this — no soggy bottom here!",
  "The crumb structure on this one… *chef's kiss*",
  "Adding the sprinkles… almost there!",
  "Ready to reveal what we've been cookie-ing up!",
  // Silly
  "I'm not a regular baker, I'm a COOL baker.",
  "We're on a roll — a cinnamon roll, specifically.",
  "Brioche we could move faster, we really would!",
  "Our data's a little flaky but we're pulling it together!",
];

// Stage timing in ms
const STAGE_TIMES = [0, 3500, 7000, 10500];

interface Props { url?: string; }

export default function RecipeImportLoader({ url }: Props) {
  const [punIndex, setPunIndex] = useState(() => Math.floor(Math.random() * PUNS.length));
  const [punVisible, setPunVisible] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - start), 80);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setPunVisible(false);
      setTimeout(() => {
        setPunIndex(i => (i + 1) % PUNS.length);
        setPunVisible(true);
      }, 350);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const stage = STAGE_TIMES.reduce((acc, t) => (elapsed >= t ? acc + 1 : acc), -1);
  // stage: 0=prep, 1=mixing, 2=baking, 3=decorating

  return createPortal(
    <>
      <style>{`
        @keyframes ri-fadein  { from { opacity:0; } to { opacity:1; } }
        @keyframes ri-slideup { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ri-bouncein {
          0%   { opacity:0; transform:scale(0.35) translateY(16px); }
          65%  { transform:scale(1.08) translateY(-4px); }
          100% { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes ri-float  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-9px); } }
        @keyframes ri-shake  { 0%,100% { transform:rotate(-7deg) translateY(0); } 50% { transform:rotate(7deg) translateY(-4px); } }
        @keyframes ri-spin   { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes ri-pulse  { 0%,100% { transform:scale(1); } 50% { transform:scale(1.1); } }
        @keyframes ri-sparkle { 0%,100% { opacity:0; transform:scale(0) rotate(0deg); } 50% { opacity:1; transform:scale(1) rotate(20deg); } }
        @keyframes ri-drip   { from { transform:scaleY(0); transform-origin:top; } to { transform:scaleY(1); } }
        @keyframes ri-particle {
          0%   { transform:translateY(0) scale(1);   opacity:0; }
          12%  { opacity:1; }
          88%  { opacity:.4; }
          100% { transform:translateY(-100px) scale(.3); opacity:0; }
        }
        @keyframes ri-heat {
          0%,100% { transform:scaleY(1) skewX(0deg); opacity:.55; }
          50%     { transform:scaleY(1.18) skewX(4deg); opacity:1; }
        }
        @keyframes ri-layerin {
          from { opacity:0; transform:translateY(24px) scaleX(.85); }
          to   { opacity:1; transform:translateY(0) scaleX(1); }
        }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998]"
        style={{ background: 'rgba(15,12,30,0.42)', backdropFilter: 'blur(8px)', animation: 'ri-fadein 0.3s ease' }}
      />

      {/* Card */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5" style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'var(--surface)',
          borderRadius: '28px',
          border: '1.5px solid var(--border-strong)',
          boxShadow: '0 32px 80px rgba(15,12,30,0.22)',
          padding: '40px 36px 36px',
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          position: 'relative',
          overflow: 'hidden',
          pointerEvents: 'auto',
          animation: 'ri-bouncein 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>

          {/* Floating particles */}
          {['✦','✿','·','♡','✦','✿','·','♡'].map((ch, i) => (
            <span key={i} aria-hidden style={{
              position: 'absolute',
              left: `${5 + i * 12}%`,
              bottom: `${8 + (i % 4) * 7}%`,
              fontSize: i % 2 === 0 ? '0.65rem' : '0.38rem',
              color: 'var(--accent)',
              opacity: 0,
              animation: `ri-particle ${3 + i * 0.45}s ease-in infinite`,
              animationDelay: `${i * 0.65}s`,
              pointerEvents: 'none',
            }}>{ch}</span>
          ))}

          {/* ── ANIMATION STAGE AREA ───────────────────────────── */}
          <div style={{ height: '170px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>

            {/* STAGE 0 — Ingredients prep */}
            {stage === 0 && (
              <div key="s0" style={{ display: 'flex', gap: '14px', alignItems: 'flex-end' }}>
                {[
                  { e: '🥣', size: '4rem',  delay: 0 },
                  { e: '🥚', size: '2.5rem', delay: 180 },
                  { e: '🧈', size: '2.5rem', delay: 360 },
                  { e: '🫙', size: '2.25rem', delay: 540 },
                ].map(({ e, size, delay }, i) => (
                  <span key={i} style={{
                    fontSize: size,
                    display: 'block',
                    animation: `ri-bouncein 0.55s ${delay}ms both, ri-float ${2.2 + i * 0.28}s ${delay + 600}ms ease-in-out infinite`,
                  }}>{e}</span>
                ))}
              </div>
            )}

            {/* STAGE 1 — Mixing */}
            {stage === 1 && (
              <div key="s1" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{
                  fontSize: '5.5rem',
                  display: 'block',
                  animation: 'ri-bouncein 0.5s both, ri-shake 0.4s ease-in-out infinite',
                }}>🥣</span>
                <span style={{
                  position: 'absolute', right: '-18px', top: '-12px',
                  fontSize: '2.25rem',
                  animation: 'ri-bouncein 0.5s 150ms both, ri-spin 0.7s linear infinite',
                }}>🥄</span>
                {/* Batter bubbles */}
                {['💧','🫧','💧','🫧'].map((ch, i) => (
                  <span key={i} style={{
                    position: 'absolute',
                    top: `${-14 + (i % 2) * 20}px`,
                    left: `${-20 + i * 18}px`,
                    fontSize: '1.1rem',
                    opacity: 0,
                    animation: `ri-particle ${1.4 + i * 0.3}s ${i * 0.45}s ease-in infinite`,
                  }}>{ch}</span>
                ))}
              </div>
            )}

            {/* STAGE 2 — Baking */}
            {stage === 2 && (
              <div key="s2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                {/* Heat waves */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', height: '28px' }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{
                      width: '5px',
                      height: `${16 + (i % 2) * 10}px`,
                      background: `linear-gradient(to top, #FF6B35, #FFD166, transparent)`,
                      borderRadius: '3px',
                      animation: `ri-heat ${0.9 + i * 0.15}s ${i * 0.18}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
                <span style={{
                  fontSize: '5.5rem', lineHeight: 1,
                  animation: 'ri-bouncein 0.5s both, ri-pulse 1.8s ease-in-out infinite',
                }}>🔥</span>
                <div style={{ display: 'flex', gap: '10px', animation: 'ri-slideup 0.5s 300ms both' }}>
                  <span style={{ fontSize: '2rem' }}>⏲️</span>
                  <span style={{ fontSize: '2rem', animation: 'ri-float 2s 0.4s ease-in-out infinite' }}>🌡️</span>
                </div>
              </div>
            )}

            {/* STAGE 3 — Finished decorated cake */}
            {stage >= 3 && (
              <div key="s3" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {/* Celebration sparkles */}
                <div style={{ position: 'absolute', top: '-8px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 8px', animation: 'ri-bouncein 0.5s 1s both' }}>
                  {['✨','🎊','✨'].map((s, i) => (
                    <span key={i} style={{ fontSize: '1.4rem', animation: `ri-float ${1.2 + i * 0.3}s ${i * 0.2}s ease-in-out infinite` }}>{s}</span>
                  ))}
                </div>

                {/* Candles */}
                <div style={{ display: 'flex', gap: '14px', marginBottom: '2px', animation: 'ri-layerin 0.45s 850ms both' }}>
                  {['🕯️','🕯️','🕯️'].map((c, i) => (
                    <span key={i} style={{ fontSize: '1.25rem', animation: `ri-float ${1.4 + i * 0.2}s ${i * 0.15}s ease-in-out infinite` }}>{c}</span>
                  ))}
                </div>

                {/* Decoration row */}
                <div style={{ display: 'flex', gap: '5px', marginBottom: '3px', animation: 'ri-layerin 0.4s 700ms both' }}>
                  {['✦','🌸','✦','🌸','✦'].map((d, i) => (
                    <span key={i} style={{
                      fontSize: '0.85rem',
                      color: i % 2 === 0 ? '#F46696' : undefined,
                      animation: `ri-sparkle ${1 + i * 0.18}s ${i * 0.12}s ease-in-out infinite`,
                    }}>{d}</span>
                  ))}
                </div>

                {/* Frosting swirl top */}
                <div style={{
                  width: '150px', height: '14px',
                  background: 'linear-gradient(90deg, #FFD6E7, #fff, #FFD6E7)',
                  borderRadius: '10px 10px 0 0',
                  boxShadow: '0 -2px 8px rgba(244,102,150,0.3)',
                  animation: 'ri-layerin 0.4s 600ms both',
                }} />
                {/* Top cake layer */}
                <div style={{
                  width: '148px', height: '28px',
                  background: 'linear-gradient(180deg, #F7D070 0%, #E8A830 100%)',
                  boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.35)',
                  animation: 'ri-layerin 0.4s 500ms both',
                }} />
                {/* Frosting middle */}
                <div style={{
                  width: '158px', height: '12px',
                  background: 'linear-gradient(90deg, #FFD6E7, #fff9, #FFD6E7)',
                  boxShadow: '0 3px 10px rgba(244,102,150,0.28)',
                  animation: 'ri-layerin 0.4s 380ms both',
                }} />
                {/* Middle cake layer */}
                <div style={{
                  width: '155px', height: '30px',
                  background: 'linear-gradient(180deg, #E8A830 0%, #C47820 100%)',
                  boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.2)',
                  animation: 'ri-layerin 0.4s 240ms both',
                }} />
                {/* Frosting bottom */}
                <div style={{
                  width: '165px', height: '12px',
                  background: 'linear-gradient(90deg, #FFD6E7, #fff9, #FFD6E7)',
                  boxShadow: '0 3px 10px rgba(244,102,150,0.28)',
                  animation: 'ri-layerin 0.4s 140ms both',
                }} />
                {/* Bottom cake layer */}
                <div style={{
                  width: '162px', height: '34px',
                  background: 'linear-gradient(180deg, #F7D070 0%, #D4892A 100%)',
                  borderRadius: '0 0 4px 4px',
                  boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.25)',
                  animation: 'ri-layerin 0.4s 60ms both',
                }} />
                {/* Pink cake board */}
                <div style={{
                  width: '178px', height: '8px',
                  background: 'linear-gradient(90deg, #D94E7A, #F46696, #D94E7A)',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(244,102,150,0.4)',
                  animation: 'ri-layerin 0.4s both',
                }} />
              </div>
            )}
          </div>

          {/* ── PUN TEXT ───────────────────────────────────────── */}
          <div style={{ textAlign: 'center', padding: '0 0.5rem' }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.2rem, 4vw, 1.625rem)',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              marginBottom: '8px',
              opacity: punVisible ? 1 : 0,
              transform: punVisible ? 'translateY(0)' : 'translateY(-6px)',
              transition: 'opacity 0.32s ease, transform 0.32s ease',
            }}>
              {PUNS[punIndex]}
            </p>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}>
              Fetching your recipe
            </p>
            {url && (
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.625rem',
                color: 'var(--text-muted)',
                marginTop: '5px',
                opacity: 0.45,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '300px',
              }}>{url}</p>
            )}
          </div>

          {/* ── STAGE PROGRESS DOTS ────────────────────────────── */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {['🥣','🌀','🔥','🎂'].map((icon, i) => (
              <div key={i} title={['Prep','Mixing','Baking','Done!'][i]} style={{
                height: '7px',
                width: i === stage ? '26px' : '7px',
                borderRadius: '99px',
                background: i < stage
                  ? 'var(--accent)'
                  : i === stage
                  ? 'linear-gradient(90deg, var(--accent), #D94E7A)'
                  : 'var(--border-strong)',
                transition: 'all 0.45s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: i === stage ? '0 2px 8px var(--accent-glow)' : 'none',
              }} />
            ))}
          </div>

        </div>
      </div>
    </>,
    document.body
  );
}
