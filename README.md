# Battleship

A small, single-player Battleship game: place your fleet, then trade shots with an AI
opponent that uses a hunt/target strategy. Built with React, TypeScript and Vite.

**Play it:** https://greggstone.github.io/devin-battleship/

## Running locally

Requires Node 20+ (Node 22 is used in CI).

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

| Script                  | What it does                                  |
| ----------------------- | --------------------------------------------- |
| `npm test`              | Runs the unit test suite (Vitest)             |
| `npm run test:watch`    | Watches tests while developing                |
| `npm run test:coverage` | Coverage report for `src/game`                |
| `npm run lint`          | Lints with oxlint                             |
| `npm run build`         | Type-checks and builds to `dist/`             |
| `npm run preview`       | Serves the production build locally           |

## How to play

1. **Place your fleet.** Hover your board to preview the ship; green means the placement
   is legal, red means it is not (off the board or overlapping). Click to place.
   Rotate with the **Rotate** button or the <kbd>R</kbd> key, or use **Random**.
2. **Start the battle.** Click a cell on the enemy board to fire. Hits are red, misses are
   grey dots, and a sunk ship's cells turn solid red and get struck through in the fleet list.
3. **Keep firing** until one fleet is gone. The winner is announced and **Play again**
   starts a fresh game without reloading the page.

## Project structure

```
src/
  game/            Pure game logic — no React, no DOM
    types.ts       Domain types, board size and the fleet definition
    board.ts       Board creation, placement validation, firing, random fleets
    ai.ts          Hunt/target AI (shot selection + memory)
    game.ts        Game state machine tying both boards together
    *.test.ts      Unit tests for the three modules above
  hooks/
    useGame.ts     React state container; also drives the AI's turn on a timer
  components/
    GameBoard.tsx      Renders one 10x10 board (player or opponent variant)
    PlacementPanel.tsx Placement controls + fleet status during battle
    BattleLog.tsx      Shot-by-shot log
  App.tsx          Layout, phase-dependent UI and hover-preview wiring
```

### Design notes

- **Logic is separate from UI.** Everything in `src/game` is pure: functions take a state
  and return a new one, never mutating their inputs and never touching React. The whole
  game can be played in a test without rendering anything, which is what the test suite does.
- **Randomness is injectable.** Every function that needs randomness accepts an
  `Rng` (`() => number`) that defaults to `Math.random`, so tests can be deterministic.
- **Illegal moves cannot happen.** `validatePlacement` and `canPlayerFire` are the single
  source of truth: the UI uses them to disable/preview, and the state machine re-checks them,
  so a stray click cannot corrupt the game. `fireAt` throws on a duplicate or off-board shot —
  that is a programming error, not a user error, so it fails loudly rather than silently.
- **One phase at a time.** `phase` is `'placement' | 'player-turn' | 'ai-turn' | 'game-over'`,
  and every action is a no-op in the wrong phase. This is what keeps the game from getting
  stuck or letting both sides fire at once.

### How the AI works

`src/game/ai.ts` implements the classic two-mode strategy:

- **Hunt:** with no active leads, it fires at a random cell it has not tried, preferring
  cells where `(row + col)` is even. Since the smallest ship is two cells long, that
  checkerboard covers every possible ship while searching half as many cells.
- **Target:** after a hit it queues the four neighbouring cells. Once two hits line up, it
  knows the ship's axis and queues only the two ends of that line, discarding the
  perpendicular guesses. When a ship sinks, the trail is cleared and it goes back to hunting.

It never fires twice at the same cell: queued cells are filtered against the board before
use, and hunting only picks from cells that have never been shot.

## Testing

45 unit tests cover placement rules, firing, sinking, win detection, phase transitions and
AI behaviour (including a property-style check that the AI never repeats a shot across full
simulated games, and that it sinks a fleet in far fewer shots than random play would).

```bash
npm test
```

See [DEBUGGING.md](./DEBUGGING.md) for the bugs found during development and how they were fixed.

## Deployment

Pushes to `main` run [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which
tests, builds with the Pages base path and publishes to GitHub Pages.
[`ci.yml`](.github/workflows/ci.yml) runs lint, build and tests on pull requests.
