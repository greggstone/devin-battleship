import './SplashScreen.css';

interface SplashScreenProps {
  onEnter: () => void;
}

export function SplashScreen({ onEnter }: SplashScreenProps) {
  return (
    <div className="splash" role="dialog" aria-label="Welcome">
      <div className="splash__waves" aria-hidden="true" />
      <button type="button" className="splash__enter" onClick={onEnter} autoFocus>
        Enter
      </button>
    </div>
  );
}
