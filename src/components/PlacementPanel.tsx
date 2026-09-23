import { isSunk } from '../game/board';
import { allShipsPlaced, currentPlacementShip, type GameState } from '../game/game';
import { FLEET, type PlacementError } from '../game/types';

export interface PlacementPanelProps {
  state: GameState;
  /** Why the cell under the cursor cannot take the current ship, if invalid. */
  hoverError: PlacementError | null;
  onRotate: () => void;
  onRandomize: () => void;
  onClear: () => void;
  onStart: () => void;
}

const ERROR_MESSAGES: Record<PlacementError, string> = {
  'out-of-bounds': 'That ship would hang off the edge of the board.',
  overlap: 'That ship would overlap one you already placed.',
  'already-placed': 'That ship has already been placed.',
  'unknown-ship': 'Unknown ship.',
};

export function PlacementPanel({
  state,
  hoverError,
  onRotate,
  onRandomize,
  onClear,
  onStart,
}: PlacementPanelProps) {
  const ship = currentPlacementShip(state);
  const ready = allShipsPlaced(state);

  return (
    <div className="panel">
      <h2 className="panel__title">Place your fleet</h2>
      <p className="panel__hint">
        {ready
          ? 'All ships placed. Start the battle when you are ready.'
          : `Click your board to place the ${ship?.name} (${ship?.length} cells, ${state.orientation}).`}
      </p>

      <ol className="fleet">
        {FLEET.map((spec, index) => {
          const placed = index < state.placementIndex;
          const active = !ready && index === state.placementIndex;
          return (
            <li
              key={spec.id}
              className={`fleet__item${placed ? ' fleet__item--placed' : ''}${
                active ? ' fleet__item--active' : ''
              }`}
            >
              <span className="fleet__name">{spec.name}</span>
              <span className="fleet__pips" aria-hidden="true">
                {'■'.repeat(spec.length)}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="panel__actions">
        <button type="button" onClick={onRotate} disabled={ready}>
          Rotate ({state.orientation === 'horizontal' ? 'H' : 'V'})
        </button>
        <button type="button" onClick={onRandomize}>
          Random
        </button>
        <button type="button" onClick={onClear} disabled={state.placementIndex === 0}>
          Clear
        </button>
        <button type="button" className="button--primary" onClick={onStart} disabled={!ready}>
          Start battle
        </button>
      </div>

      <p className="panel__status" role="status">
        {hoverError ? ERROR_MESSAGES[hoverError] : '\u00a0'}
      </p>
      <p className="panel__hint panel__hint--muted">
        Tip: press <kbd>R</kbd> to rotate.
      </p>
    </div>
  );
}

export interface FleetStatusProps {
  state: GameState;
}

/** Remaining/sunk ships for both sides during the battle. */
export function FleetStatus({ state }: FleetStatusProps) {
  const sides = [
    // Damage is only shown for your own fleet: revealing which enemy ship a hit
    // belongs to would give away where the rest of that ship must be.
    { label: 'Your fleet', ships: state.playerBoard.ships, showDamage: true },
    { label: 'Enemy fleet', ships: state.aiBoard.ships, showDamage: false },
  ];

  return (
    <div className="fleet-status">
      {sides.map(({ label, ships, showDamage }) => (
        <div key={label}>
          <h3>{label}</h3>
          <ul className="fleet">
            {ships.map((ship) => {
              const sunk = isSunk(ship);
              return (
                <li
                  key={ship.id}
                  className={`fleet__item${sunk ? ' fleet__item--sunk' : ''}`}
                >
                  <span className="fleet__name">{ship.name}</span>
                  <span className="fleet__pips" aria-hidden="true">
                    {ship.hits
                      .map((hit) => (sunk || (showDamage && hit) ? '✕' : '■'))
                      .join('')}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
