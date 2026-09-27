# Sushi Order Disorder 🍣

**Sushi Order Disorder** is a local co-op game for 2 to 4 players sharing one screen. Work together to take orders, prepare sushi, and deliver it before the shift ends. Everyone moves through the same kitchen at the same time; there is no split screen.

## Playing

Players 1 and 2 are active on the title screen. Additional players can join with the slot buttons; slots 3 and 4 use gamepads. Select **Start game** to begin a two-minute shift. New orders wait at the order counter and appear as recipe cards in the HUD only after you accept them.

1. Accept an order at the order counter with Action 1. Its recipe card shows the dish, ingredients, and time remaining. Express orders are marked.
2. Get ingredients from the fridge. From left to right, its compartments contain nori, salmon, cucumber, and avocado; your position in front of the fridge determines the compartment. At the rice cooker, Action 1 starts cooking. You can collect rice portions when they are ready. Each chef can carry one item at a time.
3. Place ingredients on either rolling station with Action 1. When exactly the ingredients for a recipe are present, press Action 1 again to prepare it. If the combination is incomplete or wrong, a chef with empty hands can use Action 1 to pick up the last item placed. The center counter can hold items temporarily.
4. Pick up the finished plate with Action 1 and take it to the delivery counter. Action 1 or 2 delivers it there. A matching dish is assigned to an open order.

Wrong ingredients occupy space at a rolling station until someone removes them. You can drop a carried item on the floor with Action 2 and pick it up again with Action 1. Empty fridge compartments refill automatically after a short time.

## Recipes

| Dish | Ingredients |
| --- | --- |
| 🍣 Salmon Nigiri | Rice, salmon |
| 🥒 Cucumber Maki | Nori, rice, cucumber |
| 🐟 Salmon Maki | Nori, rice, salmon |
| 🥑 Avocado Maki | Nori, rice, avocado |

Salmon Nigiri and Cucumber Maki are available at the start. Later in the shift, more recipes, simultaneous orders, and express orders are added. Correct deliveries earn points; late deliveries earn fewer points. A wrong dish costs points and leaves the order open. At the end of the shift, the game shows the score, delivery statistics, and rating.

## Controls

| Player | Movement | Action 1 | Action 2 |
| --- | --- | --- | --- |
| P1 | Arrow keys | K | L |
| P2 | W, A, S, D | F | G |
| P3 / P4 | Left stick or D-pad | A / Cross | B / Circle |

Action 1 accepts orders, picks up and places items, uses stations, and delivers dishes. Action 2 drops carried items on the floor or, with empty hands, cancels cooking or rolling. **Esc**, **P**, gamepad Start, or the Pause button pauses the shift; game timers stop while paused. The action buttons also have equivalent keyboard and gamepad bindings.

## Language

The game offers English and German. It uses your browser's preferred language when available and otherwise starts in English. Use the flag buttons on the title screen to switch languages; your choice is saved in this browser.

## Run locally

Requirements: Node.js >= 22 and npm.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite in a browser. `npm run check` runs the format check, ESLint, type checking, Vitest, and the build. `npm run format` formats the code and selected configuration files.
