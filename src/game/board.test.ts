import { describe, expect, it } from 'vitest';
import {
  createEmptyBoard,
  createRandomBoard,
  fireAt,
  hasBeenShot,
  isFleetDestroyed,
  occupiedCells,
  placeShip,
  shipFootprint,
  validatePlacement,
} from './board';
import { BOARD_SIZE, FLEET, type Board, type Coord } from './types';

const carrier = FLEET[0]; // length 5
const destroyer = FLEET[4]; // length 2

const at = (row: number, col: number): Coord => ({ row, col });

describe('shipFootprint', () => {
  it('lays cells out horizontally and vertically', () => {
    expect(shipFootprint(at(2, 3), 3, 'horizontal')).toEqual([
      at(2, 3),
      at(2, 4),
      at(2, 5),
    ]);
    expect(shipFootprint(at(2, 3), 3, 'vertical')).toEqual([
      at(2, 3),
      at(3, 3),
      at(4, 3),
    ]);
  });
});

describe('validatePlacement', () => {
  it('accepts a ship that fits on an empty board', () => {
    expect(
      validatePlacement(createEmptyBoard(), carrier, at(0, 0), 'horizontal'),
    ).toEqual({ valid: true });
  });

  it('rejects ships that run off the right edge', () => {
    expect(
      validatePlacement(createEmptyBoard(), carrier, at(0, 6), 'horizontal'),
    ).toEqual({ valid: false, error: 'out-of-bounds' });
  });

  it('rejects ships that run off the bottom edge', () => {
    expect(
      validatePlacement(createEmptyBoard(), carrier, at(6, 0), 'vertical'),
    ).toEqual({ valid: false, error: 'out-of-bounds' });
  });

  it('rejects negative starting coordinates', () => {
    expect(
      validatePlacement(createEmptyBoard(), destroyer, at(-1, 0), 'horizontal'),
    ).toEqual({ valid: false, error: 'out-of-bounds' });
  });

  it('rejects overlapping ships', () => {
    const board = placeShip(createEmptyBoard(), carrier, at(4, 2), 'horizontal')!;
    expect(validatePlacement(board, destroyer, at(4, 5), 'horizontal')).toEqual({
      valid: false,
      error: 'overlap',
    });
    // Crossing the carrier perpendicularly also overlaps.
    expect(validatePlacement(board, destroyer, at(3, 3), 'vertical')).toEqual({
      valid: false,
      error: 'overlap',
    });
  });

  it('allows ships to touch without overlapping', () => {
    const board = placeShip(createEmptyBoard(), carrier, at(4, 2), 'horizontal')!;
    expect(validatePlacement(board, destroyer, at(5, 2), 'horizontal')).toEqual({
      valid: true,
    });
  });

  it('rejects placing the same ship twice', () => {
    const board = placeShip(createEmptyBoard(), carrier, at(0, 0), 'horizontal')!;
    expect(validatePlacement(board, carrier, at(2, 0), 'horizontal')).toEqual({
      valid: false,
      error: 'already-placed',
    });
  });
});

describe('placeShip', () => {
  it('returns null and does not mutate the board on an invalid placement', () => {
    const board = createEmptyBoard();
    expect(placeShip(board, carrier, at(0, 9), 'horizontal')).toBeNull();
    expect(board.ships).toHaveLength(0);
  });

  it('does not mutate the input board on a valid placement', () => {
    const board = createEmptyBoard();
    const next = placeShip(board, carrier, at(0, 0), 'horizontal')!;
    expect(board.ships).toHaveLength(0);
    expect(next.ships).toHaveLength(1);
  });
});

describe('fireAt', () => {
  const board = placeShip(createEmptyBoard(), destroyer, at(1, 1), 'horizontal')!;

  it('records a miss', () => {
    const result = fireAt(board, at(9, 9));
    expect(result.outcome).toBe('miss');
    expect(result.board.shots[9][9]).toBe('miss');
    expect(result.sunkShip).toBeNull();
  });

  it('records a hit without sinking a multi-cell ship', () => {
    const result = fireAt(board, at(1, 1));
    expect(result.outcome).toBe('hit');
    expect(result.board.shots[1][1]).toBe('hit');
    expect(result.sunkShip).toBeNull();
    expect(result.fleetDestroyed).toBe(false);
  });

  it('reports the ship that was sunk and the destroyed fleet', () => {
    const afterFirst = fireAt(board, at(1, 1)).board;
    const result = fireAt(afterFirst, at(1, 2));
    expect(result.outcome).toBe('sunk');
    expect(result.sunkShip?.name).toBe('Destroyer');
    expect(result.fleetDestroyed).toBe(true);
    expect(isFleetDestroyed(result.board)).toBe(true);
  });

  it('throws on a duplicate shot', () => {
    const afterFirst = fireAt(board, at(5, 5)).board;
    expect(hasBeenShot(afterFirst, at(5, 5))).toBe(true);
    expect(() => fireAt(afterFirst, at(5, 5))).toThrow(/already fired/);
  });

  it('throws when firing outside the board', () => {
    expect(() => fireAt(board, at(10, 0))).toThrow(RangeError);
  });

  it('does not mutate the board it is given', () => {
    fireAt(board, at(1, 1));
    expect(board.shots[1][1]).toBeNull();
    expect(board.ships[0].hits).toEqual([false, false]);
  });
});

describe('createRandomBoard', () => {
  it('places the whole fleet legally, repeatedly', () => {
    for (let i = 0; i < 200; i++) {
      const board: Board = createRandomBoard();
      expect(board.ships).toHaveLength(FLEET.length);

      const totalCells = FLEET.reduce((sum, spec) => sum + spec.length, 0);
      // A Set of keys collapses duplicates, so equal size proves no overlap.
      expect(occupiedCells(board).size).toBe(totalCells);

      for (const ship of board.ships) {
        for (const { row, col } of ship.cells) {
          expect(row).toBeGreaterThanOrEqual(0);
          expect(col).toBeGreaterThanOrEqual(0);
          expect(row).toBeLessThan(BOARD_SIZE);
          expect(col).toBeLessThan(BOARD_SIZE);
        }
      }
    }
  });
});
