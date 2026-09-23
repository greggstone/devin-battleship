import { useCallback, useEffect, useState } from 'react';
import {
  aiFire,
  createGame,
  placePlayerShip,
  playerFire,
  randomizePlayerBoard,
  resetPlacement,
  startBattle,
  toggleOrientation,
  type GameState,
} from '../game/game';
import type { Coord } from '../game/types';

/** Pause before the AI shoots, so its turn is visible rather than instant. */
export const AI_TURN_DELAY_MS = 650;

export interface GameActions {
  placeShip(start: Coord): void;
  rotate(): void;
  randomizeShips(): void;
  clearShips(): void;
  startBattle(): void;
  fire(target: Coord): void;
  newGame(): void;
}

export function useGame(): { state: GameState; actions: GameActions } {
  const [state, setState] = useState<GameState>(createGame);

  // The AI plays itself: whenever it is its turn, schedule exactly one shot.
  useEffect(() => {
    if (state.phase !== 'ai-turn') return;
    const timer = setTimeout(() => {
      // Re-check the phase inside the updater: React may run this effect twice
      // in StrictMode, and the game must never take two AI shots for one turn.
      setState((current) => (current.phase === 'ai-turn' ? aiFire(current) : current));
    }, AI_TURN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state]);

  const actions: GameActions = {
    placeShip: useCallback((start) => setState((s) => placePlayerShip(s, start)), []),
    rotate: useCallback(() => setState(toggleOrientation), []),
    randomizeShips: useCallback(() => setState((s) => randomizePlayerBoard(s)), []),
    clearShips: useCallback(() => setState(resetPlacement), []),
    startBattle: useCallback(() => setState(startBattle), []),
    fire: useCallback((target) => setState((s) => playerFire(s, target)), []),
    newGame: useCallback(() => setState(createGame()), []),
  };

  return { state, actions };
}
