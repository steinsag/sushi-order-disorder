---
name: sushi-order-disorder-implementation
description: Implement changes to Sushi Order Disorder and verify them with the local harness. Use for game code, tests, and the project harness, not for game ideas alone.
---

# Implement a Sushi Order Disorder change

1. Read `README.md` for game rules and `AGENTS.md` for technical boundaries. Check `git status` and preserve changes made by others.
2. Make an integrated change with appropriate behavior tests. Keep the simulation independent of browser APIs; pass input as snapshots, and have rendering read state.
3. Localize every new or changed player-facing string in both English and German in `src/i18n.ts`. This includes canvas and sprite text, menus, HUD, feedback, accessible labels, and errors. Keep simulation data language-neutral and verify the affected path in both languages.
4. Use local tools for mechanical work: `npm run format`, `npm run lint:fix` if needed, then `npm run check`. If a command fails, fix the specific cause and rerun it.
5. Check the affected game path when behavior changes. Report changes, checks performed, remaining limitations, and a short manual test path with the expected result.
