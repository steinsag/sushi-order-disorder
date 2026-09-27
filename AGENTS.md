# AGENTS.md - Technical working guide

The game description, rules, and content are in `README.md`. This file covers the architecture and workflow for changes to the implemented game.

## Architecture

- Vite and TypeScript use `strict: true`. The game world is a 2.5D sprite scene drawn in a Canvas 2D context. HTML provides menus and the HUD.
- `src/game` orchestrates the loop and simulation steps. `src/input` provides normalized input snapshots for four fixed player slots on each step. The simulation does not know about keyboards or gamepads.
- `src/state`, `src/rules`, and `src/world` hold state, rules, layout, collisions, and interactions. They remain independent of DOM, Canvas, `navigator`, and wall-clock time. Timers use `dt`; new random behavior should support an injected random source.
- `src/render` loads assets centrally and draws state without modifying it. Chefs and objects are sprites with foot anchors and stable depth sorting; positions, collisions, and interaction ranges use world coordinates.
- `src/ui` displays menus and the HUD. Recipes, station parameters, timers, and point values belong in domain configuration, not duplicated in the renderer or UI.
- Movement is free and continuous, including diagonals; movement vectors are normalized. Each player has two gameplay actions. Pause is a separate system signal. Simultaneous interactions are processed deterministically by player slot.

## Localization

- English is the fallback language; German is also supported. `src/i18n.ts` contains both translation catalogs and configures i18next with browser language detection. The title screen provides the language control.
- Put every new or changed player-facing string in **both** the English and German catalogs. This includes menus, HUD, canvas prompts, feedback, item and recipe names, accessible labels, and error messages. Keep translation keys in parity and verify both languages on the affected game path.
- Keep simulation data language-neutral. Store recipe and ingredient IDs, feedback type, score, and other facts in state; translate them when the UI or renderer displays them. Do not make rules depend on the active language.
- Avoid fixed-language text in sprite assets. Use localized canvas labels for station names and prompts.

## Checking changes

1. Before editing, read `README.md`, relevant modules, and `git status`. Preserve changes made by others.
2. Implement behavior at the appropriate module boundary. Check deterministic state transitions with nearby Vitest tests; add a regression test for reproducible bugs. Check browser and device behavior in the game when needed.
3. Run mechanical formatting with `npm run format` and, if needed, `npm run lint:fix`. Run `npm run check` (format, lint, type checking, tests, build) before finishing. Also check changed behavior on the affected game path and name any devices you could not test.

Node.js >= 22 is required. Install dependencies with `npm ci`. The project-local pre-commit hook runs `npm run check`.
