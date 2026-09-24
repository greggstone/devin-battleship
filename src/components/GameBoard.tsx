import { coordKey, isSunk } from '../game/board';
import { BOARD_SIZE, type Board, type Coord } from '../game/types';

export interface GameBoardProps {
  title: string;
  subtitle: string;
  board: Board;
  /** `player` shows its own ships; `opponent` hides ships until they are hit. */
  variant: 'player' | 'opponent';
  /** When false, cells are not clickable (wrong phase, game over, ...). */
  interactive: boolean;
  /** Show intact opponent ships too, e.g. after the player has lost. */
  revealShips?: boolean;
  /** Footprint of the ship being placed, highlighted under the cursor. */
  preview?: { cells: Coord[]; valid: boolean };
  onCellClick?: (coord: Coord) => void;
  onCellHover?: (coord: Coord | null) => void;
}

const COLUMN_LABELS = Array.from({ length: BOARD_SIZE }, (_, i) =>
  String.fromCharCode(65 + i),
);

const cellLabel = ({ row, col }: Coord) => `${COLUMN_LABELS[col]}${row + 1}`;

function cellStatusText(
  shot: Board['shots'][number][number],
  isShip: boolean,
  sunk: boolean,
  variant: GameBoardProps['variant'],
): string {
  if (shot === 'hit') return sunk ? 'sunk ship' : 'hit';
  if (shot === 'miss') return 'miss';
  if (!isShip) return 'unexplored';
  return variant === 'player' ? 'your ship' : 'enemy ship';
}

export function GameBoard({
  title,
  subtitle,
  board,
  variant,
  interactive,
  revealShips = false,
  preview,
  onCellClick,
  onCellHover,
}: GameBoardProps) {
  const shipCells = new Set<string>();
  const sunkCells = new Set<string>();
  for (const ship of board.ships) {
    const sunk = isSunk(ship);
    for (const cell of ship.cells) {
      shipCells.add(coordKey(cell));
      if (sunk) sunkCells.add(coordKey(cell));
    }
  }
  const previewCells = new Set((preview?.cells ?? []).map(coordKey));

  return (
    <section className={`board board--${variant}`}>
      <header className="board__header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>

      {/* Each row is a grid of one label column plus BOARD_SIZE cells. */}
      <div
        className="board__grid"
        onMouseLeave={() => onCellHover?.(null)}
        role="grid"
        aria-label={title}
      >
        <div className="board__row" aria-hidden="true">
          <div className="board__label" />
          {COLUMN_LABELS.map((label) => (
            <div key={label} className="board__label">
              {label}
            </div>
          ))}
        </div>

        {Array.from({ length: BOARD_SIZE }, (_, row) => (
          <div key={row} className="board__row" role="row">
            <div className="board__label">{row + 1}</div>
            {Array.from({ length: BOARD_SIZE }, (_, col) => {
              const coord: Coord = { row, col };
              const key = coordKey(coord);
              const shot = board.shots[row][col];
              const sunk = sunkCells.has(key);
              // The opponent's intact ships stay hidden until the game is over;
              // hits reveal themselves.
              const showShip =
                shipCells.has(key) && (variant === 'player' || sunk || revealShips);
              const isRevealed = showShip && variant === 'opponent' && shot === null;
              const isPreview = previewCells.has(key);

              const classNames = [
                'cell',
                showShip && 'cell--ship',
                isRevealed && 'cell--revealed',
                shot === 'hit' && 'cell--hit',
                shot === 'miss' && 'cell--miss',
                sunk && shot === 'hit' && 'cell--sunk',
                isPreview && (preview?.valid ? 'cell--preview' : 'cell--preview-invalid'),
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  className={classNames}
                  // Cells that were already fired at can never be clicked again.
                  disabled={!interactive || shot !== null}
                  onClick={() => onCellClick?.(coord)}
                  onMouseEnter={() => onCellHover?.(coord)}
                  onFocus={() => onCellHover?.(coord)}
                  aria-label={`${cellLabel(coord)} ${cellStatusText(
                    shot,
                    showShip,
                    sunk,
                    variant,
                  )}`}
                >
                  <span className="cell__mark" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
