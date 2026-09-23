import { describe, expect, it } from 'vitest';
import { chooseShot, createAiState, recordShot, type AiState } from './ai';
import {
  coordKey,
  createEmptyBoard,
  createRandomBoard,
  fireAt,
  hasBeenShot,
  isFleetDestroyed,
  placeShip,
} from './board';
import { BOARD_SIZE, FLEET, type Board, type Coord } from './types';

const at = (row: number, col: number): Coord => ({ row, col });
const cruiser = FLEET[2]; // length 3

/** Plays the AI until the fleet is sunk; returns the shots it fired, in order. */
function playOut(board: Board): Coord[] {
  let current = board;
  let state: AiState = createAiState();
  const shots: Coord[] = [];

  while (!isFleetDestroyed(current) && shots.length <= BOARD_SIZE * BOARD_SIZE) {
    const target = chooseShot(current, state);
    expect(target).not.toBeNull();
    const result = fireAt(current, target!);
    current = result.board;
    state = recordShot(state, current, target!, result.outcome);
    shots.push(target!);
  }
  return shots;
}

describe('chooseShot', () => {
  it('never repeats a cell over a whole game', () => {
    for (let game = 0; game < 25; game++) {
      const shots = playOut(createRandomBoard());
      const unique = new Set(shots.map(coordKey));
      expect(unique.size).toBe(shots.length);
    }
  });

  it('returns null when every cell has been fired at', () => {
    let board = createEmptyBoard();
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        board = fireAt(board, at(row, col)).board;
      }
    }
    expect(chooseShot(board, createAiState())).toBeNull();
  });

  it('prefers queued targets over random hunting', () => {
    const board = createEmptyBoard();
    const state: AiState = { activeHits: [at(4, 4)], targetQueue: [at(4, 5)] };
    expect(chooseShot(board, state)).toEqual(at(4, 5));
  });

  it('skips queued cells that have already been fired at', () => {
    const board = fireAt(createEmptyBoard(), at(4, 5)).board;
    const state: AiState = {
      activeHits: [at(4, 4)],
      targetQueue: [at(4, 5), at(4, 3)],
    };
    expect(chooseShot(board, state)).toEqual(at(4, 3));
  });
});

describe('recordShot', () => {
  it('queues the neighbours of a fresh hit', () => {
    const board = fireAt(createEmptyBoard(), at(4, 4)).board;
    const state = recordShot(createAiState(), board, at(4, 4), 'hit');
    expect(state.activeHits).toEqual([at(4, 4)]);
    expect(state.targetQueue).toEqual(
      expect.arrayContaining([at(3, 4), at(5, 4), at(4, 3), at(4, 5)]),
    );
    expect(state.targetQueue).toHaveLength(4);
  });

  it('clamps queued neighbours to the board edges', () => {
    const board = fireAt(createEmptyBoard(), at(0, 0)).board;
    const state = recordShot(createAiState(), board, at(0, 0), 'hit');
    expect(state.targetQueue).toEqual([at(1, 0), at(0, 1)]);
  });

  it('extends along the line once two hits are aligned', () => {
    let board = fireAt(createEmptyBoard(), at(4, 4)).board;
    let state = recordShot(createAiState(), board, at(4, 4), 'hit');
    board = fireAt(board, at(4, 5)).board;
    state = recordShot(state, board, at(4, 5), 'hit');

    // Only the two ends of the line remain; perpendicular probes are dropped.
    expect(state.targetQueue).toEqual([at(4, 3), at(4, 6)]);
  });

  it('goes back to hunting after sinking a ship', () => {
    const board = fireAt(createEmptyBoard(), at(4, 4)).board;
    const state = recordShot(
      { activeHits: [at(4, 3)], targetQueue: [at(4, 5)] },
      board,
      at(4, 4),
      'sunk',
    );
    expect(state).toEqual(createAiState());
  });

  it('keeps hunting the rest of the queue after a miss', () => {
    const board = fireAt(createEmptyBoard(), at(4, 5)).board;
    const state = recordShot(
      { activeHits: [at(4, 4)], targetQueue: [at(4, 5), at(4, 3)] },
      board,
      at(4, 5),
      'miss',
    );
    expect(state.targetQueue).toEqual([at(4, 3)]);
  });
});

describe('hunt/target behaviour', () => {
  it('finishes a ship soon after finding it', () => {
    // A single cruiser: once hit, targeting should sink it within a few shots.
    const board = placeShip(createEmptyBoard(), cruiser, at(5, 4), 'horizontal')!;
    const shots = playOut(board);
    const firstHitIndex = shots.findIndex((shot) =>
      board.ships[0].cells.some((cell) => coordKey(cell) === coordKey(shot)),
    );
    const shotsAfterFirstHit = shots.length - firstHitIndex;
    // Worst case: 2 remaining ship cells plus probing the 4 wrong directions.
    expect(shotsAfterFirstHit).toBeLessThanOrEqual(7);
  });

  it('beats random play on average', () => {
    const games = 30;
    let total = 0;
    for (let i = 0; i < games; i++) total += playOut(createRandomBoard()).length;
    const average = total / games;
    // Random play needs ~95 shots; a working hunt/target AI is far quicker.
    expect(average).toBeLessThan(75);
  });

  it('only fires at cells that have not been shot', () => {
    const board = createRandomBoard();
    let current = board;
    let state = createAiState();
    for (let i = 0; i < 40; i++) {
      const target = chooseShot(current, state)!;
      expect(hasBeenShot(current, target)).toBe(false);
      const result = fireAt(current, target);
      current = result.board;
      state = recordShot(state, current, target, result.outcome);
    }
  });
});
