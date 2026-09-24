import './SplashScreen.css';

function BattleshipLogo() {
  return (
    <svg
      className="splash__logo"
      viewBox="0 0 320 160"
      role="img"
      aria-label="Battleship logo"
    >
      <defs>
        <linearGradient id="splash-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="splash-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </linearGradient>
        <linearGradient id="splash-hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      <circle cx="160" cy="80" r="78" fill="url(#splash-sky)" stroke="#38bdf8" strokeWidth="3" />
      <circle cx="160" cy="80" r="70" fill="none" stroke="#38bdf8" strokeOpacity="0.35" strokeDasharray="4 6" />

      <circle cx="238" cy="42" r="10" fill="#fef3c7" opacity="0.9" />

      {/* Ship: hull, superstructure, turrets */}
      <g fill="url(#splash-hull)" stroke="#94a3b8" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M84 104 L100 118 L226 118 L246 104 Z" />
        <rect x="128" y="84" width="72" height="20" rx="2" />
        <rect x="146" y="68" width="34" height="16" rx="2" />
        <rect x="158" y="46" width="6" height="22" />
        <rect x="108" y="94" width="18" height="10" rx="2" />
        <rect x="204" y="94" width="18" height="10" rx="2" />
      </g>
      <g stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round">
        <line x1="112" y1="96" x2="90" y2="90" />
        <line x1="218" y1="96" x2="240" y2="90" />
      </g>
      <circle cx="161" cy="44" r="3" fill="#f87171" />

      {/* Waves */}
      <path
        d="M82 120 Q96 110 110 120 T138 120 T166 120 T194 120 T222 120 T250 120 L250 158 L82 158 Z"
        fill="url(#splash-sea)"
      />
      <path
        d="M82 130 Q96 122 110 130 T138 130 T166 130 T194 130 T222 130 T250 130"
        fill="none"
        stroke="#bae6fd"
        strokeWidth="2"
        strokeOpacity="0.6"
      />
    </svg>
  );
}

export function SplashScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="splash" role="dialog" aria-labelledby="splash-title">
      <div className="splash__card">
        <BattleshipLogo />
        <h1 id="splash-title" className="splash__title">
          Battleship
        </h1>
        <p className="splash__tagline">Deploy your fleet. Sink theirs first.</p>
        <button type="button" className="button--primary splash__enter" onClick={onEnter}>
          Enter
        </button>
      </div>
    </div>
  );
}
