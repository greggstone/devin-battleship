import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { BattleLog } from './components/BattleLog';
import { GameBoard } from './components/GameBoard';
import { FleetStatus, PlacementPanel } from './components/PlacementPanel';
import { SplashScreen } from './components/SplashScreen';
import { shipFootprint } from './game/board';
import {
  canPlayerFire,
  checkPlayerPlacement,
  currentPlacementShip,
} from './game/game';
import type { Coord, Phase, PlacementError, Player } from './game/types';
import { useGame } from './hooks/useGame';

function statusText(phase: Phase, winner: Player | null): string {
  switch (phase) {
    case 'placement':
      return 'Deploy your fleet';
    case 'player-turn':
      return 'Your turn — fire at the enemy waters';
    case 'ai-turn':
      return 'Enemy is taking aim…';
    default:
      return winner === 'player' ? 'You win!' : 'The AI wins';
  }
}

function enemyBoardSubtitle(phase: Phase, revealed: boolean): string {
  switch (phase) {
    case 'player-turn':
      return 'Click a cell to fire';
    case 'ai-turn':
      return 'Hold fire until your turn';
    case 'game-over':
      return revealed ? 'Battle over — enemy fleet revealed' : 'Battle over';
    default:
      return 'Waiting for the battle to start';
  }
}

export default function App() {
  const { state, actions } = useGame();
  const [hovered, setHovered] = useState<Coord | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const isPlacement = state.phase === 'placement';
  // Once the player has lost there is nothing left to hide, so show the ships
  // they never found.
  const revealEnemyFleet = state.phase === 'game-over' && state.winner === 'ai';

  // Rotate with the keyboard so placement does not require the mouse alone.
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'r' && isPlacement) actions.rotate();
    },
    [actions, isPlacement],
  );
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const placementCheck = hovered ? checkPlayerPlacement(state, hovered) : null;
  const placementShip = currentPlacementShip(state);
  const preview =
    isPlacement && hovered && placementShip && placementCheck
      ? {
          cells: shipFootprint(hovered, placementShip.length, state.orientation),
          valid: placementCheck.valid,
        }
      : undefined;
  const hoverError: PlacementError | null =
    placementCheck && !placementCheck.valid ? placementCheck.error : null;

  if (showSplash) return <SplashScreen onEnter={() => setShowSplash(false)} />;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Battleship</h1>
        <div className={`status status--${state.phase}`} role="status">
          {statusText(state.phase, state.winner)}
        </div>
        <button type="button" onClick={actions.newGame}>
          New game
        </button>
      </header>

      <main className="app__main">
        <GameBoard
          title="Your waters"
          subtitle={isPlacement ? 'Click to place ships' : 'Enemy shots land here'}
          board={state.playerBoard}
          variant="player"
          interactive={isPlacement && !!placementShip}
          preview={preview}
          onCellClick={actions.placeShip}
          onCellHover={setHovered}
        />

        <aside className="app__side">
          {isPlacement ? (
            <PlacementPanel
              state={state}
              hoverError={hoverError}
              onRotate={actions.rotate}
              onRandomize={actions.randomizeShips}
              onClear={actions.clearShips}
              onStart={actions.startBattle}
            />
          ) : (
            <>
              <FleetStatus state={state} revealEnemyDamage={revealEnemyFleet} />
              <BattleLog entries={state.log} />
            </>
          )}
        </aside>

        <GameBoard
          title="Enemy waters"
          subtitle={enemyBoardSubtitle(state.phase, revealEnemyFleet)}
          board={state.aiBoard}
          variant="opponent"
          interactive={state.phase === 'player-turn'}
          revealShips={revealEnemyFleet}
          onCellClick={(coord) => {
            if (canPlayerFire(state, coord)) actions.fire(coord);
          }}
        />
      </main>

      {state.phase === 'game-over' && (
        <div className="result" role="alertdialog" aria-label="Game over">
          <h2>{state.winner === 'player' ? 'Victory!' : 'Defeat'}</h2>
          <p>
            {state.winner === 'player'
              ? 'You sank the entire enemy fleet.'
              : 'The AI sank your entire fleet.'}
          </p>
          <button type="button" className="button--primary" onClick={actions.newGame}>
            Play again
          </button>
        </div>
      )}
    </div>
  );
}
