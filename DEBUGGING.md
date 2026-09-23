# Debugging log

Issues found while building and testing this project, in the order they were discovered.
Everything here was hit for real during development, unit testing or manual browser testing.

---

## 1. TypeScript could not see a mutation made inside a callback

**Symptom.** In `fireAt`, the sunk ship was originally tracked by assigning to a `let sunkShip`
from inside a `board.ships.map(...)` callback. TypeScript's control-flow analysis does not
follow assignments made inside callbacks, so at the point of use it still considered the
variable to be `null`, and the code failed to type-check.

**Diagnosis.** The compiler error pointed straight at the read, not the write, which is the
usual sign of narrowing rather than a genuine type mismatch.

**Fix.** Restructured the function so nothing is assigned from inside a callback: find the
index of the hit ship first, map to a new ships array, and derive `sunkShip` from the result
([`src/game/board.ts`](src/game/board.ts)). The code is easier to read as a result — each
value is computed once, in order.

---

## 2. AI kept stale targeting state, and wasted shots perpendicular to a known ship

**Symptom.** A unit test for the hunt/target AI (`extends along the line once two hits are
aligned`) failed: after two hits in a row, the queue still contained the cells above and
below the first hit.

**Diagnosis.** `recordShot` appended the line extensions to the existing queue instead of
replacing it. Once two hits are collinear the ship's axis is known, so the perpendicular
probes are guaranteed misses — the AI was throwing away turns. A related hole: after a miss
that emptied the queue, `activeHits` still held the old hits, so a later unrelated hit would
be compared against a stale trail.

**Fix.** On a confirmed line, the queue is replaced by the two line ends (falling back to the
old queue only if the line cannot be extended); a miss that empties the queue resets the AI to
a clean hunting state ([`src/game/ai.ts`](src/game/ai.ts)). Two tests lock this in, plus a
statistical test asserting the AI sinks a fleet in far fewer shots than random play would.

---

## 3. Placement preview was invisible over already-placed ships

**Symptom.** During manual testing: place the Carrier at A1 horizontally, then hover the
Battleship over the same cells. The rejection message appeared, but the red "invalid"
footprint did not — the cells stayed the normal ship blue.

**Diagnosis.** A CSS specificity problem, not a logic one: the DOM had the right classes
(`cell--ship cell--preview-invalid`), but the rule `.board--player .cell--ship`
(two classes) outranked `.cell--preview-invalid` (one class), so the ship colour won.

**Fix.** Board-variant colours moved into CSS custom properties (`--ship-bg`, `--ship-border`)
set on `.board--player` / `.board--opponent`, so every cell-state rule is a single class and
source order decides the winner: ship → miss → hit → sunk → preview
([`src/App.css`](src/App.css)).

---

## 4. Your own sunk ships did not turn red

**Symptom.** When the AI sank one of the player's ships, the cells kept the blue "your ship"
colour instead of the solid red used on the enemy board, so it was hard to tell what had been
lost.

**Diagnosis.** The same specificity bug as #3 — `.board--player .cell--ship` was beating
`.cell--sunk`.

**Fix.** Fixed by the same change; both boards now use identical hit/sunk visuals, which is
also what makes the two boards comparable at a glance.

---

## 5. Fleet status overflowed the centre column on a laptop screen

**Symptom.** At 1440x900 the "Enemy fleet" list was clipped by the enemy board during battle.

**Diagnosis.** The fleet status used a two-column grid inside a side column that is only
~240–300px wide, and the grid column had the default `min-width: auto`, so its content refused
to shrink and spilled over.

**Fix.** The two fleets stack vertically, and `.app__side` got `min-width: 0` so the panels
shrink with the column instead of overflowing ([`src/App.css`](src/App.css)).

---

## 6. Enemy board still said "Hold fire until your turn" after the game ended

**Symptom.** After the Victory banner appeared, the enemy board subtitle still told the player
to wait for their turn.

**Diagnosis.** The subtitle was a two-way ternary on `phase === 'player-turn'`, so the
`game-over` (and `placement`) phases fell into the "wait" branch.

**Fix.** Replaced with an exhaustive `switch` over `Phase`
([`src/App.tsx`](src/App.tsx)), so adding a phase later forces this copy to be revisited.

---

## 7. Production build failed in CI even though the local build passed

**Symptom.** The first CI run failed with
`TS2769 ... 'test' does not exist in type 'UserConfigExport'` in `vite.config.ts`, while
`npm run build` had just succeeded locally.

**Diagnosis.** Vitest options had been added to a config created with Vite's `defineConfig`,
which does not know about the `test` key. Locally the error was masked by a stale
`tsbuildinfo` incremental cache; a clean `tsc -b --force` reproduced it immediately.

**Fix.** Import `defineConfig` from `vitest/config`, which is the same function with the test
options typed ([`vite.config.ts`](vite.config.ts)). Lesson kept: reproduce CI failures with a
forced, cache-free build rather than trusting an incremental one.

---

## 8. The enemy fleet panel leaked which ship had been hit

**Symptom.** Found while playing: a single hit on the enemy board showed `Carrier ■■■✕■` in
the fleet panel, which reveals both the ship's identity and which segment was struck — enough
to deduce where the rest of the ship must lie, making the game trivially easy.

**Diagnosis.** `FleetStatus` rendered both fleets with the same per-cell damage markers. It
was convenient for debugging and simply never reconsidered for the enemy side.

**Fix.** Damage markers are shown only for your own fleet; enemy ships show damage only once
they are sunk ([`src/components/PlacementPanel.tsx`](src/components/PlacementPanel.tsx)).
The fleet composition itself is still listed, which is public knowledge in Battleship.

---

## Things that were deliberately guarded against (and verified, not bugs)

- **Double AI shots in React StrictMode.** The AI turn runs from a `useEffect` timer, which
  StrictMode mounts twice in development. The timer is cleared on cleanup *and* the updater
  re-checks `phase === 'ai-turn'` before firing, so one turn can only ever produce one shot.
  Verified in the browser with the console open: no duplicate shots, no React warnings.
- **Duplicate player shots.** Cells that have been fired at are `disabled` in the DOM,
  `canPlayerFire` re-checks before dispatching, and `fireAt` throws if it is ever reached
  twice for the same cell. Rapid double-clicking during the AI's delay was tested manually.
- **Getting stuck.** A test plays a full game through the state machine and asserts it always
  reaches `game-over` with a winner.

## Known limitations and tradeoffs

- **No persistence.** Refreshing the page starts over; there is no save state or undo during
  placement (you can Clear and re-place). Both were out of scope for a small exercise.
- **Game state lives in one `useState` in `useGame`.** Fine at this size; a `useReducer` or a
  store would be the next step if more actions or multiplayer were added.
- **Drag-and-drop placement** would feel nicer than click-to-place, but click plus rotate is
  simpler, keyboard-friendly and less code to get wrong.
- **The AI does not use ship lengths.** It could rule out gaps too small for any remaining
  ship, or weight cells by how many placements cover them. A probability-density AI would be
  meaningfully stronger, but far harder to explain and to test — the current one is
  deliberately simple and readable.
- **AI ship placement is uniformly random** (rejection sampling), so it will occasionally
  cluster ships; it is legal but not strategic.
- **No component/DOM tests.** The logic layer has 45 unit tests; the UI is a thin, mostly
  presentational layer that was verified manually across full games (win and loss) at
  1440x900. Adding React Testing Library coverage for the placement and firing handlers
  would be the first thing to add if this grew.
- **Layout is tuned for a laptop screen.** It collapses to a single column below 960px, but
  small-phone ergonomics were not a goal.
- **Tested in Chrome only.**
