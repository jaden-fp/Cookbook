import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Stage 0: Mixing Bowl (0–33%)
const MIXING_PUNS = [
  "I told my dough a joke. It didn't rise to the occasion.",
  "I tried to make a belt out of bread. Total waist of dough.",
  "I burned my Hawaiian pizza. Should've used aloha temperature.",
  "Knead I say more?",
  "Flour is just wheat that got its life together.",
  "The dough isn't sticky — it's just emotionally clingy.",
  "Unsalted butter is just butter that gave up.",
  "Cold butter builds character. Also pastry.",
  "I have trust issues with recipes that say 'a pinch of salt.'",
  "Room temperature eggs. It's not a suggestion. It's a warning.",
  "Some people find baking relaxing. Those people have never made croissants.",
  "Folding in the flour is just stirring for people who've been humbled.",
  "The eggs were cage-free. The puns are not.",
  "The recipe said to mix until smooth. We've been at it for eleven minutes.",
  "Every cookie is a little different. Like children, but edible.",
  "Why did the baker quit? He kneaded a break.",
];

// Stage 1: Oven (33–67%)
const BAKING_PUNS = [
  "Opening the oven early is how you ruin things and also friendships.",
  "The toothpick came out clean. We don't believe it either.",
  "Golden brown is a feeling, not a temperature.",
  "That smell coming from the oven? That's ambition.",
  "The loaf is very full of itself. Upper crust behavior.",
  "We'd never half-bake a recipe. Our integrity is intact.",
  "The oven is preheated. There's no going back now.",
  "Sourdough starter is just a pet you have to feed or it dies.",
  "Everything is fine. We're rotating the pan. It's fine.",
  "If it smells burnt, it's not burnt. It's caramelized. Stay calm.",
  "Bread is just cake that decided to take itself seriously.",
  "The timer went off. That doesn't mean it's done. Never means it's done.",
  "This recipe is really proving itself right now.",
  "Convection ovens are regular ovens with a superiority complex.",
  "A watched oven never browns. So we're not looking.",
  "The Maillard reaction is just science's way of saying 'nice crust.'",
];

// Stage 2: Decorating / Finishing (67–100%)
const DECORATING_PUNS = [
  "The crumb coat is a rough draft. We respect rough drafts.",
  "Frosting is mostly butter and confidence.",
  "A cake without sprinkles is just bread with commitment issues.",
  "The ganache knows what it did. We're letting it cool.",
  "Piping rosettes is the closest most of us get to fine art.",
  "Salt on top of chocolate is not controversial. It's correct.",
  "A soggy bottom is a personal failure and we refuse.",
  "The sprinkles are non-negotiable at this point.",
  "The cake is not a lie. We checked.",
  "Inverting the cake is the most stressful two seconds in baking.",
  "The recipe said 'let cool completely.' We gave it three minutes.",
  "Edible glitter is just glamour you can digest.",
  "What did the cake say to the fork? 'You want a piece of me?'",
  "Every slice is a fresh start. And also dessert.",
  "Finishing a recipe is a form of self-care. Genuinely.",
  "Worth the wait. We promise. Almost there.",
];

const PUNS_BY_STAGE = [MIXING_PUNS, BAKING_PUNS, DECORATING_PUNS];

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
  @keyframes ri-whisk-stir {
    0%   { transform: rotate(-24deg); }
    50%  { transform: rotate(24deg); }
    100% { transform: rotate(-24deg); }
  }
  @keyframes ri-batter-wobble {
    0%, 100% { transform: scaleX(1)    scaleY(1);    }
    25%      { transform: scaleX(1.04) scaleY(0.93); }
    75%      { transform: scaleX(0.96) scaleY(1.07); }
  }
  @keyframes ri-oven-glow {
    0%, 100% { opacity: 0.7; }
    50%      { opacity: 1.0; }
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
  @keyframes ri-progress-shine {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(500%);  }
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
          transformBox: 'fill-box',
          transformOrigin: '50% 50%',
          animation: 'ri-batter-wobble 2.1s ease-in-out infinite',
        }}
      />
      {/* Batter highlight */}
      <ellipse
        cx="84" cy="100" rx="16" ry="6"
        fill="rgba(255,248,220,0.55)"
        style={{
          transformBox: 'fill-box',
          transformOrigin: '50% 50%',
          animation: 'ri-batter-wobble 2.1s ease-in-out infinite',
        }}
      />

      {/*
        Whisk: handle top anchored at (100, 68) near the bowl rim.
        The group rotates around its own top edge (transformOrigin '50% 0%')
        so the handle tilts while the bottom wires stir inside the batter.
        Batter surface is at y≈86, whisk wires extend to y≈108 — deep in the batter.
      */}
      <g
        style={{
          transformBox: 'fill-box',
          transformOrigin: '50% 0%',
          animation: 'ri-whisk-stir 1.7s ease-in-out infinite',
        }}
      >
        {/* Handle */}
        <line x1="100" y1="68" x2="100" y2="94"
          stroke="#A86830" strokeWidth="2.4" strokeLinecap="round" />
        {/* Four balloon wires */}
        <path d="M 100,94 C 86,100 83,106 100,110"
          fill="none" stroke="#A86830" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M 100,94 C 91,98  90,105 100,110"
          fill="none" stroke="#A86830" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 100,94 C 109,98 110,105 100,110"
          fill="none" stroke="#A86830" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 100,94 C 114,100 117,106 100,110"
          fill="none" stroke="#A86830" strokeWidth="1.7" strokeLinecap="round" />
        {/* Ring at wire base */}
        <circle cx="100" cy="94" r="3" fill="none" stroke="#A86830" strokeWidth="1.6" />
      </g>

      {/* Bowl rim — drawn last, frames the whisk entry point */}
      <ellipse cx="100" cy="65" rx="68" ry="17"
        fill="#F5EAD8" stroke="#C4956A" strokeWidth="2.5" />
      <path
        d="M 38,66 Q 70,74 100,74 Q 130,74 162,66"
        fill="none" stroke="rgba(180,120,50,0.18)" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M 44,60 Q 72,54 100,53 Q 128,54 138,58"
        fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="3" strokeLinecap="round" />

      {/* Bowl base */}
      <ellipse cx="100" cy="163" rx="48" ry="10"
        fill="url(#ril-bowl-base)" stroke="#C4956A" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Oven ─────────────────────────────────────────────────────────────────────

interface OvenProps {
  /** 0–100: how far through the baking stage we are */
  ovenProgress: number;
}

function Oven({ ovenProgress }: OvenProps) {
  const cakeScale = Math.max(0.02, ovenProgress / 100);
  const cakeHue       = 44  - (ovenProgress / 100) * 14;
  const cakeLightness = 68  - (ovenProgress / 100) * 20;
  const cakeColor     = `hsl(${cakeHue}, 78%, ${cakeLightness}%)`;

  return (
    <svg viewBox="0 0 200 175" width="210" height="184" overflow="visible" aria-hidden="true">
      <defs>
        <linearGradient id="ril-oven-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#3E3430" />
          <stop offset="100%" stopColor="#1E1410" />
        </linearGradient>
        <radialGradient id="ril-oven-interior" cx="50%" cy="25%" r="65%">
          <stop offset="0%"   stopColor="#FF9040" stopOpacity="0.75" />
          <stop offset="55%"  stopColor="#CC4E10" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#701800" stopOpacity="0.0"  />
        </radialGradient>
        <radialGradient id="ril-oven-bulb" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="35%"  stopColor="#FFE880" stopOpacity="0.7"  />
          <stop offset="100%" stopColor="#FF8020" stopOpacity="0.0"  />
        </radialGradient>
        <linearGradient id="ril-glass-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,220,140,0.18)" />
          <stop offset="100%" stopColor="rgba(255,120,20,0.06)"  />
        </linearGradient>
        <linearGradient id="ril-cake-tin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#9A8460" />
          <stop offset="100%" stopColor="#6A5440" />
        </linearGradient>
        <clipPath id="ril-glass-clip">
          <rect x="40" y="64" width="120" height="84" rx="7" />
        </clipPath>
      </defs>

      {/* ── Outer body ── */}
      <rect x="20" y="12" width="160" height="150" rx="14"
        fill="url(#ril-oven-body)" />
      <rect x="20" y="12" width="160" height="150" rx="14"
        fill="none" stroke="#5A4A42" strokeWidth="1.5" />

      {/* ── Control strip ── */}
      <rect x="20" y="12" width="160" height="38" rx="14"
        fill="#4A3C34" />
      <rect x="20" y="32" width="160" height="18"
        fill="#4A3C34" />

      {/* Knob — left (temp) */}
      <circle cx="52" cy="31" r="10" fill="#252018" stroke="#7A6A5A" strokeWidth="1.5" />
      <circle cx="52" cy="31" r="4.5" fill="#151008" />
      <line x1="52" y1="22" x2="52" y2="27" stroke="#E8A020" strokeWidth="2" strokeLinecap="round" />

      {/* Knob — center-left */}
      <circle cx="86" cy="31" r="7.5" fill="#252018" stroke="#6A5A4A" strokeWidth="1.2" />
      <circle cx="86" cy="31" r="3.5" fill="#151008" />
      <line x1="86" y1="24" x2="86" y2="28" stroke="#7A6A5A" strokeWidth="1.5" strokeLinecap="round" />

      {/* Knob — center-right */}
      <circle cx="114" cy="31" r="7.5" fill="#252018" stroke="#6A5A4A" strokeWidth="1.2" />
      <circle cx="114" cy="31" r="3.5" fill="#151008" />
      <line x1="114" y1="24" x2="114" y2="28" stroke="#7A6A5A" strokeWidth="1.5" strokeLinecap="round" />

      {/* Knob — right (timer) */}
      <circle cx="148" cy="31" r="10" fill="#252018" stroke="#7A6A5A" strokeWidth="1.5" />
      <circle cx="148" cy="31" r="4.5" fill="#151008" />
      <line x1="148" y1="22" x2="148" y2="27" stroke="#7A6A5A" strokeWidth="2" strokeLinecap="round" />

      {/* 350° label */}
      <text x="52" y="48" textAnchor="middle" fill="#C09060" fontSize="6.5"
        fontFamily="monospace" letterSpacing="0">350°</text>

      {/* ── Door frame ── */}
      <rect x="28" y="56" width="144" height="100" rx="12"
        fill="#1E1A14" stroke="#4A3830" strokeWidth="1.5" />

      {/* ── Glass window base (dark) ── */}
      <rect x="40" y="64" width="120" height="84" rx="7"
        fill="#120E08" />

      {/* Interior (clipped to glass) */}
      <g clipPath="url(#ril-glass-clip)">
        {/* Warm glow */}
        <rect x="40" y="64" width="120" height="84" fill="url(#ril-oven-interior)" />

        {/* Oven rack */}
        <line x1="40" y1="132" x2="160" y2="132"
          stroke="#6A5A3A" strokeWidth="1.5" />
        {[48,56,64,72,80,88,96,104,112,120,128,136,144,152].map(x => (
          <line key={x} x1={x} y1="130" x2={x} y2="134"
            stroke="#5A4A2A" strokeWidth="1" />
        ))}

        {/* Cake tin */}
        <rect x="55" y="120" width="90" height="12" rx="2"
          fill="url(#ril-cake-tin)" />
        <rect x="55" y="120" width="90" height="3" rx="2"
          fill="rgba(255,255,255,0.1)" />

        {/* Rising cake — scaleY from bottom of tin (y=120) */}
        <g style={{
          transformBox: 'fill-box',
          transformOrigin: '50% 100%',
          transform: `scaleY(${cakeScale})`,
          transition: 'transform 1.0s ease',
        }}>
          <rect x="58" y="92" width="84" height="28" rx="2"
            fill={cakeColor} />
          {/* Top shine */}
          <rect x="58" y="92" width="84" height="6" rx="2"
            fill="rgba(255,255,255,0.18)" />
        </g>

        {/* Oven bulb glow (top center) */}
        <circle cx="100" cy="76" r="18"
          fill="url(#ril-oven-bulb)"
          style={{ animation: 'ri-oven-glow 2.2s ease-in-out infinite' }}
        />
        <circle cx="100" cy="76" r="5"
          fill="rgba(255,255,255,0.75)"
          style={{ animation: 'ri-oven-glow 2.2s ease-in-out infinite' }}
        />

        {/* Glass surface sheen */}
        <rect x="40" y="64" width="120" height="84" rx="7"
          fill="url(#ril-glass-sheen)" />
      </g>

      {/* ── Door hinges ── */}
      <rect x="28" y="68"  width="6" height="12" rx="3" fill="#3A2E28" />
      <rect x="28" y="144" width="6" height="12" rx="3" fill="#3A2E28" />

      {/* ── Door handle ── */}
      <rect x="154" y="100" width="10" height="24" rx="5"
        fill="#8A7060" stroke="#6A5040" strokeWidth="1" />
      <rect x="155" y="102" width="5" height="5" rx="2.5"
        fill="rgba(255,255,255,0.2)" />

      {/* ── Feet ── */}
      <rect x="34"  y="160" width="16" height="8" rx="4" fill="#1A1410" />
      <rect x="150" y="160" width="16" height="8" rx="4" fill="#1A1410" />
    </svg>
  );
}

// ─── Cake Stack ───────────────────────────────────────────────────────────────

interface CakeStackProps {
  showLayer1: boolean;
  showCream1: boolean;
  showFrosting: boolean;
  showSprinkles: boolean;
  doFloat: boolean;
}

function CakeStack({ showLayer1, showCream1, showFrosting, showSprinkles, doFloat }: CakeStackProps) {
  const layerAnim = (delay = 0): React.CSSProperties => ({
    transformBox: 'fill-box',
    transformOrigin: '50% 50%',
    animation: `ri-layer-in 0.65s ${delay}ms cubic-bezier(0.34,1.56,0.64,1) both`,
  });

  return (
    <svg
      viewBox="0 0 200 185"
      width="210" height="195"
      overflow="visible"
      aria-hidden="true"
      style={{ animation: doFloat ? 'ri-float 3.5s ease-in-out infinite' : undefined }}
    >
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

      {showLayer1 && (
        <g style={layerAnim(0)}>
          <rect x="12" y="165" width="176" height="11" rx="4" fill="url(#ril-board)" />
          <rect x="14" y="166" width="172" height="4"  rx="2" fill="rgba(255,255,255,0.22)" />
        </g>
      )}
      {showLayer1 && (
        <g style={layerAnim(60)}>
          <rect x="20" y="129" width="160" height="36" rx="3" fill="url(#ril-sponge-a)" />
          <rect x="20" y="129" width="160" height="8"  rx="3" fill="rgba(255,255,255,0.22)" />
          {[34,57,80,100,122,143,166].map(cx => (
            <circle key={cx} cx={cx} cy="147" r="2.2" fill="rgba(190,120,15,0.24)" />
          ))}
        </g>
      )}
      {showCream1 && (
        <g style={layerAnim(0)}>
          <path
            d="M 17,129 C 42,119 68,127 100,121 C 132,115 158,127 183,121 L 183,133 C 158,139 132,127 100,133 C 68,139 42,133 17,133 Z"
            fill="url(#ril-cream)"
          />
        </g>
      )}
      {showCream1 && (
        <g style={layerAnim(120)}>
          <rect x="25" y="91" width="150" height="30" rx="3" fill="url(#ril-sponge-b)" />
          <rect x="25" y="91" width="150" height="7"  rx="3" fill="rgba(255,255,255,0.20)" />
          {[38,60,82,100,118,140,162].map(cx => (
            <circle key={cx} cx={cx} cy="106" r="1.9" fill="rgba(175,105,10,0.22)" />
          ))}
        </g>
      )}
      {showFrosting && (
        <g style={layerAnim(0)}>
          <rect x="28" y="78" width="144" height="13" rx="4" fill="url(#ril-frosting-base)" />
          <rect x="28" y="78" width="144" height="5"  rx="4" fill="rgba(255,255,255,0.5)" />
        </g>
      )}
      {showFrosting && [
        { cx: 72,  rx: 20, ry: 22, delay: 0   },
        { cx: 100, rx: 24, ry: 28, delay: 100 },
        { cx: 128, rx: 20, ry: 22, delay: 200 },
      ].map(({ cx, rx, ry, delay }, i) => (
        <g key={i} style={{
          transformBox: 'fill-box',
          transformOrigin: '50% 100%',
          animation: `ri-frosting-pop 0.55s ${delay}ms cubic-bezier(0.34,1.56,0.64,1) both`,
        }}>
          <path d={`M ${cx-rx},78 A ${rx},${ry} 0 0 0 ${cx+rx},78 Z`}
            fill="url(#ril-dollop)" />
          <ellipse cx={cx-4} cy={78 - ry*0.55} rx={rx*0.32} ry={ry*0.22}
            fill="rgba(255,255,255,0.52)" />
        </g>
      ))}
      {showFrosting && (
        <path
          d="M 100,72 C 92,62 86,56 90,50 C 94,44 106,44 110,52 C 113,59 106,66 100,64"
          fill="none" stroke="rgba(200,58,108,0.62)"
          strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="120"
          style={{ animation: 'ri-frosting-draw 0.9s 0.55s cubic-bezier(0.25,0.46,0.45,0.94) both' }}
        />
      )}
      {showSprinkles && SPRINKLES.map((s, i) => (
        <rect key={i}
          x={s.x-4} y={s.y-1.5} width="8" height="3" rx="1.5"
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

// ─── Pun Bubble ───────────────────────────────────────────────────────────────

function PunBubble({ text, visible }: { text: string; visible: boolean }) {
  return (
    <div style={{
      width: '100%',
      maxWidth: '310px',
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
  );
}

// ─── Loading Bar ──────────────────────────────────────────────────────────────

function LoadingBar({ progress }: { progress: number }) {
  return (
    <div style={{
      width: '100%',
      height: '6px',
      background: 'var(--bg-subtle)',
      borderRadius: '99px',
      overflow: 'hidden',
      border: '1px solid var(--border)',
    }}>
      <div style={{
        position: 'relative',
        height: '100%',
        width: `${progress}%`,
        minWidth: progress > 0 ? '12px' : '0',
        borderRadius: '99px',
        background: 'linear-gradient(90deg, #F46696, #D94E7A)',
        boxShadow: '0 0 6px rgba(244,102,150,0.45)',
        transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}>
        {/* Shimmer shine */}
        <div style={{
          position: 'absolute',
          top: 0, bottom: 0,
          width: '25%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.38), transparent)',
          animation: 'ri-progress-shine 2s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props { url?: string; }

export default function RecipeImportLoader({ url }: Props) {
  const [punIndex, setPunIndex] = useState(0);
  const [punVisible, setPunVisible] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - start), 80);
    return () => clearInterval(t);
  }, []);

  // Progress: 0–99 over 12 s
  const progress = Math.min((elapsed / 12000) * 100, 99);

  // Stage thresholds
  const stage = progress < 33 ? 0 : progress < 67 ? 1 : 2;

  // When stage changes, immediately swap to a random pun from the new stage's pool
  useEffect(() => {
    if (stage === currentStage) return;
    setCurrentStage(stage);
    setPunVisible(false);
    setTimeout(() => {
      setPunIndex(Math.floor(Math.random() * PUNS_BY_STAGE[stage].length));
      setPunVisible(true);
    }, 400);
  }, [stage, currentStage]);

  // Cycle through puns within the current stage
  useEffect(() => {
    const id = setInterval(() => {
      setPunVisible(false);
      setTimeout(() => {
        setPunIndex(i => (i + 1) % PUNS_BY_STAGE[currentStage].length);
        setPunVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(id);
  }, [currentStage]);
  const ovenProgress = stage === 1 ? ((progress - 33) / 34) * 100
                     : stage  >  1 ? 100 : 0;

  // Decorating sub-progress
  const decorP      = stage === 2 ? ((progress - 67) / 33) * 100 : 0;
  const showLayer1   = stage === 2;
  const showCream1   = decorP >= 38;
  const showFrosting = decorP >= 68;
  const showSprinkles = decorP >= 83;

  const sceneStyle = (active: boolean): React.CSSProperties => ({
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: active ? 1 : 0,
    transform: active ? 'scale(1)' : 'scale(0.93)',
    transition: 'opacity 0.65s ease, transform 0.65s ease',
    pointerEvents: 'none',
  });

  return createPortal(
    <>
      <style>{KEYFRAMES}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        style={{ background: 'rgba(15,12,30,0.42)', backdropFilter: 'blur(8px)', animation: 'ri-fadein 0.3s ease' }}
      />

      {/* Card */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5" style={{ pointerEvents: 'none' }}>
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

          {/* Floating particles */}
          {(['✦','✿','·','♡','✦','✿','·','♡'] as const).map((ch, i) => (
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

          {/* ── Animation stage area ── */}
          <div style={{
            height: '195px',
            width: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Stage 0: Mixing bowl */}
            <div style={sceneStyle(stage === 0)}>
              <MixingBowl />
            </div>

            {/* Stage 1: Oven */}
            <div style={sceneStyle(stage === 1)}>
              <Oven ovenProgress={ovenProgress} />
            </div>

            {/* Stage 2: Finished cake */}
            <div style={sceneStyle(stage === 2)}>
              <CakeStack
                showLayer1={showLayer1}
                showCream1={showCream1}
                showFrosting={showFrosting}
                showSprinkles={showSprinkles}
                doFloat={showFrosting}
              />
            </div>
          </div>

          {/* ── Pun bubble (updates independently) ── */}
          <PunBubble text={PUNS_BY_STAGE[currentStage][punIndex]} visible={punVisible} />

          {/* ── Continuous loading bar ── */}
          <LoadingBar progress={progress} />

          {/* URL hint */}
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
