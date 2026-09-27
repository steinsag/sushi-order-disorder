import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Game } from "./Game";
import { KEYBOARD_LAYOUTS, KeyboardState } from "../input/KeyboardInput";
import { GamepadInput } from "../input/GamepadInput";
import {
  createNeutralPlayerInput,
  type PlayerInput,
} from "../input/PlayerInput";
import {
  createInitialWorldState,
  updateWorldState,
  type WorldState,
} from "../state/WorldState";
import {
  createIngredientItem,
  type IngredientItem,
  type PlateItem,
} from "../state/ItemState";
import {
  createActiveOrderFromPending,
  createPendingOrder,
} from "../state/OrderState";
import { ALL_RECIPE_IDS, type RecipeId } from "../rules/RecipeConfig";

interface MockElement {
  className: string;
  innerHTML: string;
  dataset: Record<string, string>;
  style: Record<string, string>;
  classList: {
    add: (cls: string) => void;
    remove: (cls: string) => void;
    contains: (cls: string) => boolean;
  };
  appendChild: (child: MockElement) => MockElement;
  removeChild: (child: MockElement) => MockElement;
  remove: () => void;
  querySelector: (sel: string) => MockElement | null;
  querySelectorAll: (sel: string) => MockElement[];
  addEventListener: (type: string, cb: (e?: unknown) => void) => void;
  removeEventListener: (type: string, cb: (e?: unknown) => void) => void;
  getBoundingClientRect: () => {
    width: number;
    height: number;
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  getContext?: (type: string) => unknown;
}

function createMockElement(tag = "div"): MockElement {
  const classes = new Set<string>();
  const listeners = new Map<string, ((e?: unknown) => void)[]>();
  const children: MockElement[] = [];

  const element: MockElement = {
    className: "",
    innerHTML: "",
    dataset: {},
    style: {},
    classList: {
      add: (cls: string) => {
        classes.add(cls);
        element.className = Array.from(classes).join(" ");
      },
      remove: (cls: string) => {
        classes.delete(cls);
        element.className = Array.from(classes).join(" ");
      },
      contains: (cls: string) => classes.has(cls),
    },
    appendChild: (child: MockElement) => {
      children.push(child);
      return child;
    },
    removeChild: (child: MockElement) => {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
      return child;
    },
    remove: () => {},
    querySelector: (sel: string) => {
      if (sel.startsWith(".")) {
        const cls = sel.slice(1);
        if (element.classList.contains(cls)) return element;
        for (const child of children) {
          const found = child.querySelector(sel);
          if (found) return found;
        }
      }
      return null;
    },
    querySelectorAll: (sel: string) => {
      const results: MockElement[] = [];
      if (sel.startsWith(".")) {
        const cls = sel.slice(1);
        if (element.classList.contains(cls)) results.push(element);
        for (const child of children) {
          results.push(...child.querySelectorAll(sel));
        }
      }
      return results;
    },
    addEventListener: (type: string, cb: (e?: unknown) => void) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type)!.push(cb);
    },
    removeEventListener: (type: string, cb: (e?: unknown) => void) => {
      const arr = listeners.get(type);
      if (arr) {
        const idx = arr.indexOf(cb);
        if (idx !== -1) arr.splice(idx, 1);
      }
    },
    getBoundingClientRect: () => ({
      width: 960,
      height: 540,
      left: 0,
      top: 0,
      right: 960,
      bottom: 540,
    }),
  };

  if (tag === "canvas") {
    element.getContext = () => ({
      setTransform: () => {},
      clearRect: () => {},
      fillRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      strokeRect: () => {},
      fillText: () => {},
      arc: () => {},
      ellipse: () => {},
      rect: () => {},
      clip: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      drawImage: () => {},
      canvas: {
        getBoundingClientRect: () => ({ width: 960, height: 540 }),
      },
    });
  }

  return element;
}

describe("Q1 MVP End-to-End & Device Acceptance Smoke Tests", () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    globalThis.document = {
      createElement: (tag: string) => createMockElement(tag),
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as Document;
  });

  afterEach(() => {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  });

  describe("1. Browser Smoke Test: Bootstrap, 2-4 Player Join, Pause, Resize, Shift & Error Boundary", () => {
    it("manages complete game lifecycle with 2, 3, and 4 players, pause/resume, and restart", () => {
      const container = createMockElement("div") as unknown as HTMLElement;
      const keyboard = new KeyboardState();
      const game = new Game(container, {
        inputOptions: { keyboard },
        loopOptions: { raf: () => 1, caf: () => {} },
      });

      // Title phase with default 2 players joined
      expect(game.getState().phase).toBe("title");
      expect(game.getState().players.filter((p) => p.joined).length).toBe(2);

      // Join 3rd and 4th player
      game.togglePlayerSlot(2);
      expect(game.getState().players[2].joined).toBe(true);
      expect(game.getState().players.filter((p) => p.joined).length).toBe(3);

      game.togglePlayerSlot(3);
      expect(game.getState().players[3].joined).toBe(true);
      expect(game.getState().players.filter((p) => p.joined).length).toBe(4);

      // Start the match
      game.startMatch();
      expect(game.getState().phase).toBe("running");
      expect(game.getState().players.filter((p) => p.joined).length).toBe(4);

      // Test pause freezing
      game.togglePause();
      expect(game.getState().phase).toBe("paused");
      const timeRemaining = game.getState().shift.timeRemaining;
      game.update(1.0);
      expect(game.getState().shift.timeRemaining).toBe(timeRemaining);

      // Unpause
      game.togglePause();
      expect(game.getState().phase).toBe("running");
      game.update(1.0);
      expect(game.getState().shift.timeRemaining).toBeLessThan(timeRemaining);

      // Test error boundary
      game.setError("Testfehler für Error-Overlay");
      expect(game.getState().phase).toBe("error");
      expect(game.getState().errorMessage).toContain("Testfehler");

      // Reset to title recovers from error
      game.resetToTitle();
      expect(game.getState().phase).toBe("title");

      // Complete full shift and verify score display
      game.startMatch();
      game.update(125);
      expect(game.getState().phase).toBe("completed");
      expect(game.getState().shift.isFinished).toBe(true);

      // Clean teardown
      game.destroy();
    });
  });

  describe("2. End-to-End Simulation: Complete Order Workflow for all 4 Recipes and 5 Stations", () => {
    const testRecipes: RecipeId[] = [
      "salmon-nigiri",
      "cucumber-maki",
      "salmon-maki",
      "avocado-maki",
    ];

    it("verifies all 4 recipes are defined in the game configuration", () => {
      expect(ALL_RECIPE_IDS).toContain("salmon-nigiri");
      expect(ALL_RECIPE_IDS).toContain("cucumber-maki");
      expect(ALL_RECIPE_IDS).toContain("salmon-maki");
      expect(ALL_RECIPE_IDS).toContain("avocado-maki");
      expect(ALL_RECIPE_IDS.length).toBe(4);
    });

    for (const recipeId of testRecipes) {
      it(`completes full recipe lifecycle from order to delivery: ${recipeId}`, () => {
        let state: WorldState = {
          ...createInitialWorldState(),
          phase: "running",
          players: [
            {
              ...createInitialWorldState().players[0],
              joined: true,
              pos: { x: 160, y: 390 }, // In front of Order Station
              facing: { x: 0, y: 1 },
              targetStationId: "station-order",
            },
            {
              ...createInitialWorldState().players[1],
              joined: true,
              pos: { x: 600, y: 160 }, // In front of Fridge
              facing: { x: 0, y: -1 },
              targetStationId: "station-fridge",
            },
            createInitialWorldState().players[2],
            createInitialWorldState().players[3],
          ],
        };

        // 1. Order Creation & Acceptance at station-order
        const pending = createPendingOrder(`order-${recipeId}`, recipeId, 60);
        const order = createActiveOrderFromPending(pending);
        state = {
          ...state,
          activeOrders: [order],
        };

        // 2. Cook rice at station-rice
        state = {
          ...state,
          riceCooker: {
            state: "ready",
            portions: 4,
            maxPortions: 4,
            cookTimeRemaining: 0,
            totalCookTime: 5,
            cookingProgress: 1,
          },
        };

        // Player 0 walks to rice cooker and collects rice
        state.players[0] = {
          ...state.players[0],
          pos: { x: 380, y: 160 },
          facing: { x: 0, y: -1 },
          targetStationId: "station-rice",
        };

        const pickRiceInput: [
          PlayerInput,
          PlayerInput,
          PlayerInput,
          PlayerInput,
        ] = [
          {
            ...createNeutralPlayerInput(),
            action1: true,
            action1Pressed: true,
          },
          createNeutralPlayerInput(),
          createNeutralPlayerInput(),
          createNeutralPlayerInput(),
        ];

        state = updateWorldState(state, 1 / 60, pickRiceInput);
        expect(state.players[0].carriedItem).not.toBeNull();
        expect(
          (state.players[0].carriedItem as IngredientItem)?.ingredient,
        ).toBe("rice");

        // Player 0 puts rice on station-roll-1
        state.players[0] = {
          ...state.players[0],
          pos: { x: 380, y: 390 },
          facing: { x: 0, y: 1 },
          targetStationId: "station-roll-1",
        };

        const dropRiceInput: [
          PlayerInput,
          PlayerInput,
          PlayerInput,
          PlayerInput,
        ] = [
          {
            ...createNeutralPlayerInput(),
            action1: true,
            action1Pressed: true,
          },
          createNeutralPlayerInput(),
          createNeutralPlayerInput(),
          createNeutralPlayerInput(),
        ];

        state = updateWorldState(state, 1 / 60, dropRiceInput);
        expect(state.players[0].carriedItem).toBeNull();
        expect(
          state.rollStations["station-roll-1"].items.map(
            (i) => (i as IngredientItem).ingredient,
          ),
        ).toContain("rice");

        // If recipe needs nori, Player 1 gets nori from fridge (x = 560)
        if (recipeId !== "salmon-nigiri") {
          state.players[1] = {
            ...state.players[1],
            pos: { x: 560, y: 160 },
            facing: { x: 0, y: -1 },
            targetStationId: "station-fridge",
          };

          const pickNoriInput: [
            PlayerInput,
            PlayerInput,
            PlayerInput,
            PlayerInput,
          ] = [
            createNeutralPlayerInput(),
            {
              ...createNeutralPlayerInput(),
              action1: true,
              action1Pressed: true,
            },
            createNeutralPlayerInput(),
            createNeutralPlayerInput(),
          ];

          state = updateWorldState(state, 1 / 60, pickNoriInput);
          expect(
            (state.players[1].carriedItem as IngredientItem)?.ingredient,
          ).toBe("nori");

          // Player 1 puts nori on station-roll-1
          state.players[1] = {
            ...state.players[1],
            pos: { x: 380, y: 390 },
            facing: { x: 0, y: 1 },
            targetStationId: "station-roll-1",
          };

          const dropNoriInput: [
            PlayerInput,
            PlayerInput,
            PlayerInput,
            PlayerInput,
          ] = [
            createNeutralPlayerInput(),
            {
              ...createNeutralPlayerInput(),
              action1: true,
              action1Pressed: true,
            },
            createNeutralPlayerInput(),
            createNeutralPlayerInput(),
          ];

          state = updateWorldState(state, 1 / 60, dropNoriInput);
          expect(state.players[1].carriedItem).toBeNull();
        }

        // Main ingredient (salmon, cucumber, avocado)
        const mainIng =
          recipeId === "salmon-nigiri" || recipeId === "salmon-maki"
            ? "salmon"
            : recipeId === "cucumber-maki"
              ? "cucumber"
              : "avocado";

        const fridgeX =
          mainIng === "salmon" ? 590 : mainIng === "cucumber" ? 615 : 640;

        state.players[1] = {
          ...state.players[1],
          pos: { x: fridgeX, y: 160 },
          facing: { x: 0, y: -1 },
          targetStationId: "station-fridge",
        };

        const pickMainInput: [
          PlayerInput,
          PlayerInput,
          PlayerInput,
          PlayerInput,
        ] = [
          createNeutralPlayerInput(),
          {
            ...createNeutralPlayerInput(),
            action1: true,
            action1Pressed: true,
          },
          createNeutralPlayerInput(),
          createNeutralPlayerInput(),
        ];

        state = updateWorldState(state, 1 / 60, pickMainInput);
        expect(
          (state.players[1].carriedItem as IngredientItem)?.ingredient,
        ).toBe(mainIng);

        // Put main ingredient on roll station 1
        state.players[1] = {
          ...state.players[1],
          pos: { x: 380, y: 390 },
          facing: { x: 0, y: 1 },
          targetStationId: "station-roll-1",
        };

        const dropMainInput: [
          PlayerInput,
          PlayerInput,
          PlayerInput,
          PlayerInput,
        ] = [
          createNeutralPlayerInput(),
          {
            ...createNeutralPlayerInput(),
            action1: true,
            action1Pressed: true,
          },
          createNeutralPlayerInput(),
          createNeutralPlayerInput(),
        ];

        state = updateWorldState(state, 1 / 60, dropMainInput);
        expect(state.players[1].carriedItem).toBeNull();

        // 3. Start rolling sushi at roll station 1
        state.players[0] = {
          ...state.players[0],
          pos: { x: 380, y: 390 },
          facing: { x: 0, y: 1 },
          targetStationId: "station-roll-1",
        };

        const startRollInput: [
          PlayerInput,
          PlayerInput,
          PlayerInput,
          PlayerInput,
        ] = [
          {
            ...createNeutralPlayerInput(),
            action1: true,
            action1Pressed: true,
          },
          createNeutralPlayerInput(),
          createNeutralPlayerInput(),
          createNeutralPlayerInput(),
        ];

        state = updateWorldState(state, 1 / 60, startRollInput);
        expect(state.rollStations["station-roll-1"].state).toBe("rolling");

        // Advance rolling timer (2.0s default) with neutral input
        const neutralInputs: [
          PlayerInput,
          PlayerInput,
          PlayerInput,
          PlayerInput,
        ] = [
          createNeutralPlayerInput(),
          createNeutralPlayerInput(),
          createNeutralPlayerInput(),
          createNeutralPlayerInput(),
        ];
        state = updateWorldState(state, 2.1, neutralInputs);
        expect(state.rollStations["station-roll-1"].state).toBe("idle");
        expect(state.rollStations["station-roll-1"].items.length).toBe(1);
        const rolledItem = state.rollStations["station-roll-1"]
          .items[0] as PlateItem;
        expect(rolledItem.type).toBe("plate");
        expect(rolledItem.recipeId).toBe(recipeId);

        // 4. Pick up finished plate from roll station 1
        const pickPlateInput: [
          PlayerInput,
          PlayerInput,
          PlayerInput,
          PlayerInput,
        ] = [
          {
            ...createNeutralPlayerInput(),
            action1: true,
            action1Pressed: true,
          },
          createNeutralPlayerInput(),
          createNeutralPlayerInput(),
          createNeutralPlayerInput(),
        ];

        state = updateWorldState(state, 1 / 60, pickPlateInput);
        expect(state.players[0].carriedItem).not.toBeNull();
        expect((state.players[0].carriedItem as PlateItem)?.recipeId).toBe(
          recipeId,
        );

        // 5. Deliver plate to station-delivery
        state.players[0] = {
          ...state.players[0],
          pos: { x: 760, y: 390 },
          facing: { x: 0, y: 1 },
          targetStationId: "station-delivery",
        };

        const deliverInput: [
          PlayerInput,
          PlayerInput,
          PlayerInput,
          PlayerInput,
        ] = [
          {
            ...createNeutralPlayerInput(),
            action1: true,
            action1Pressed: true,
          },
          createNeutralPlayerInput(),
          createNeutralPlayerInput(),
          createNeutralPlayerInput(),
        ];

        state = updateWorldState(state, 1 / 60, deliverInput);

        // Delivery successful: plate delivered, active order resolved, score awarded
        expect(state.players[0].carriedItem).toBeNull();
        expect(state.activeOrders.length).toBe(0);
        expect(state.scoreState.completedOrders).toBe(1);
        expect(state.scoreState.totalScore).toBeGreaterThan(0);
      });
    }

    it("supports simultaneous parallel preparation at Rollstation 1 and Rollstation 2 by 4 players", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
      };

      // Set up station 1 with ingredients for Salmon Nigiri (Rice + Salmon)
      state = {
        ...state,
        rollStations: {
          ...state.rollStations,
          "station-roll-1": {
            state: "idle",
            items: [
              createIngredientItem("rice"),
              createIngredientItem("salmon"),
            ],
            rollingTimeRemaining: 0,
            totalRollingTime: 2.0,
            rollingProgress: 0,
            rollingRecipeId: null,
          },
          // Set up station 2 with ingredients for Cucumber Maki (Rice + Nori + Cucumber)
          "station-roll-2": {
            state: "idle",
            items: [
              createIngredientItem("rice"),
              createIngredientItem("nori"),
              createIngredientItem("cucumber"),
            ],
            rollingTimeRemaining: 0,
            totalRollingTime: 2.0,
            rollingProgress: 0,
            rollingRecipeId: null,
          },
        },
      };

      // Position P0 at Rollstation 1 and P1 at Rollstation 2
      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll-1",
      };
      state.players[1] = {
        ...state.players[1],
        pos: { x: 570, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll-2",
      };

      // Both players press action1 simultaneously
      const inputs: [PlayerInput, PlayerInput, PlayerInput, PlayerInput] = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ];

      state = updateWorldState(state, 1 / 60, inputs);
      expect(state.rollStations["station-roll-1"].state).toBe("rolling");
      expect(state.rollStations["station-roll-2"].state).toBe("rolling");

      // Advance time for rolling (2.1s) with neutral input
      const neutralInputs: [
        PlayerInput,
        PlayerInput,
        PlayerInput,
        PlayerInput,
      ] = [
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ];
      state = updateWorldState(state, 2.1, neutralInputs);
      expect(state.rollStations["station-roll-1"].state).toBe("idle");
      expect(state.rollStations["station-roll-2"].state).toBe("idle");
      expect(
        (state.rollStations["station-roll-1"].items[0] as PlateItem).recipeId,
      ).toBe("salmon-nigiri");
      expect(
        (state.rollStations["station-roll-2"].items[0] as PlateItem).recipeId,
      ).toBe("cucumber-maki");
    });
  });

  describe("3. Multi-Device Input Matrix: Keyboard Schemes + Gamepads", () => {
    it("processes distinct inputs for Keyboard 1 (Arrows), Keyboard 2 (WASD), Gamepad 0 and Gamepad 1 without interference", () => {
      const keyboard = new KeyboardState();

      const mockGamepads: (Gamepad | null)[] = [
        {
          id: "Xbox Controller 1",
          index: 0,
          connected: true,
          axes: [0.8, -0.8], // Diagonal up-right
          buttons: [
            { pressed: true, value: 1, touched: true }, // action1 (index 0)
            { pressed: false, value: 0, touched: false },
          ],
          timestamp: 1000,
          mapping: "standard",
        } as unknown as Gamepad,
        {
          id: "PlayStation Controller 2",
          index: 1,
          connected: true,
          axes: [-1.0, 0], // Left
          buttons: [
            { pressed: false, value: 0, touched: false },
            { pressed: true, value: 1, touched: true }, // action2 (index 1)
          ],
          timestamp: 1000,
          mapping: "standard",
        } as unknown as Gamepad,
      ];

      const gamepadInput = new GamepadInput({
        gamepadProvider: () => mockGamepads,
        deadzone: 0.2,
      });

      // Keyboard 1 (Arrows): Right + Up (diagonal) + Action1 (KeyK)
      keyboard.setKeyDown(KEYBOARD_LAYOUTS.arrows.right[0]);
      keyboard.setKeyDown(KEYBOARD_LAYOUTS.arrows.up[0]);
      keyboard.setKeyDown(KEYBOARD_LAYOUTS.arrows.action1[0]);

      // Keyboard 2 (WASD): Left + Down (diagonal) + Action2 (KeyG)
      keyboard.setKeyDown(KEYBOARD_LAYOUTS.wasd.left[0]);
      keyboard.setKeyDown(KEYBOARD_LAYOUTS.wasd.down[0]);
      keyboard.setKeyDown(KEYBOARD_LAYOUTS.wasd.action2[0]);

      const input1 = keyboard.getRawInput("arrows");
      const input2 = keyboard.getRawInput("wasd");
      const input3 = gamepadInput.getRawInput(0);
      const input4 = gamepadInput.getRawInput(1);

      // Verify Keyboard 1: normalized diagonal
      expect(input1.move.x).toBeCloseTo(Math.SQRT1_2, 3);
      expect(input1.move.y).toBeCloseTo(-Math.SQRT1_2, 3);
      expect(input1.action1).toBe(true);
      expect(input1.action2).toBe(false);

      // Verify Keyboard 2: normalized diagonal
      expect(input2.move.x).toBeCloseTo(-Math.SQRT1_2, 3);
      expect(input2.move.y).toBeCloseTo(Math.SQRT1_2, 3);
      expect(input2.action1).toBe(false);
      expect(input2.action2).toBe(true);

      // Verify Gamepad 0
      expect(input3.move.x).toBeGreaterThan(0);
      expect(input3.move.y).toBeLessThan(0);
      expect(input3.action1).toBe(true);
      expect(input3.action2).toBe(false);

      // Verify Gamepad 1
      expect(input4.move.x).toBeCloseTo(-1, 2);
      expect(input4.move.y).toBeCloseTo(0, 2);
      expect(input4.action1).toBe(false);
      expect(input4.action2).toBe(true);
    });

    it("returns neutral fallback when gamepads disconnect unexpectedly", () => {
      const gamepadInput = new GamepadInput({
        gamepadProvider: () => [null, null],
      });

      const input = gamepadInput.getRawInput(0);
      expect(input.move).toEqual({ x: 0, y: 0 });
      expect(input.action1).toBe(false);
      expect(input.action2).toBe(false);
    });
  });

  describe("4. Station Cleaning, Counter Storage and Trash Disposal", () => {
    it("allows discarding unwanted or expired items into the trash / clearing work surfaces", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
      };

      // Player 0 holds an unwanted ingredient
      state.players[0] = {
        ...state.players[0],
        carriedItem: createIngredientItem("nori"),
      };

      // Drop item with action2
      const dropInput: [PlayerInput, PlayerInput, PlayerInput, PlayerInput] = [
        { ...createNeutralPlayerInput(), action2: true, action2Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ];

      state = updateWorldState(state, 1 / 60, dropInput);
      expect(state.players[0].carriedItem).toBeNull();
      expect(state.droppedItems.length).toBe(1);

      // Player 0 picks it up again with action1
      const pickInput: [PlayerInput, PlayerInput, PlayerInput, PlayerInput] = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ];

      state = updateWorldState(state, 1 / 60, pickInput);
      expect(state.players[0].carriedItem).not.toBeNull();
      expect(state.droppedItems.length).toBe(0);
    });
  });

  describe("5. Viewport Resize and DPR Scaling Verification", () => {
    it("handles canvas resizing without crashing or losing game state", () => {
      const container = createMockElement("div") as unknown as HTMLElement;
      const game = new Game(container, {
        loopOptions: { raf: () => 1, caf: () => {} },
      });

      game.startMatch();
      expect(game.getState().phase).toBe("running");

      // Trigger resize
      game.render(0);
      expect(game.getState().phase).toBe("running");

      game.destroy();
    });
  });
});
