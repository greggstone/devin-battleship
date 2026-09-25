import './SplashScreen.css';

function BattleshipLogo() {
  return (
    <svg
      className="splash__ship"
      viewBox="0 0 320 120"
      role="img"
      aria-label="Battleship silhouette"
    >
      {/* Waterline */}
      <path
        d="M0 98 Q 20 92 40 98 T 80 98 T 120 98 T 160 98 T 200 98 T 240 98 T 280 98 T 320 98"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Hull */}
      <path d="M14 78 L306 78 L284 96 L36 96 Z" fill="currentColor" />
      {/* Superstructure */}
      <rect x="112" y="60" width="96" height="18" fill="currentColor" />
      <rect x="130" y="44" width="60" height="16" fill="currentColor" />
      <rect x="146" y="30" width="28" height="14" fill="currentColor" />
      {/* Mast */}
      <rect x="158" y="8" width="4" height="22" fill="currentColor" />
      <rect x="150" y="14" width="20" height="3" fill="currentColor" />
      {/* Funnel */}
      <rect x="196" y="48" width="12" height="12" fill="currentColor" />
      {/* Fore and aft turrets */}
      <rect x="66" y="66" width="30" height="12" rx="2" fill="currentColor" />
      <rect x="40" y="70" width="34" height="3" fill="currentColor" />
      <rect x="224" y="66" width="30" height="12" rx="2" fill="currentColor" />
      <rect x="246" y="70" width="34" height="3" fill="currentColor" />
    </svg>
  );
}

export function SplashScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="splash" role="dialog" aria-labelledby="splash-title">
      <div className="splash__logo">
        <BattleshipLogo />
        <h1 id="splash-title" className="splash__title">
          Battleship
        </h1>
        <p className="splash__tagline">Deploy your fleet. Sink theirs.</p>
      </div>
      <button type="button" className="button--primary splash__enter" onClick={onEnter}>
        Enter
      </button>
    </div>
  );
}
