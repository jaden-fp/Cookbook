import { useState, useEffect } from 'react';

const PUNS = [
  "Whisking you a great recipe…",
  "Kneading just a moment here",
  "Batter late than never!",
  "Sifting through the internet",
  "Don't loaf around, almost done",
  "This one's really proving itself",
  "Butter believe it's loading",
  "Sugar, we're so close",
  "Stirring up something delicious",
  "We're really cooking now",
  "Just beating the algorithm",
  "Rolling in the good stuff",
];

const FLOATERS = ['✦', '✿', '·', '✦', '✿', '·', '✦', '·'];

interface Props {
  url?: string;
}

export default function RecipeImportLoader({ url }: Props) {
  const [punIndex, setPunIndex] = useState(() => Math.floor(Math.random() * PUNS.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPunIndex(i => (i + 1) % PUNS.length);
        setVisible(true);
      }, 380);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{`
        @keyframes loader-bob {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-14px) rotate(3deg); }
        }
        @keyframes loader-float {
          0%   { transform: translateY(0px) scale(1);   opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 0.5; }
          100% { transform: translateY(-110px) scale(0.4); opacity: 0; }
        }
        @keyframes loader-ring {
          0%, 100% { transform: scale(1);    opacity: 0.14; }
          50%       { transform: scale(1.08); opacity: 0.06; }
        }
        @keyframes loader-rise {
          0%   { width: 3%; }
          60%  { width: 75%; }
          85%  { width: 88%; }
          100% { width: 93%; }
        }
        @keyframes loader-shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes loader-fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10"
        style={{
          background: 'rgba(255,245,248,0.88)',
          backdropFilter: 'blur(18px)',
          animation: 'loader-fadein 0.3s ease',
        }}
      >
        {/* Floating particles */}
        {FLOATERS.map((ch, i) => (
          <span
            key={i}
            aria-hidden
            style={{
              position: 'absolute',
              left: `${8 + i * 11.5}%`,
              bottom: `${18 + (i % 4) * 12}%`,
              fontSize: i % 2 === 0 ? '0.875rem' : '0.5rem',
              color: 'var(--accent)',
              opacity: 0,
              animation: `loader-float ${2.8 + i * 0.35}s ease-in infinite`,
              animationDelay: `${i * 0.55}s`,
              pointerEvents: 'none',
            }}
          >
            {ch}
          </span>
        ))}

        {/* Bowl + pulse ring */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: '-20px',
              borderRadius: '50%',
              background: 'var(--accent)',
              animation: 'loader-ring 2.2s ease-in-out infinite',
            }}
          />
          <span
            role="img"
            aria-label="mixing bowl"
            style={{
              fontSize: '5.5rem',
              lineHeight: 1,
              display: 'block',
              animation: 'loader-bob 2.6s ease-in-out infinite',
              position: 'relative',
              zIndex: 1,
            }}
          >
            🥣
          </span>
        </div>

        {/* Pun + subtext */}
        <div style={{ textAlign: 'center', padding: '0 2rem', maxWidth: '380px' }}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.375rem, 4vw, 1.875rem)',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: '10px',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(-6px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
            }}
          >
            {PUNS[punIndex]}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            Fetching your recipe
          </p>
          {url && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                marginTop: '6px',
                opacity: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '300px',
              }}
            >
              {url}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '100%',
              height: '5px',
              borderRadius: '999px',
              background: 'var(--border-strong)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, var(--accent), #ffb3cc, var(--accent))',
                backgroundSize: '200% 100%',
                animation: 'loader-rise 14s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards, loader-shimmer 1.6s linear infinite',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
