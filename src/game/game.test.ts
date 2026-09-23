import { describe, expect, it } from 'vitest';
import { createEmptyBoard, placeShip } from './board';
import {
  aiFire,
  allShipsPlaced,
  canPlayerFire,
  checkPlayerPlacement,
  createGame,
  currentPlacementShip,
  placePlayerShip,
  playerFire,
  randomizePlayerBoard,
  resetPlacement,
  startBattle,
  toggleOrientation,
  type GameState,
} from './game';
import { BOARD_SIZE, FLEET, type Coord } from './types';

const at = (row: number, col: number): Coord => ({ row, col });

/** A game with both fleets placed and the battle started. */
function startedGame(): GameState {
  const game = randomizePlayerBoard(createGame());
  return startBattle(game);
}

describe('placement phase', () => {
  it('starts in placement with the AI fleet already placed', () => {
    const game = createGame();
    expect(game.phase).toBe('placement');
    expect(game.aiBoard.ships).toHaveLength(FLEET.length);
    expect(game.playerBoard.ships).toHaveLength(0);
    expect(currentPlacementShip(game)?.id).toBe('carrier');
  });

  it('advances through the fleet as ships are placed', () => {
    let game = createGame();
    FLEET.forEach((spec, index) => {
      expect(currentPlacementShip(game)).toEqual(spec);
      game = placePlayerShip(game, at(index * 2, 0));
    });
    expect(allShipsPlaced(game)).toBe(true);
    expect(currentPlacementShip(game)).toBeNull();
    expect(game.playerBoard.ships).toHaveLength(FLEET.length);
  });

  it('ignores an invalid placement without consuming the ship', () => {
    const game = createGame();
    const next = placePlayerShip(game, at(0, 8)); // carrier would overflow
    expect(next).toBe(game);
    expect(currentPlacementShip(next)?.id).toBe('carrier');
  });

  it('reports why a placement is invalid', () => {
    const game = createGame();
    expect(checkPlayerPlacement(game, at(0, 0))).toEqual({ valid: true });
    expect(checkPlayerPlacement(game, at(0, 8))).toEqual({
      valid: false,
      error: 'out-of-bounds',
    });
    const withCarrier = placePlayerShip(game, at(0, 0));
    expect(checkPlayerPlacement(withCarrier, at(0, 3))).toEqual({
      valid: false,
      error: 'overlap',
    });
  });

  it('toggles orientation and places vertically', () => {
    const game = toggleOrientation(createGame());
    expect(game.orientation).toBe('vertical');
    const placed = placePlayerShip(game, at(0, 0));
    expect(placed.playerBoard.ships[0].cells).toEqual([
      at(0, 0),
      at(1, 0),
      at(2, 0),
      at(3, 0),
      at(4, 0),
    ]);
  });

  it('clears the board when placement is reset', () => {
    const game = resetPlacement(placePlayerShip(createGame(), at(0, 0)));
    expect(game.playerBoard.ships).toHaveLength(0);
    expect(game.placementIndex).toBe(0);
  });

  it('cannot start the battle before every ship is placed', () => {
    const game = createGame();
    expect(startBattle(game).phase).toBe('placement');
    expect(startBattle(randomizePlayerBoard(game)).phase).toBe('player-turn');
  });
});

describe('battle phase', () => {
  it('rejects firing outside the player turn', () => {
    const game = createGame();
    expect(canPlayerFire(game, at(0, 0))).toBe(false);
    expect(playerFire(game, at(0, 0))).toBe(game);
  });

  it('hands the turn to the AI after the player fires', () => {
    const game = playerFire(startedGame(), at(0, 0));
    expect(game.phase).toBe('ai-turn');
    expect(game.log[0].actor).toBe('player');
  });

  it('ignores a duplicate shot and keeps the turn with the player', () => {
    const afterShot = playerFire(startedGame(), at(0, 0));
    const backToPlayer = { ...afterShot, phase: 'player-turn' as const };
    expect(canPlayerFire(backToPlayer, at(0, 0))).toBe(false);
    expect(playerFire(backToPlayer, at(0, 0))).toBe(backToPlayer);
  });

  it('only lets the AI fire on its turn, then returns the turn', () => {
    const playerTurn = startedGame();
    expect(aiFire(playerTurn)).toBe(playerTurn);

    const aiTurn = playerFire(playerTurn, at(0, 0));
    const afterAi = aiFire(aiTurn);
    expect(afterAi.phase).toBe('player-turn');
    expect(afterAi.log[0].actor).toBe('ai');
    expect(afterAi.playerBoard.shots.flat().filter(Boolean)).toHaveLength(1);
  });

  it('logs hits, misses and sinkings in board notation', () => {
    let game = startedGame();
    const ship = game.aiBoard.ships[0];
    for (const cell of ship.cells) {
      game = playerFire(game, cell);
      game = { ...game, phase: 'player-turn' };
    }
    expect(game.log[0].text).toContain('sunk the Carrier');
    expect(game.log[ship.cells.length - 1].text).toMatch(/^[A-J]\d+: hit$/);
  });
});

describe('end of game', () => {
  it('declares the player the winner when the AI fleet is destroyed', () => {
    let game = startedGame();
    for (const ship of game.aiBoard.ships) {
      for (const cell of ship.cells) {
        game = playerFire(game, cell);
        if (game.phase === 'ai-turn') game = { ...game, phase: 'player-turn' };
      }
    }
    expect(game.phase).toBe('game-over');
    expect(game.winner).toBe('player');
    // The board is frozen once the game is over.
    expect(canPlayerFire(game, at(9, 9))).toBe(false);
    expect(aiFire(game)).toBe(game);
  });

  it('declares the AI the winner when the player fleet is destroyed', () => {
    // A single-ship player fleet so the AI can finish quickly.
    const base = createGame();
    let game: GameState = {
      ...base,
      playerBoard: placeShip(createEmptyBoard(), FLEET[4], at(0, 0), 'horizontal')!,
      placementIndex: FLEET.length,
      phase: 'ai-turn',
    };
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE && game.phase !== 'game-over'; i++) {
      game = aiFire(game);
      if (game.phase === 'player-turn') game = { ...game, phase: 'ai-turn' };
    }
    expect(game.phase).toBe('game-over');
    expect(game.winner).toBe('ai');
  });

  it('can always progress: a full game never gets stuck', () => {
    let game = startedGame();
    for (let turn = 0; turn < 500 && game.phase !== 'game-over'; turn++) {
      if (game.phase === 'player-turn') {
        const target = firstUnshotCell(game);
        expect(target).not.toBeNull();
        game = playerFire(game, target!);
      } else {
        game = aiFire(game);
      }
    }
    expect(game.phase).toBe('game-over');
    expect(game.winner).not.toBeNull();
  });
});

function firstUnshotCell(game: GameState): Coord | null {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (game.aiBoard.shots[row][col] === null) return { row, col };
    }
  }
  return null;
}

describe('restarting', () => {
  it('produces a fresh game unrelated to the finished one', () => {
    const played = playerFire(startedGame(), at(0, 0));
    const fresh = createGame();
    expect(fresh.phase).toBe('placement');
    expect(fresh.log).toHaveLength(0);
    expect(fresh.winner).toBeNull();
    expect(fresh.aiBoard.shots.flat().filter(Boolean)).toHaveLength(0);
    expect(played.aiBoard.shots.flat().filter(Boolean)).toHaveLength(1);
  });
});
