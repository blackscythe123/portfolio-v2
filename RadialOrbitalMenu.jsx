import { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const ITEMS = [
  {
    name: 'ExpenseIQ', icon: '💰', color: '#f59e0b', type: 'Flower of Life',
    hp: '4,780', stars: '★★★★☆', level: '+4',
    subs: [
      { label: 'ATK', val: '+52' },
      { label: 'Energy Recharge', val: '+12.4%' },
      { label: 'CRIT DMG', val: '+7.8%' },
    ],
    set2: 'JavaScript DMG Bonus +15%.',
    set4: 'When Elemental Skill hits, ATK +60 for 8s. Max 4 stacks.',
    lore: 'Built from pure intent and caffeine — an intelligence that learns your spending before you do.',
    lang: 'JavaScript',
  },
  {
    name: 'FarmLedge', icon: '🌿', color: '#22c55e', type: 'Plume of Death',
    hp: '6,200', stars: '★★★★★', level: '+20',
    subs: [
      { label: 'ATK', val: '+62' },
      { label: 'ER', val: '+18.1%' },
      { label: 'CRIT Rate', val: '+5.4%' },
    ],
    set2: 'TypeScript DMG Bonus +15%.',
    set4: 'Supply chain clarity empowers: DEF +80 for 12s after planting.',
    lore: 'Every crop traced, every ledger sealed. The earth does not lie.',
    lang: 'TypeScript',
  },
  {
    name: 'openclaude', icon: '🤖', color: '#a855f7', type: 'Sands of Eon',
    hp: '3,600', stars: '★★★☆☆', level: '+8',
    subs: [
      { label: 'ATK', val: '+38' },
      { label: 'ER', val: '+9.7%' },
      { label: 'CRIT DMG', val: '+4.2%' },
    ],
    set2: 'CLI Resonance: Elemental Mastery +80.',
    set4: 'Using Elemental Burst extends skill duration by 3s.',
    lore: 'Two hundred models, one voice. The oracle speaks in tokens.',
    lang: 'CLI',
  },
  {
    name: 'ada', icon: '🌐', color: '#3b82f6', type: 'Goblet of Eonothem',
    hp: '2,400', stars: '★★☆☆☆', level: '+0',
    subs: [
      { label: 'ATK', val: '+24' },
      { label: 'ER', val: '+6.2%' },
      { label: 'CRIT Rate', val: '+2.1%' },
    ],
    set2: 'HTML Resonance: Healing Bonus +15%.',
    set4: 'On healing, restore 6 Energy per 3s for 10s.',
    lore: 'No framework, no scaffold. Just intent rendered in light.',
    lang: 'HTML',
  },
  {
    name: 'dbms', icon: '🗄️', color: '#06b6d4', type: 'Circlet of Logos',
    hp: '3,100', stars: '★★★☆☆', level: '+4',
    subs: [
      { label: 'ATK', val: '+32' },
      { label: 'ER', val: '+8.4%' },
      { label: 'CRIT DMG', val: '+5.6%' },
    ],
    set2: 'Shell Mastery: Skill CD -15%.',
    set4: 'On Normal Attack, deal additional Shell DMG equal to 60% ATK.',
    lore: 'Indexes as old as stone tablets, queries sharp as obsidian.',
    lang: 'Shell',
  },
];

const NAV_ITEMS = [
  'Attributes',
  'Weapons',
  'Artifacts',
  'Constellation',
  'Talents',
];
const ACTIVE_NAV = 'Artifacts';

// ---------------------------------------------------------------------------
// Orb float offsets (translateY values per bubble index)
// ---------------------------------------------------------------------------
const FLOAT_OFFSETS = [8, 11, 6, 13, 9];
const FLOAT_DURATIONS = ['3.1s', '2.8s', '3.4s', '2.9s', '3.2s'];
const FLOAT_DELAYS = ['0s', '0.55s', '1.1s', '1.65s', '2.2s'];

// ---------------------------------------------------------------------------
// Helper: derive a bright highlight color and deep dark from a base hex color
// ---------------------------------------------------------------------------
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function orbGradient(color) {
  const [r, g, b] = hexToRgb(color);
  // Highlight: near-white tint of the color
  const hr = Math.min(255, Math.round(r * 0.4 + 230));
  const hg = Math.min(255, Math.round(g * 0.4 + 230));
  const hb = Math.min(255, Math.round(b * 0.4 + 230));
  // Deep dark: ~12% brightness
  const dr = Math.round(r * 0.14);
  const dg = Math.round(g * 0.14);
  const db = Math.round(b * 0.14);
  return `radial-gradient(circle at 35% 30%, rgb(${hr},${hg},${hb}), ${color} 45%, rgb(${dr},${dg},${db}) 100%)`;
}

// ---------------------------------------------------------------------------
// Keyframes CSS string
// ---------------------------------------------------------------------------
const KEYFRAMES_ID = 'radial-orbital-menu-keyframes';

function buildKeyframesCSS() {
  let css = '';

  // Per-orb float animations
  FLOAT_OFFSETS.forEach((offset, i) => {
    css += `
@keyframes floatBubble${i} {
  0%   { transform: scale(1) translateY(0px); }
  50%  { transform: scale(1) translateY(-${offset}px); }
  100% { transform: scale(1) translateY(0px); }
}
@keyframes floatBubbleActive${i} {
  0%   { transform: scale(1.3) translateY(0px); }
  50%  { transform: scale(1.3) translateY(-${offset}px); }
  100% { transform: scale(1.3) translateY(0px); }
}
`;
  });

  css += `
@keyframes pulseGlow {
  0%, 100% { opacity: 0.85; }
  50%       { opacity: 1; }
}

@keyframes avatarPulse {
  0%, 100% {
    box-shadow:
      0 0 0 3px rgba(226,201,126,0.4),
      0 0 18px 6px rgba(226,201,126,0.25),
      0 0 40px 14px rgba(226,201,126,0.12);
  }
  50% {
    box-shadow:
      0 0 0 4px rgba(226,201,126,0.7),
      0 0 28px 10px rgba(226,201,126,0.45),
      0 0 60px 22px rgba(226,201,126,0.22);
  }
}

@keyframes orbitSpin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes panelFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

  return css;
}

// ---------------------------------------------------------------------------
// Sub-components (inline-style only)
// ---------------------------------------------------------------------------

function LeftNav() {
  return (
    <div
      style={{
        width: '10%',
        minWidth: 90,
        background: 'rgba(5, 0, 20, 0.60)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '0 0 0 0',
        gap: 4,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item === ACTIVE_NAV;
        return (
          <div
            key={item}
            style={{
              width: '100%',
              padding: '10px 14px 10px 12px',
              borderLeft: isActive ? '2px solid #e2c97e' : '2px solid transparent',
              background: isActive ? 'rgba(226,201,126,0.07)' : 'transparent',
              cursor: 'default',
              userSelect: 'none',
            }}
          >
            <span
              style={{
                display: 'block',
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                fontSize: 10,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontWeight: isActive ? 700 : 400,
                color: isActive ? '#e2c97e' : 'rgba(255,255,255,0.30)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ marginRight: 6, fontSize: 9 }}>
                {isActive ? '◆' : '◇'}
              </span>
              {item}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// The dashed orbit ellipse rendered as SVG
function OrbitRing({ cx, cy, rx, ry }) {
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke="rgba(226,201,126,0.18)"
        strokeWidth="1"
        strokeDasharray="6 5"
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          animation: 'orbitSpin 30s linear infinite',
        }}
      />
    </svg>
  );
}

function CenterAvatar() {
  return (
    <div
      style={{
        position: 'absolute',
        left: 350 - 48,
        top: 260 - 48,
        width: 96,
        height: 96,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 35%, #3a2a6e, #0d0820 80%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 38,
        border: '2px solid rgba(226,201,126,0.45)',
        animation: 'avatarPulse 3s ease-in-out infinite',
        zIndex: 10,
      }}
    >
      ⚔️
    </div>
  );
}

function PremiumOrb({ item, index, isActive, onClick, left, top }) {
  const gradient = orbGradient(item.color);
  const c = item.color;

  const activeBoxShadow = [
    'inset 0 -10px 20px rgba(0,0,0,0.60)',
    'inset 0 5px 10px rgba(255,255,255,0.15)',
    `0 0 0 3px ${c}ee`,
    `0 0 20px 6px ${c}99`,
    `0 0 50px 18px ${c}44`,
  ].join(', ');

  const inactiveBoxShadow = [
    'inset 0 -8px 16px rgba(0,0,0,0.55)',
    'inset 0 4px 8px rgba(255,255,255,0.10)',
    `0 0 0 1px ${c}55`,
    `0 0 10px 3px ${c}44`,
    `0 0 24px 8px ${c}22`,
  ].join(', ');

  const animName = isActive
    ? `floatBubbleActive${index}`
    : `floatBubble${index}`;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left,
        top,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: gradient,
        border: isActive ? `2px solid ${c}` : '2px solid transparent',
        boxShadow: isActive ? activeBoxShadow : inactiveBoxShadow,
        opacity: isActive ? 1 : 0.65,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        animation: `${animName} ${FLOAT_DURATIONS[index]} ease-in-out ${FLOAT_DELAYS[index]} infinite`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
      }}
    >
      {/* Specular highlight layer */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '12%',
          width: '36%',
          height: '26%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 100%)',
          filter: 'blur(2px)',
          pointerEvents: 'none',
        }}
      />
      {/* Inset bottom shadow for curvature */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 85%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 60%)',
          pointerEvents: 'none',
        }}
      />
      {/* Icon */}
      <span
        style={{
          fontSize: 26,
          filter: `drop-shadow(0 0 6px ${c})`,
          position: 'relative',
          zIndex: 2,
          lineHeight: 1,
        }}
      >
        {item.icon}
      </span>
    </div>
  );
}

function OrbitalArena({ activeIndex, setActiveIndex }) {
  const CX = 350;
  const CY = 260;
  const RX = 220;
  const RY = 140;
  const ORB_SIZE = 80;

  const orbPositions = ITEMS.map((_, i) => {
    const angle = (i / ITEMS.length) * 2 * Math.PI;
    return {
      left: CX + RX * Math.cos(angle) - ORB_SIZE / 2,
      top: CY + RY * Math.sin(angle) - ORB_SIZE / 2,
    };
  });

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 0,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 700,
          height: 520,
        }}
      >
        {/* Decorative background glow at center */}
        <div
          style={{
            position: 'absolute',
            left: CX - 120,
            top: CY - 120,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(226,201,126,0.06) 0%, rgba(226,201,126,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Dashed orbit ellipse */}
        <OrbitRing cx={CX} cy={CY} rx={RX} ry={RY} />

        {/* Center avatar */}
        <CenterAvatar />

        {/* Orbs */}
        {ITEMS.map((item, i) => (
          <PremiumOrb
            key={item.name}
            item={item}
            index={i}
            isActive={activeIndex === i}
            onClick={() => setActiveIndex(i)}
            left={orbPositions[i].left}
            top={orbPositions[i].top}
          />
        ))}

        {/* Orb name labels */}
        {ITEMS.map((item, i) => {
          const { left, top } = orbPositions[i];
          const isActive = activeIndex === i;
          const labelTop = top + ORB_SIZE + 8;
          return (
            <div
              key={`label-${item.name}`}
              style={{
                position: 'absolute',
                left: left + ORB_SIZE / 2,
                top: labelTop,
                transform: 'translateX(-50%)',
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: isActive ? item.color : 'rgba(255,255,255,0.35)',
                fontWeight: isActive ? 700 : 400,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                textShadow: isActive ? `0 0 10px ${item.color}88` : 'none',
                transition: 'color 0.3s ease',
              }}
            >
              {item.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StarRow({ stars }) {
  return (
    <div
      style={{
        fontSize: 16,
        color: '#e2c97e',
        letterSpacing: 2,
        marginTop: 6,
        textShadow: '0 0 8px rgba(226,201,126,0.6)',
      }}
    >
      {stars}
    </div>
  );
}

function Divider({ color }) {
  return (
    <div
      style={{
        borderBottom: `1px solid ${color || 'rgba(255,255,255,0.10)'}`,
        margin: '16px 0',
      }}
    />
  );
}

function SubStatRow({ label, val, color }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '5px 0',
        fontSize: 13,
        color: 'rgba(255,255,255,0.70)',
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 5px ${color}`,
            flexShrink: 0,
          }}
        />
        {label}
      </span>
      <span style={{ color: '#fff', fontWeight: 600 }}>{val}</span>
    </div>
  );
}

function SetBonusBlock({ label, text, color }) {
  return (
    <div
      style={{
        border: `1px solid ${color}33`,
        borderLeft: `3px solid ${color}99`,
        borderRadius: 4,
        padding: '8px 12px',
        marginBottom: 10,
        background: `${color}0a`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: color,
          marginBottom: 4,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.62)',
          lineHeight: 1.6,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function StatsPanel({ item }) {
  return (
    <div
      key={item.name}
      style={{
        width: '30%',
        minWidth: 260,
        background: 'rgba(8, 2, 25, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `3px solid ${item.color}`,
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        padding: '36px 28px',
        height: '100%',
        overflowY: 'auto',
        boxSizing: 'border-box',
        animation: 'panelFadeIn 0.35s ease both',
      }}
    >
      {/* Type label */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(226,201,126,0.55)',
          marginBottom: 8,
        }}
      >
        {item.type}
      </div>

      {/* Name */}
      <div
        style={{
          fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
          fontSize: 26,
          fontWeight: 700,
          color: item.color,
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
          textShadow: `0 0 24px ${item.color}66`,
          marginBottom: 4,
        }}
      >
        {item.name}
      </div>

      {/* Stars */}
      <StarRow stars={item.stars} />

      {/* Level */}
      <div
        style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.38)',
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          marginTop: 4,
          letterSpacing: '0.08em',
        }}
      >
        Level {item.level}
      </div>

      <Divider color={`${item.color}33`} />

      {/* Main stat */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.40)',
              marginBottom: 4,
            }}
          >
            HP
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: '#ffffff',
              fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
              lineHeight: 1,
            }}
          >
            {item.hp}
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: item.color,
            background: `${item.color}18`,
            border: `1px solid ${item.color}44`,
            padding: '3px 8px',
            borderRadius: 3,
          }}
        >
          {item.lang}
        </div>
      </div>

      <Divider />

      {/* Sub-stats */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.28)',
          marginBottom: 8,
        }}
      >
        Sub-stats
      </div>
      {item.subs.map((s) => (
        <SubStatRow key={s.label} label={s.label} val={s.val} color={item.color} />
      ))}

      <Divider />

      {/* Set bonus */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.28)',
          marginBottom: 10,
        }}
      >
        Set Bonus
      </div>
      <SetBonusBlock label="2-Piece" text={item.set2} color={item.color} />
      <SetBonusBlock label="4-Piece" text={item.set4} color={item.color} />

      <Divider />

      {/* Lore */}
      <div
        style={{
          fontSize: 11,
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.32)',
          lineHeight: 1.7,
          fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
        }}
      >
        "{item.lore}"
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------
export default function RadialOrbitalMenu() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    // Inject keyframes if not already present
    if (document.getElementById(KEYFRAMES_ID)) return;
    const style = document.createElement('style');
    style.id = KEYFRAMES_ID;
    style.textContent = buildKeyframesCSS();
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(KEYFRAMES_ID);
      if (el) el.remove();
    };
  }, []);

  const activeItem = ITEMS[activeIndex];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100vw',
        height: '100vh',
        background: '#05000f',
        overflow: 'hidden',
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        color: '#ffffff',
        position: 'relative',
      }}
    >
      {/* Ambient background radial */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(30,10,60,0.55) 0%, rgba(5,0,15,0) 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Top bar decoration */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background:
            `linear-gradient(to right, transparent, ${activeItem.color}88, transparent)`,
          transition: 'background 0.5s ease',
          zIndex: 20,
        }}
      />

      {/* Left nav */}
      <div style={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>
        <LeftNav />
      </div>

      {/* Orbital arena */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          alignItems: 'stretch',
          minWidth: 0,
        }}
      >
        <OrbitalArena activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
      </div>

      {/* Stats panel */}
      <div style={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>
        <StatsPanel item={activeItem} />
      </div>
    </div>
  );
}
