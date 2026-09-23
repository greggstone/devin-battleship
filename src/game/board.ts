import {
  BOARD_SIZE,
  FLEET,
  type Board,
  type Coord,
  type Orientation,
  type PlacementError,
  type Rng,
  type Ship,
  type ShipSpec,
  type ShotResult,
} from './types';

export function createEmptyBoard(): Board {
  return {
    ships: [],
    shots: Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => null),
    ),
  };
}

export function isInsideBoard({ row, col }: Coord): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function sameCoord(a: Coord, b: Coord): boolean {
  return a.row === b.row && a.col === b.col;
}

export function coordKey({ row, col }: Coord): string {
  return `${row},${col}`;
}

/**
 * The cells a ship would occupy. Cells outside the board are still returned so
 * callers can highlight the full (invalid) footprint during placement.
 */
export function shipFootprint(
  start: Coord,
  length: number,
  orientation: Orientation,
): Coord[] {
  return Array.from({ length }, (_, i) =>
    orientation === 'horizontal'
      ? { row: start.row, col: start.col + i }
      : { row: start.row + i, col: start.col },
  );
}

export function occupiedCells(board: Board): Set<string> {
  const cells = new Set<string>();
  for (const ship of board.ships) {
    for (const cell of ship.cells) cells.add(coordKey(cell));
  }
  return cells;
}

export type PlacementCheck =
  | { valid: true }
  | { valid: false; error: PlacementError };

export function validatePlacement(
  board: Board,
  spec: ShipSpec,
  start: Coord,
  orientation: Orientation,
): PlacementCheck {
  if (!FLEET.some((s) => s.id === spec.id)) {
    return { valid: false, error: 'unknown-ship' };
  }
  if (board.ships.some((s) => s.id === spec.id)) {
    return { valid: false, error: 'already-placed' };
  }
  const footprint = shipFootprint(start, spec.length, orientation);
  if (!footprint.every(isInsideBoard)) {
    return { valid: false, error: 'out-of-bounds' };
  }
  const taken = occupiedCells(board);
  if (footprint.some((cell) => taken.has(coordKey(cell)))) {
    return { valid: false, error: 'overlap' };
  }
  return { valid: true };
}

/** Returns a new board with the ship placed, or `null` if the placement is invalid. */
export function placeShip(
  board: Board,
  spec: ShipSpec,
  start: Coord,
  orientation: Orientation,
): Board | null {
  if (!validatePlacement(board, spec, start, orientation).valid) return null;
  const ship: Ship = {
    ...spec,
    cells: shipFootprint(start, spec.length, orientation),
    hits: Array.from({ length: spec.length }, () => false),
  };
  return { ...board, ships: [...board.ships, ship] };
}

export function isSunk(ship: Ship): boolean {
  return ship.hits.every(Boolean);
}

export function isFleetDestroyed(board: Board): boolean {
  return board.ships.length > 0 && board.ships.every(isSunk);
}

export function hasBeenShot(board: Board, { row, col }: Coord): boolean {
  return board.shots[row][col] !== null;
}

/**
 * Fires at a cell and returns the resulting board plus what happened.
 * Throws on out-of-bounds or repeated shots; callers must check `hasBeenShot`
 * first so duplicate shots can never silently consume a turn.
 */
export function fireAt(board: Board, target: Coord): ShotResult {
  if (!isInsideBoard(target)) {
    throw new RangeError(`Shot outside the board: ${coordKey(target)}`);
  }
  if (hasBeenShot(board, target)) {
    throw new Error(`Cell already fired at: ${coordKey(target)}`);
  }

  const hitShipIndex = board.ships.findIndex((ship) =>
    ship.cells.some((cell) => sameCoord(cell, target)),
  );
  const isHit = hitShipIndex !== -1;

  const ships = board.ships.map((ship, i) => {
    if (i !== hitShipIndex) return ship;
    const hits = [...ship.hits];
    hits[ship.cells.findIndex((cell) => sameCoord(cell, target))] = true;
    return { ...ship, hits };
  });
  const hitShip = isHit ? ships[hitShipIndex] : null;
  const sunkShip = hitShip && isSunk(hitShip) ? hitShip : null;

  const shots = board.shots.map((row, r) =>
    r === target.row
      ? row.map((mark, c) => (c === target.col ? (isHit ? 'hit' : 'miss') : mark))
      : row,
  );
  const nextBoard: Board = { ships, shots };

  return {
    board: nextBoard,
    outcome: sunkShip ? 'sunk' : isHit ? 'hit' : 'miss',
    sunkShip,
    fleetDestroyed: isFleetDestroyed(nextBoard),
  };
}

function randomInt(rng: Rng, maxExclusive: number): number {
  return Math.floor(rng() * maxExclusive);
}

/** Places the whole fleet at random, legally (no overlaps, nothing off-board). */
export function createRandomBoard(rng: Rng = Math.random): Board {
  let board = createEmptyBoard();
  for (const spec of FLEET) {
    let placed: Board | null = null;
    // The board is sparse enough that rejection sampling terminates quickly;
    // the attempt cap only guards against a pathological rng.
    for (let attempt = 0; attempt < 500 && !placed; attempt++) {
      const orientation: Orientation = rng() < 0.5 ? 'horizontal' : 'vertical';
      const start: Coord = {
        row: randomInt(rng, BOARD_SIZE),
        col: randomInt(rng, BOARD_SIZE),
      };
      placed = placeShip(board, spec, start, orientation);
    }
    if (!placed) throw new Error(`Could not place ${spec.name} randomly`);
    board = placed;
  }
  return board;
}
