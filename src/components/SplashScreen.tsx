import './SplashScreen.css';

export function SplashScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="splash" role="dialog" aria-label="Welcome">
      <button type="button" className="splash__enter" onClick={onEnter} autoFocus>
        Enter
      </button>
    </div>
  );
}
