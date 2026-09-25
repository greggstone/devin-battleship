import { useEffect, useState } from 'react';
import './SplashScreen.css';

/** How long the door-opening animation runs; mirrored by `--splash-duration`. */
export const SPLASH_OPEN_MS = 1000;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function SplashScreen({ onEnter }: { onEnter: () => void }) {
  const [opening, setOpening] = useState(false);

  // Hand control to the game once the doors have swung out of the way. With
  // reduced motion there is nothing to wait for, so the splash goes straight away.
  useEffect(() => {
    if (!opening) return;
    if (prefersReducedMotion()) {
      onEnter();
      return;
    }
    const timer = window.setTimeout(onEnter, SPLASH_OPEN_MS);
    return () => window.clearTimeout(timer);
  }, [opening, onEnter]);

  return (
    <div
      className={`splash${opening ? ' splash--opening' : ''}`}
      role="dialog"
      aria-label="Welcome to Battleship"
      aria-hidden={opening}
    >
      <div className="splash__door splash__door--left" aria-hidden="true">
        <span className="splash__rivets" />
        <span className="splash__porthole" />
      </div>
      <div className="splash__door splash__door--right" aria-hidden="true">
        <span className="splash__rivets" />
        <span className="splash__porthole" />
      </div>
      <div className="splash__content">
        <h1 className="splash__title">Battleship</h1>
        <p className="splash__subtitle">Open the bulkhead to begin</p>
        <button
          type="button"
          className="button--primary splash__enter"
          onClick={() => setOpening(true)}
          disabled={opening}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
