import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const PUNS = [
  "Warming up the oven (and the server)…",
  "Gathering the finest ingredients for you!",
  "Trying not to get our dough in a knot…",
  "Preheating to your exact specifications…",
  "Cracking some eggs to get things started!",
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
  "Frosting the final details just for you!",
  "About to plate this — no soggy bottom here!",
  "The crumb structure on this one… *chef's kiss*",
  "Adding the sprinkles… almost there!",
  "Ready to reveal what we've been cookie-ing up!",
  "I'm not a regular baker, I'm a COOL baker.",
  "We're on a roll — a cinnamon roll, specifically.",
  "Brioche we could move faster, we really would!",
  "Our data's a little flaky but we're pulling it together!",
];

const SPRINKLES: Array<{ x: number; y: number; color: string; angle: number; delay: number }> = [
  { x: 64,  y: 70, color: '#F46696', angle: 35,  delay: 0   },
  { x: 80,  y: 63, color: '#7040DC', angle: -20, delay: 60  },
  { x: 96,  y: 71, color: '#00C4B4', angle: 55,  delay: 120 },
  { x: 111, y: 64, color: '#F7D070', angle: -40, delay: 80  },
  { x: 124, y: 69, color: '#F46696', angle: 15,  delay: 150 },
  { x: 140, y: 63, color: '#7040DC', angle: -60, delay: 40  },
  { x: 72,  y: 74, color: '#00C4B4', angle: 75,  delay: 200 },
  { x: 100, y: 73, color: '#FF6B9D', angle: -25, delay: 100 },
  { x: 118, y: 74, color: '#F7D070', angle: 50,  delay: 160 },
  { x: 87,  y: 67, color: '#F46696', angle: -10, delay: 220 },
  { x: 133, y: 72, color: '#00C4B4', angle: 40,  delay: 70  },
  { x: 57,  y: 72, color: '#F7D070', angle: -55, delay: 130 },
];

const KEYFRAMES = `
  @keyframes ri-fadein {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes ri-bouncein {
    0%   { opacity: 0; transform: scale(0.35) translateY(16px); }
    65%  { transform: scale(1.08) translateY(-4px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes ri-bowl-stir {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes ri-batter-wobble {
    0%, 100% { transform: scaleX(1)    scaleY(1);    }
    25%      { transform: scaleX(1.04) scaleY(0.93); }
    75%      { transform: scaleX(0.96) scaleY(1.07); }
  }
  @keyframes ri-layer-in {
    0%   { opacity: 0; transform: translateY(30px) scaleX(0.88); }
    55%  { transform: translateY(-5px) scaleX(1.02); }
    75%  { transform: translateY(3px)  scaleX(0.99); }
    100% { opacity: 1; transform: translateY(0)     scaleX(1);   }
  }
  @keyframes ri-frosting-pop {
    0%   { opacity: 0; transform: scaleY(0)   scaleX(0.85); }
    65%  { transform: scaleY(1.1)  scaleX(1.03); }
    100% { opacity: 1; transform: scaleY(1)   scaleX(1);    }
  }
  @keyframes ri-frosting-draw {
    from { stroke-dashoffset: 120; opacity: 0.4; }
    to   { stroke-dashoffset: 0;   opacity: 1;   }
  }
  @keyframes ri-sprinkle-pop {
    0%   { opacity: 0; transform: scale(0)    rotate(-45deg); }
    60%  { transform: scale(1.35) rotate(10deg);  }
    100% { opacity: 1; transform: scale(1)    rotate(0deg);   }
  }
  @keyframes ri-float {
    0%, 100% { transform: translateY(0);   }
    50%      { transform: translateY(-7px); }
  }
  @keyframes ri-particle {
    0%   { transform: translateY(0) scale(1);       opacity: 0;    }
    12%  { opacity: 0.65; }
    88%  { opacity: 0.3;  }
    100% { transform: translateY(-90px) scale(0.3); opacity: 0;    }
  }
`;

// ─── Mixing Bowl ──────────────────────────────────────────────────────────────

function MixingBowl() {
  return (
    <svg viewBox="0 0 200 175" width="210" height="184" overflow="visible" aria-hidden="true">
      <defs>
        <linearGradient id="ril-bowl-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FDF6EE" />
          <stop offset="100%" stopColor="#EDD9BC" />
        </linearGradient>
        <linearGradient id="ril-batter" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#F9E09A" />
          <stop offset="100%" stopColor="#E8C060" />
        </linearGradient>
        <linearGradient id="ril-bowl-base" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#E8C898" />
          <stop offset="100%" stopColor="#D4A870" />
        </linearGradient>
      </defs>

      {/* Bowl body */}
      <path
        d="M 32,65 Q 18,152 100,164 Q 182,152 168,65"
        fill="url(#ril-bowl-body)"
        stroke="#C4956A"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left exterior highlight */}
      <path
        d="M 44,82 Q 36,122 44,150"
        fill="none"
        stroke="rgba(255,255,255,0.48)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Batter surface */}
      <ellipse
        cx="100" cy="106" rx="55" ry="20"
        fill="url(#ril-batter)"
        style={{
          transformBox: 'view-box',
          transformOrigin: '100px 106px',
          animation: 'ri-batter-wobble 2.1s ease-in-out infinite',
        }}
      />
      {/* Batter highlight */}
      <ellipse
        cx="84" cy="100" rx="16" ry="6"
        fill="rgba(255,248,220,0.55)"
        style={{
          transformBox: 'view-box',
          transformOrigin: '100px 106px',
          animation: 'ri-batter-wobble 2.1s ease-in-out infinite',
        }}
      />

      {/* Whisk orbit group — rotates around (100, 112) at radius ~32px */}
      <g
        style={{
          transformBox: 'view-box',
          transformOrigin: '100px 112px',
          animation: 'ri-bowl-stir 2.0s linear infinite',
        }}
      >
        {/* Handle — from head at (100,80) up to (100,57) */}
        <line x1="100" y1="80" x2="100" y2="57"
          stroke="#A86830" strokeWidth="2.4" strokeLinecap="round" />
        {/* Four curved wires forming balloon shape */}
        <path d="M 100,80 C 86,72 83,62 100,57"
          fill="none" stroke="#A86830" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M 100,80 C 91,73 90,64 100,57"
          fill="none" stroke="#A86830" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 100,80 C 109,73 110,64 100,57"
          fill="none" stroke="#A86830" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 100,80 C 114,72 117,62 100,57"
          fill="none" stroke="#A86830" strokeWidth="1.7" strokeLinecap="round" />
        {/* Ring connector at base of wires */}
        <circle cx="100" cy="80" r="3" fill="none" stroke="#A86830" strokeWidth="1.6" />
      </g>

      {/* Bowl rim — drawn on top, gives illusion the whisk passes through it */}
      <ellipse cx="100" cy="65" rx="68" ry="17"
        fill="#F5EAD8" stroke="#C4956A" strokeWidth="2.5" />
      {/* Rim inner shadow */}
      <path
        d="M 38,66 Q 70,74 100,74 Q 130,74 162,66"
        fill="none"
        stroke="rgba(180,120,50,0.18)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Rim top highlight */}
      <path
        d="M 44,60 Q 72,54 100,53 Q 128,54 138,58"
        fill="none"
        stroke="rgba(255,255,255,0.78)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Bowl base */}
      <ellipse cx="100" cy="163" rx="48" ry="10"
        fill="url(#ril-bowl-base)" stroke="#C4956A" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Cake Stack ───────────────────────────────────────────────────────────────

interface CakeStackProps {
  showLayer1: boolean;
  showCream1: boolean;
  showFrosting: boolean;
  showSprinkles: boolean;
}

function CakeStack({ showLayer1, showCream1, showFrosting, showSprinkles }: CakeStackProps) {
  const layerAnim = (delay = 0): React.CSSProperties => ({
    transformBox: 'fill-box',
    transformOrigin: '50% 50%',
    animation: `ri-layer-in 0.65s ${delay}ms cubic-bezier(0.34,1.56,0.64,1) both`,
  });

  return (
    <svg viewBox="0 0 200 185" width="210" height="195" overflow="visible" aria-hidden="true">
      <defs>
        <linearGradient id="ril-sponge-a" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#F8DC90" />
          <stop offset="100%" stopColor="#D4892A" />
        </linearGradient>
        <linearGradient id="ril-sponge-b" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#F5D480" />
          <stop offset="100%" stopColor="#C87820" />
        </linearGradient>
        <linearGradient id="ril-board" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#D94E7A" />
          <stop offset="50%"  stopColor="#F46696" />
          <stop offset="100%" stopColor="#D94E7A" />
        </linearGradient>
        <linearGradient id="ril-cream" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#FFF0EA" />
          <stop offset="50%"  stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFF0EA" />
        </linearGradient>
        <linearGradient id="ril-frosting-base" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#FFD0E8" />
          <stop offset="50%"  stopColor="#FFF4F8" />
          <stop offset="100%" stopColor="#FFD0E8" />
        </linearGradient>
        <linearGradient id="ril-dollop" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%"   stopColor="#F46696" />
          <stop offset="100%" stopColor="#FFB8D4" />
        </linearGradient>
      </defs>

      {/* ── Cake board ── */}
      {showLayer1 && (
        <g style={layerAnim(0)}>
          <rect x="12" y="165" width="176" height="11" rx="4" fill="url(#ril-board)" />
          <rect x="14" y="166" width="172" height="4"  rx="2" fill="rgba(255,255,255,0.22)" />
        </g>
      )}

      {/* ── Bottom sponge (slides in at 30%) ── */}
      {showLayer1 && (
        <g style={layerAnim(60)}>
          <rect x="20" y="129" width="160" height="36" rx="3" fill="url(#ril-sponge-a)" />
          <rect x="20" y="129" width="160" height="8"  rx="3" fill="rgba(255,255,255,0.22)" />
          {[34, 57, 80, 100, 122, 143, 166].map(cx => (
            <circle key={cx} cx={cx} cy="147" r="2.2" fill="rgba(190,120,15,0.24)" />
          ))}
        </g>
      )}

      {/* ── Cream layer (appears at 58%) ── */}
      {showCream1 && (
        <g style={layerAnim(0)}>
          <path
            d="M 17,129 C 42,119 68,127 100,121 C 132,115 158,127 183,121 L 183,133 C 158,139 132,127 100,133 C 68,139 42,133 17,133 Z"
            fill="url(#ril-cream)"
          />
          <path
            d="M 17,133 C 42,133 68,139 100,133 C 132,127 158,133 183,133"
            fill="none"
            stroke="rgba(200,150,100,0.18)"
            strokeWidth="1.5"
          />
        </g>
      )}

      {/* ── Middle sponge (stacks on cream at 58%+120ms) ── */}
      {showCream1 && (
        <g style={layerAnim(120)}>
          <rect x="25" y="91" width="150" height="30" rx="3" fill="url(#ril-sponge-b)" />
          <rect x="25" y="91" width="150" height="7"  rx="3" fill="rgba(255,255,255,0.20)" />
          {[38, 60, 82, 100, 118, 140, 162].map(cx => (
            <circle key={cx} cx={cx} cy="106" r="1.9" fill="rgba(175,105,10,0.22)" />
          ))}
        </g>
      )}

      {/* ── Frosting base (appears at 88%) ── */}
      {showFrosting && (
        <g style={layerAnim(0)}>
          <rect x="28" y="78" width="144" height="13" rx="4" fill="url(#ril-frosting-base)" />
          <rect x="28" y="78" width="144" height="5"  rx="4" fill="rgba(255,255,255,0.5)" />
        </g>
      )}

      {/* ── Three piped frosting dollops ── */}
      {showFrosting && [
        { cx: 72,  rx: 20, ry: 22, delay: 0   },
        { cx: 100, rx: 24, ry: 28, delay: 100 },
        { cx: 128, rx: 20, ry: 22, delay: 200 },
      ].map(({ cx, rx, ry, delay }, i) => (
        <g
          key={i}
          style={{
            transformBox: 'fill-box',
            transformOrigin: '50% 100%',
            animation: `ri-frosting-pop 0.55s ${delay}ms cubic-bezier(0.34,1.56,0.64,1) both`,
          }}
        >
          {/* Arch shape: counter-clockwise arc from (cx-rx, 78) to (cx+rx, 78) */}
          <path
            d={`M ${cx - rx},78 A ${rx},${ry} 0 0 0 ${cx + rx},78 Z`}
            fill="url(#ril-dollop)"
          />
          {/* Highlight on each dollop */}
          <ellipse
            cx={cx - 4} cy={78 - ry * 0.55}
            rx={rx * 0.32} ry={ry * 0.22}
            fill="rgba(255,255,255,0.52)"
          />
        </g>
      ))}

      {/* ── Swirl stroke drawn on center dollop ── */}
      {showFrosting && (
        <path
          d="M 100,72 C 92,62 86,56 90,50 C 94,44 106,44 110,52 C 113,59 106,66 100,64"
          fill="none"
          stroke="rgba(200,58,108,0.62)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="120"
          style={{
            animation: 'ri-frosting-draw 0.9s 0.55s cubic-bezier(0.25,0.46,0.45,0.94) both',
          }}
        />
      )}

      {/* ── Sprinkles (pop in at 92%) ── */}
      {showSprinkles && SPRINKLES.map((s, i) => (
        <rect
          key={i}
          x={s.x - 4} y={s.y - 1.5}
          width="8" height="3"
          rx="1.5"
          fill={s.color}
          transform={`rotate(${s.angle} ${s.x} ${s.y})`}
          style={{
            transformBox: 'fill-box',
            transformOrigin: '50% 50%',
            animation: `ri-sprinkle-pop 0.4s ${s.delay}ms cubic-bezier(0.34,1.56,0.64,1) both`,
          }}
        />
      ))}
    </svg>
  );
}

// ─── Pun Speech Bubble ────────────────────────────────────────────────────────

function PunBubble({ text, visible }: { text: string; visible: boolean }) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '310px' }}>
      {/* Bubble body */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        textAlign: 'center',
        padding: '14px 20px 15px',
        background: 'var(--bg-subtle)',
        border: '1.5px solid var(--border-strong)',
        borderRadius: '18px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(5px) scale(0.97)',
        transition: 'opacity 0.36s cubic-bezier(0.4,0,0.2,1), transform 0.36s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(0.92rem, 3.4vw, 1.08rem)',
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
          margin: 0,
        }}>
          {text}
        </p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 500,
          marginTop: '5px',
          marginBottom: 0,
        }}>
          Fetching your recipe
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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

  // Puns rotate every 2s with a brief fade-out/in
  useEffect(() => {
    const id = setInterval(() => {
      setPunVisible(false);
      setTimeout(() => {
        setPunIndex(i => (i + 1) % PUNS.length);
        setPunVisible(true);
      }, 400);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Progress: 0–99 over 12 seconds (stays at 99 until fetch resolves)
  const progress    = Math.min((elapsed / 12000) * 100, 99);
  const bowlExiting = progress >= 28;
  const showLayer1  = progress >= 30;
  const showCream1  = progress >= 58;
  const showFrosting  = progress >= 88;
  const showSprinkles = progress >= 92;
  const stage = progress < 30 ? 0 : progress < 60 ? 1 : progress < 90 ? 2 : 3;

  return createPortal(
    <>
      <style>{KEYFRAMES}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        style={{
          background: 'rgba(15,12,30,0.42)',
          backdropFilter: 'blur(8px)',
          animation: 'ri-fadein 0.3s ease',
        }}
      />

      {/* Card */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-5"
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'var(--surface)',
          borderRadius: '28px',
          border: '1.5px solid var(--border-strong)',
          boxShadow: '0 32px 80px rgba(15,12,30,0.22)',
          padding: '36px 32px 32px',
          width: '100%',
          maxWidth: '390px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          position: 'relative',
          overflow: 'hidden',
          pointerEvents: 'auto',
          animation: 'ri-bouncein 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>

          {/* Floating accent particles */}
          {(['✦', '✿', '·', '♡', '✦', '✿', '·', '♡'] as const).map((ch, i) => (
            <span key={i} aria-hidden="true" style={{
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

          {/* Animation stage area */}
          <div style={{
            height: '195px',
            width: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Mixing bowl — fades out as layers appear */}
            <div style={{
              position: 'absolute',
              opacity: bowlExiting ? 0 : 1,
              transform: bowlExiting ? 'scale(0.88) translateY(12px)' : 'scale(1)',
              transition: 'opacity 0.7s ease, transform 0.7s ease',
            }}>
              <MixingBowl />
            </div>

            {/* Cake — builds from first layer onward */}
            <div style={{
              position: 'absolute',
              opacity: showLayer1 ? 1 : 0,
              transition: 'opacity 0.5s ease',
              animation: showFrosting ? 'ri-float 3.5s ease-in-out infinite' : undefined,
            }}>
              <CakeStack
                showLayer1={showLayer1}
                showCream1={showCream1}
                showFrosting={showFrosting}
                showSprinkles={showSprinkles}
              />
            </div>
          </div>

          {/* Pun speech bubble */}
          <PunBubble text={PUNS[punIndex]} visible={punVisible} />

          {/* Stage progress dots */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
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

          {/* Source URL hint */}
          {url && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.625rem',
              color: 'var(--text-muted)',
              opacity: 0.45,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '300px',
              margin: 0,
            }}>{url}</p>
          )}

        </div>
      </div>
    </>,
    document.body
  );
}
