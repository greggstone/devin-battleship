import {
  chooseShot,
  createAiState,
  recordShot,
  type AiState,
} from './ai';
import {
  createEmptyBoard,
  createRandomBoard,
  fireAt,
  hasBeenShot,
  placeShip,
  validatePlacement,
  type PlacementCheck,
} from './board';
import {
  FLEET,
  type Board,
  type Coord,
  type Orientation,
  type Phase,
  type Player,
  type Rng,
  type ShotOutcome,
} from './types';

export interface LogEntry {
  id: number;
  actor: Player;
  text: string;
}

export interface GameState {
  phase: Phase;
  /** The human's board: their ships, plus the AI's shots at them. */
  playerBoard: Board;
  /** The AI's board: its ships (hidden in the UI), plus the human's shots. */
  aiBoard: Board;
  aiState: AiState;
  winner: Player | null;
  log: LogEntry[];
  /** Index into FLEET of the ship the human is currently placing. */
  placementIndex: number;
  orientation: Orientation;
}

const MAX_LOG_ENTRIES = 40;

function appendLog(state: GameState, actor: Player, text: string): LogEntry[] {
  const entry: LogEntry = { id: (state.log[0]?.id ?? 0) + 1, actor, text };
  // Newest first so the UI can render the log without reversing it.
  return [entry, ...state.log].slice(0, MAX_LOG_ENTRIES);
}

const cellName = ({ row, col }: Coord): string =>
  `${String.fromCharCode(65 + col)}${row + 1}`;

function describeShot(
  target: Coord,
  outcome: ShotOutcome,
  sunkShipName?: string,
): string {
  if (outcome === 'sunk') return `${cellName(target)}: sunk the ${sunkShipName}!`;
  return `${cellName(target)}: ${outcome}`;
}

export function createGame(rng: Rng = Math.random): GameState {
  return {
    phase: 'placement',
    playerBoard: createEmptyBoard(),
    aiBoard: createRandomBoard(rng),
    aiState: createAiState(),
    winner: null,
    log: [],
    placementIndex: 0,
    orientation: 'horizontal',
  };
}

export const currentPlacementShip = (state: GameState) =>
  state.placementIndex < FLEET.length ? FLEET[state.placementIndex] : null;

export const allShipsPlaced = (state: GameState): boolean =>
  state.placementIndex >= FLEET.length;

export function toggleOrientation(state: GameState): GameState {
  return {
    ...state,
    orientation: state.orientation === 'horizontal' ? 'vertical' : 'horizontal',
  };
}

/** Whether the ship being placed fits at `start`; used for live UI feedback. */
export function checkPlayerPlacement(
  state: GameState,
  start: Coord,
): PlacementCheck | null {
  const spec = currentPlacementShip(state);
  if (!spec || state.phase !== 'placement') return null;
  return validatePlacement(state.playerBoard, spec, start, state.orientation);
}

/** Places the next ship in the fleet. Invalid placements leave the state unchanged. */
export function placePlayerShip(state: GameState, start: Coord): GameState {
  const spec = currentPlacementShip(state);
  if (!spec || state.phase !== 'placement') return state;
  const playerBoard = placeShip(state.playerBoard, spec, start, state.orientation);
  if (!playerBoard) return state;
  return { ...state, playerBoard, placementIndex: state.placementIndex + 1 };
}

export function randomizePlayerBoard(
  state: GameState,
  rng: Rng = Math.random,
): GameState {
  if (state.phase !== 'placement') return state;
  return {
    ...state,
    playerBoard: createRandomBoard(rng),
    placementIndex: FLEET.length,
  };
}

export function resetPlacement(state: GameState): GameState {
  if (state.phase !== 'placement') return state;
  return { ...state, playerBoard: createEmptyBoard(), placementIndex: 0 };
}

export function startBattle(state: GameState): GameState {
  if (state.phase !== 'placement' || !allShipsPlaced(state)) return state;
  return { ...state, phase: 'player-turn' };
}

/** Whether the human may fire at `target` right now. */
export function canPlayerFire(state: GameState, target: Coord): boolean {
  return state.phase === 'player-turn' && !hasBeenShot(state.aiBoard, target);
}

export function playerFire(state: GameState, target: Coord): GameState {
  if (!canPlayerFire(state, target)) return state;
  const { board, outcome, sunkShip, fleetDestroyed } = fireAt(state.aiBoard, target);
  const log = appendLog(
    state,
    'player',
    describeShot(target, outcome, sunkShip?.name),
  );
  return {
    ...state,
    aiBoard: board,
    log,
    phase: fleetDestroyed ? 'game-over' : 'ai-turn',
    winner: fleetDestroyed ? 'player' : null,
  };
}

/** Resolves one AI shot. Safe to call only while `phase === 'ai-turn'`. */
export function aiFire(state: GameState, rng: Rng = Math.random): GameState {
  if (state.phase !== 'ai-turn') return state;
  const target = chooseShot(state.playerBoard, state.aiState, rng);
  // Only possible if the board is completely explored, which ends the game first.
  if (!target) return { ...state, phase: 'player-turn' };

  const { board, outcome, sunkShip, fleetDestroyed } = fireAt(
    state.playerBoard,
    target,
  );
  const log = appendLog(state, 'ai', describeShot(target, outcome, sunkShip?.name));
  return {
    ...state,
    playerBoard: board,
    aiState: recordShot(state.aiState, board, target, outcome),
    log,
    phase: fleetDestroyed ? 'game-over' : 'player-turn',
    winner: fleetDestroyed ? 'ai' : null,
  };
}
