import { useState } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  /** Called once the doors have fully opened so the parent can unmount the splash. */
  onEnter: () => void;
}

export function SplashScreen({ onEnter }: SplashScreenProps) {
  const [opening, setOpening] = useState(false);

  return (
    <div
      className={`splash${opening ? ' splash--opening' : ''}`}
      role="dialog"
      aria-label="Welcome to Battleship"
      aria-hidden={opening}
    >
      <div className="splash__doors">
        <div className="splash__door splash__door--left" aria-hidden="true">
          <DoorPanel side="left" />
        </div>
        <div className="splash__door splash__door--right" aria-hidden="true">
          <DoorPanel side="right" />
        </div>
      </div>

      <div className="splash__content">
        <div className="splash__plaque">
          <p className="splash__eyebrow">Naval Command · Hangar Bay 7</p>
          <h1 className="splash__title">Battleship</h1>
          <p className="splash__tagline">Deploy your fleet. Sink theirs.</p>
          <button
            type="button"
            className="splash__enter"
            onClick={() => setOpening(true)}
            disabled={opening}
            autoFocus
          >
            Enter
          </button>
        </div>
      </div>

      {/* The right door finishes last, so its transition marks the end of the animation. */}
      <div
        className="splash__sentinel"
        onTransitionEnd={(event) => {
          if (opening && event.propertyName === 'opacity') onEnter();
        }}
      />
    </div>
  );
}

function DoorPanel({ side }: { side: 'left' | 'right' }) {
  return (
    <div className="door">
      <div className="door__frame" />
      <div className="door__rivets door__rivets--top" />
      <div className="door__rivets door__rivets--bottom" />
      <div className="door__stripe" />
      <div className="door__stencil">{side === 'left' ? 'BAY' : '07'}</div>
      <div className="door__handle" />
    </div>
  );
}
