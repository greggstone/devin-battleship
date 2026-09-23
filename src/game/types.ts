/** Core domain types shared by the game logic and the UI. */

export const BOARD_SIZE = 10;

export type Orientation = 'horizontal' | 'vertical';

export interface Coord {
  row: number;
  col: number;
}

/** Definition of a ship class in the fleet (independent of any board). */
export interface ShipSpec {
  id: string;
  name: string;
  length: number;
}

/** A ship that has been placed on a board, tracking which of its cells are hit. */
export interface Ship extends ShipSpec {
  cells: Coord[];
  hits: boolean[];
}

/** What is known about a cell as a result of shots fired at it. */
export type ShotMark = 'hit' | 'miss';

export interface Board {
  ships: Ship[];
  /** BOARD_SIZE x BOARD_SIZE grid; `null` means no shot has been fired there. */
  shots: (ShotMark | null)[][];
}

export type ShotOutcome = 'miss' | 'hit' | 'sunk';

export interface ShotResult {
  board: Board;
  outcome: ShotOutcome;
  /** The ship that was sunk by this shot, if any. */
  sunkShip: Ship | null;
  /** True when every ship on the board is now sunk. */
  fleetDestroyed: boolean;
}

export type PlacementError =
  | 'out-of-bounds'
  | 'overlap'
  | 'already-placed'
  | 'unknown-ship';

export type Player = 'player' | 'ai';

export type Phase = 'placement' | 'player-turn' | 'ai-turn' | 'game-over';

/** Deterministic-friendly random source: returns a float in [0, 1). */
export type Rng = () => number;

/** The standard fleet, largest first. */
export const FLEET: readonly ShipSpec[] = [
  { id: 'carrier', name: 'Carrier', length: 5 },
  { id: 'battleship', name: 'Battleship', length: 4 },
  { id: 'cruiser', name: 'Cruiser', length: 3 },
  { id: 'submarine', name: 'Submarine', length: 3 },
  { id: 'destroyer', name: 'Destroyer', length: 2 },
];
