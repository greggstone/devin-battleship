import { coordKey, hasBeenShot, isInsideBoard } from './board';
import {
  BOARD_SIZE,
  type Board,
  type Coord,
  type Rng,
  type ShotOutcome,
} from './types';

/**
 * Hunt/target AI.
 *
 * - "Hunt" mode fires at random unexplored cells, preferring a checkerboard
 *   pattern (any ship is at least 2 cells long, so half the cells suffice to
 *   find every ship).
 * - "Target" mode kicks in after a hit: neighbours of the hit are queued, and
 *   once two hits line up the AI only extends along that line.
 */
export interface AiState {
  /** Hits on a ship that has not been sunk yet. */
  activeHits: Coord[];
  /** Cells to try next, highest priority first. */
  targetQueue: Coord[];
}

export function createAiState(): AiState {
  return { activeHits: [], targetQueue: [] };
}

export const isHunting = (state: AiState): boolean =>
  state.targetQueue.length === 0;

function neighbours({ row, col }: Coord): Coord[] {
  return [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ];
}

function isShootable(board: Board, coord: Coord): boolean {
  return isInsideBoard(coord) && !hasBeenShot(board, coord);
}

function dedupe(coords: Coord[]): Coord[] {
  const seen = new Set<string>();
  return coords.filter((coord) => {
    const key = coordKey(coord);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Cells that would extend the line formed by the current hits, if they are collinear. */
function lineExtensions(hits: Coord[]): Coord[] | null {
  const sameRow = hits.every((h) => h.row === hits[0].row);
  const sameCol = hits.every((h) => h.col === hits[0].col);
  if (!sameRow && !sameCol) return null;

  if (sameRow) {
    const cols = hits.map((h) => h.col);
    return [
      { row: hits[0].row, col: Math.min(...cols) - 1 },
      { row: hits[0].row, col: Math.max(...cols) + 1 },
    ];
  }
  const rows = hits.map((h) => h.row);
  return [
    { row: Math.min(...rows) - 1, col: hits[0].col },
    { row: Math.max(...rows) + 1, col: hits[0].col },
  ];
}

function availableCells(board: Board): Coord[] {
  const cells: Coord[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!hasBeenShot(board, { row, col })) cells.push({ row, col });
    }
  }
  return cells;
}

/**
 * Picks the AI's next shot against `board`. Returns `null` only when every cell
 * has already been fired at, which cannot happen while the game is running.
 */
export function chooseShot(
  board: Board,
  state: AiState,
  rng: Rng = Math.random,
): Coord | null {
  const queued = state.targetQueue.find((coord) => isShootable(board, coord));
  if (queued) return queued;

  const available = availableCells(board);
  if (available.length === 0) return null;
  const parityCells = available.filter(({ row, col }) => (row + col) % 2 === 0);
  const pool = parityCells.length > 0 ? parityCells : available;
  return pool[Math.floor(rng() * pool.length)];
}

/**
 * Updates the AI's memory after its shot resolves. `board` must be the board
 * *after* the shot so already-fired cells are never queued.
 */
export function recordShot(
  state: AiState,
  board: Board,
  target: Coord,
  outcome: ShotOutcome,
): AiState {
  const targetQueue = state.targetQueue.filter(
    (coord) => coordKey(coord) !== coordKey(target) && isShootable(board, coord),
  );

  if (outcome === 'miss') return { ...state, targetQueue };
  // A sunk ship tells us nothing more; drop the trail and go back to hunting.
  if (outcome === 'sunk') return createAiState();

  const activeHits = [...state.activeHits, target];
  const extensions = activeHits.length > 1 ? lineExtensions(activeHits) : null;
  const candidates = (extensions ?? neighbours(target)).filter((coord) =>
    isShootable(board, coord),
  );

  return {
    activeHits,
    // Line extensions take priority; keep earlier candidates as a fallback for
    // when the line turns out to be a dead end.
    targetQueue: dedupe([...candidates, ...targetQueue]),
  };
}
