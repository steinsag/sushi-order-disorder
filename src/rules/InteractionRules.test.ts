import { describe, expect, it } from "vitest";
import {
  createInitialWorldState,
  updateWorldState,
  type WorldState,
} from "../state/WorldState";
import { createNeutralPlayerInput } from "../input/PlayerInput";
import {
  advanceStationTimers,
  getFridgeIngredientForPlayerPos,
} from "./InteractionRules";
import {
  createIngredientItem,
  createPlateItem,
  type IngredientItem,
} from "../state/ItemState";
import {
  createActiveOrderFromPending,
  createPendingOrder,
} from "../state/OrderState";
import { createInitialRiceCookerState } from "../state/StationState";

describe("InteractionRules", () => {
  describe("Fridge compartment selection", () => {
    it("selects correct ingredient based on relative player X position", () => {
      const fridgeCenter = { x: 600, y: 110 };
      expect(
        getFridgeIngredientForPlayerPos({ x: 560, y: 160 }, fridgeCenter),
      ).toBe("nori");
      expect(
        getFridgeIngredientForPlayerPos({ x: 590, y: 160 }, fridgeCenter),
      ).toBe("salmon");
      expect(
        getFridgeIngredientForPlayerPos({ x: 610, y: 160 }, fridgeCenter),
      ).toBe("cucumber");
      expect(
        getFridgeIngredientForPlayerPos({ x: 640, y: 160 }, fridgeCenter),
      ).toBe("avocado");
    });

    it("allows a player to pick up ingredients from fridge with action1", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
      };

      // Position P0 in front of fridge salmon compartment
      state.players[0] = {
        ...state.players[0],
        pos: { x: 590, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-fridge",
        carriedItem: null,
      };

      const inputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, inputs);
      expect(state.players[0].carriedItem).not.toBeNull();
      expect((state.players[0].carriedItem as IngredientItem)?.ingredient).toBe(
        "salmon",
      );
    });

    it("swaps carried ingredient when interacting with fridge again", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
      };

      // P0 holding salmon moves to avocado slot (x=640)
      state.players[0] = {
        ...state.players[0],
        pos: { x: 640, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-fridge",
        carriedItem: createIngredientItem("salmon"),
      };

      const inputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, inputs);
      expect((state.players[0].carriedItem as IngredientItem)?.ingredient).toBe(
        "avocado",
      );
    });
  });

  describe("Rice Cooker State & Cooking", () => {
    it("starts empty by default and can be started via action1", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
      };

      expect(state.riceCooker.state).toBe("empty");
      expect(state.riceCooker.portions).toBe(0);

      // Position P0 at rice cooker
      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-rice",
        carriedItem: null,
      };

      const inputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, inputs);
      expect(state.riceCooker.state).toBe("cooking");
      expect(state.riceCooker.cookTimeRemaining).toBe(
        state.riceCooker.totalCookTime,
      );
    });

    it("dispenses rice when ready and decrements portions", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        riceCooker: createInitialRiceCookerState(4),
      };

      expect(state.riceCooker.state).toBe("ready");
      const initialPortions = state.riceCooker.portions;

      // Position P0 at rice cooker
      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-rice",
        carriedItem: null,
      };

      const inputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, inputs);
      expect((state.players[0].carriedItem as IngredientItem)?.ingredient).toBe(
        "rice",
      );
      expect(state.riceCooker.portions).toBe(initialPortions - 1);
    });

    it("does not return carried rice into rice cooker on action1", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        riceCooker: createInitialRiceCookerState(3),
      };

      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-rice",
        carriedItem: createIngredientItem("rice"),
      };

      const inputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, inputs);
      // Player continues carrying rice, portions unchanged
      expect((state.players[0].carriedItem as IngredientItem)?.ingredient).toBe(
        "rice",
      );
      expect(state.riceCooker.portions).toBe(3);
    });

    it("transitions to empty when last portion is taken, then cooking can be started", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        riceCooker: {
          ...createInitialWorldState().riceCooker,
          portions: 1,
          state: "ready",
        },
      };

      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-rice",
        carriedItem: null,
      };

      const inputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      // Take last portion
      state = updateWorldState(state, 1 / 60, inputs);
      expect((state.players[0].carriedItem as IngredientItem)?.ingredient).toBe(
        "rice",
      );
      expect(state.riceCooker.portions).toBe(0);
      expect(state.riceCooker.state).toBe("empty");

      // P1 tries to interact with empty rice cooker -> starts cooking
      state.players[1] = {
        ...state.players[1],
        pos: { x: 380, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-rice",
        carriedItem: null,
      };

      const inputsCook = [
        createNeutralPlayerInput(),
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, inputsCook);
      expect(state.riceCooker.state).toBe("cooking");
      expect(state.riceCooker.cookTimeRemaining).toBe(
        state.riceCooker.totalCookTime,
      );
    });

    it("advances cooking timer and becomes ready with full portions", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        riceCooker: {
          state: "cooking",
          portions: 0,
          maxPortions: 4,
          cookTimeRemaining: 5.0,
          totalCookTime: 5.0,
          cookingProgress: 0,
        },
      };

      // Advance by 2.5 seconds
      state = advanceStationTimers(state, 2.5);
      expect(state.riceCooker.state).toBe("cooking");
      expect(state.riceCooker.cookTimeRemaining).toBeCloseTo(2.5, 3);
      expect(state.riceCooker.cookingProgress).toBeCloseTo(0.5, 3);

      // Advance remaining time
      state = advanceStationTimers(state, 2.6);
      expect(state.riceCooker.state).toBe("ready");
      expect(state.riceCooker.portions).toBe(4);
      expect(state.riceCooker.cookingProgress).toBe(1);
    });

    it("allows cancelling cooking via action2", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        riceCooker: {
          state: "cooking",
          portions: 0,
          maxPortions: 4,
          cookTimeRemaining: 3.0,
          totalCookTime: 5.0,
          cookingProgress: 0.4,
        },
      };

      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-rice",
        carriedItem: null,
      };

      const inputs = [
        { ...createNeutralPlayerInput(), action2: true, action2Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, inputs);
      expect(state.riceCooker.state).toBe("empty");
      expect(state.riceCooker.cookTimeRemaining).toBe(0);
    });
  });

  describe("Roll Station & Recipes", () => {
    it("places item onto roll station and allows picking it back up if recipe incomplete", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
      };

      // P0 holding nori at roll station (x=380, y=440)
      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
        carriedItem: createIngredientItem("nori"),
      };

      const placeInput = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      // Place nori
      state = updateWorldState(state, 1 / 60, placeInput);
      expect(state.players[0].carriedItem).toBeNull();
      expect(state.rollStation.items).toHaveLength(1);
      expect(state.rollStation.items[0].type).toBe("ingredient");
      if (state.rollStation.items[0].type === "ingredient") {
        expect(state.rollStation.items[0].ingredient).toBe("nori");
      }

      // Pick nori back up (incomplete recipe, so action1 pops item)
      state = updateWorldState(state, 1 / 60, placeInput);
      expect(state.players[0].carriedItem?.type).toBe("ingredient");
      if (state.players[0].carriedItem?.type === "ingredient") {
        expect(state.players[0].carriedItem.ingredient).toBe("nori");
      }
      expect(state.rollStation.items).toHaveLength(0);
    });

    it("starts rolling cucumber-maki when nori, rice, and cucumber are assembled and produces a plate", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        rollStation: {
          ...createInitialWorldState().rollStation,
          items: [
            createIngredientItem("nori"),
            createIngredientItem("rice"),
            createIngredientItem("cucumber"),
          ],
        },
      };

      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
        carriedItem: null,
      };

      const startRollInput = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      // 1. Trigger rolling
      state = updateWorldState(state, 1 / 60, startRollInput);
      expect(state.rollStation.state).toBe("rolling");
      expect(state.rollStation.rollingRecipeId).toBe("cucumber-maki");
      expect(state.rollStation.items).toHaveLength(0);
      expect(state.rollStation.rollingTimeRemaining).toBeCloseTo(2.0, 1);

      // 2. Advance time partially
      state = advanceStationTimers(state, 1.0);
      expect(state.rollStation.state).toBe("rolling");
      expect(state.rollStation.rollingProgress).toBeCloseTo(0.5, 2);

      // 3. Complete roll duration
      state = advanceStationTimers(state, 1.1);
      expect(state.rollStation.state).toBe("idle");
      expect(state.rollStation.rollingRecipeId).toBeNull();
      expect(state.rollStation.items).toHaveLength(1);
      expect(state.rollStation.items[0].type).toBe("plate");
      if (state.rollStation.items[0].type === "plate") {
        expect(state.rollStation.items[0].recipeId).toBe("cucumber-maki");
      }

      // 4. Pick up finished plate
      const takePlateInput = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, takePlateInput);
      expect(state.rollStation.items).toHaveLength(0);
      expect(state.players[0].carriedItem?.type).toBe("plate");
      if (state.players[0].carriedItem?.type === "plate") {
        expect(state.players[0].carriedItem.recipeId).toBe("cucumber-maki");
      }
    });

    it("does not start rolling when missing or incorrect ingredients are on the roll station", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        rollStation: {
          ...createInitialWorldState().rollStation,
          items: [
            createIngredientItem("nori"),
            createIngredientItem("cucumber"),
            createIngredientItem("salmon"), // Missing rice, extra salmon
          ],
        },
      };

      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
        carriedItem: null,
      };

      const interactInput = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      // Interaction should take top item (salmon) instead of starting rolling
      state = updateWorldState(state, 1 / 60, interactInput);
      expect(state.rollStation.state).toBe("idle");
      expect(state.players[0].carriedItem?.type).toBe("ingredient");
      if (state.players[0].carriedItem?.type === "ingredient") {
        expect(state.players[0].carriedItem.ingredient).toBe("salmon");
      }
      expect(state.rollStation.items).toHaveLength(2);
    });

    it("blocks placing items on roll station while rolling is in progress", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        rollStation: {
          state: "rolling",
          items: [],
          rollingRecipeId: "cucumber-maki",
          rollingTimeRemaining: 1.5,
          totalRollingTime: 2.0,
          rollingProgress: 0.25,
        },
      };

      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
        carriedItem: createIngredientItem("avocado"),
      };

      const placeInput = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, placeInput);
      // Item should still be carried, rollStation items unchanged
      expect(state.players[0].carriedItem?.type).toBe("ingredient");
      expect(state.rollStation.items).toHaveLength(0);
      expect(state.rollStation.state).toBe("rolling");
    });

    it("allows cancelling rolling via action2 and restores ingredients", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        rollStation: {
          state: "rolling",
          items: [],
          rollingRecipeId: "cucumber-maki",
          rollingTimeRemaining: 1.5,
          totalRollingTime: 2.0,
          rollingProgress: 0.25,
        },
      };

      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
        carriedItem: null,
      };

      const cancelInput = [
        { ...createNeutralPlayerInput(), action2: true, action2Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, cancelInput);
      expect(state.rollStation.state).toBe("idle");
      expect(state.rollStation.rollingRecipeId).toBeNull();
      expect(state.rollStation.items).toHaveLength(3);
    });

    it("allows staging items on island counter", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
      };

      state.players[0] = {
        ...state.players[0],
        pos: { x: 480, y: 330 },
        facing: { x: 0, y: -1 },
        targetStationId: "counter-island",
        carriedItem: createIngredientItem("cucumber"),
      };

      const placeInput = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      // Place on counter
      state = updateWorldState(state, 1 / 60, placeInput);
      expect(state.players[0].carriedItem).toBeNull();
      expect(state.counters["counter-island"].items).toHaveLength(1);
      expect(state.counters["counter-island"].items[0].type).toBe("ingredient");
      if (state.counters["counter-island"].items[0].type === "ingredient") {
        expect(state.counters["counter-island"].items[0].ingredient).toBe(
          "cucumber",
        );
      }

      // P1 picks it up from counter
      state.players[1] = {
        ...state.players[1],
        pos: { x: 480, y: 330 },
        facing: { x: 0, y: -1 },
        targetStationId: "counter-island",
        carriedItem: null,
      };

      const p1TakeInput = [
        createNeutralPlayerInput(),
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, p1TakeInput);
      if (state.players[1].carriedItem?.type === "ingredient") {
        expect(state.players[1].carriedItem.ingredient).toBe("cucumber");
      }
      expect(state.counters["counter-island"].items).toHaveLength(0);
    });
  });

  describe("Floor Drop & Pickup", () => {
    it("drops carried item to floor on action2 and picks it back up with action1", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
      };

      // P0 in middle of kitchen holding avocado
      state.players[0] = {
        ...state.players[0],
        pos: { x: 300, y: 300 },
        facing: { x: 1, y: 0 },
        targetStationId: null,
        carriedItem: createIngredientItem("avocado"),
      };

      const dropInput = [
        { ...createNeutralPlayerInput(), action2: true, action2Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, dropInput);
      expect(state.players[0].carriedItem).toBeNull();
      expect(state.droppedItems).toHaveLength(1);
      expect((state.droppedItems[0].item as IngredientItem)?.ingredient).toBe(
        "avocado",
      );

      // Pick up with action1
      const pickupInput = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, pickupInput);
      expect((state.players[0].carriedItem as IngredientItem)?.ingredient).toBe(
        "avocado",
      );
      expect(state.droppedItems).toHaveLength(0);
    });
  });

  describe("Co-op & Concurrent Actions", () => {
    it("two players bring different ingredients to roll station without duplication or loss", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
      };

      // P0 brings Nori, P1 brings Salmon to roll station
      state.players[0] = {
        ...state.players[0],
        pos: { x: 360, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
        carriedItem: createIngredientItem("nori"),
      };
      state.players[1] = {
        ...state.players[1],
        pos: { x: 400, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
        carriedItem: createIngredientItem("salmon"),
      };

      // Both press action1 in the same tick
      const simultaneousInputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, simultaneousInputs);

      expect(state.players[0].carriedItem).toBeNull();
      expect(state.players[1].carriedItem).toBeNull();
      expect(state.rollStation.items).toHaveLength(2);
      expect(
        state.rollStation.items.map((i) =>
          i.type === "ingredient" ? i.ingredient : null,
        ),
      ).toEqual(["nori", "salmon"]);
    });

    it("two players interacting simultaneously on a complete recipe stack starts only one roll", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        rollStation: {
          ...createInitialWorldState().rollStation,
          items: [
            createIngredientItem("nori"),
            createIngredientItem("rice"),
            createIngredientItem("cucumber"),
          ],
        },
      };

      state.players[0] = {
        ...state.players[0],
        pos: { x: 360, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
        carriedItem: null,
      };
      state.players[1] = {
        ...state.players[1],
        pos: { x: 400, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
        carriedItem: null,
      };

      const simultaneousInputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, simultaneousInputs);

      // Exactly one roll started
      expect(state.rollStation.state).toBe("rolling");
      expect(state.rollStation.rollingRecipeId).toBe("cucumber-maki");
      expect(state.players[0].carriedItem).toBeNull();
      expect(state.players[1].carriedItem).toBeNull();

      // Finish roll
      state = advanceStationTimers(state, 2.1);
      expect(state.rollStation.state).toBe("idle");
      expect(state.rollStation.items).toHaveLength(1);
      expect(state.rollStation.items[0].type).toBe("plate");
    });

    it("two players interacting simultaneously on a finished plate yields exactly one plate without duplication", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        rollStation: {
          ...createInitialWorldState().rollStation,
          items: [createPlateItem("cucumber-maki")],
        },
      };

      state.players[0] = {
        ...state.players[0],
        pos: { x: 360, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
        carriedItem: null,
      };
      state.players[1] = {
        ...state.players[1],
        pos: { x: 400, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
        carriedItem: null,
      };

      const simultaneousInputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, simultaneousInputs);

      // P0 got the plate
      expect(state.players[0].carriedItem?.type).toBe("plate");
      // P1 got nothing
      expect(state.players[1].carriedItem).toBeNull();
      // Roll station is empty
      expect(state.rollStation.items).toHaveLength(0);
    });

    it("two players attempting to take the last rice portion simultaneously prevents duplication", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        riceCooker: {
          ...createInitialWorldState().riceCooker,
          portions: 1,
          state: "ready",
        },
      };

      state.players[0] = {
        ...state.players[0],
        pos: { x: 360, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-rice",
        carriedItem: null,
      };
      state.players[1] = {
        ...state.players[1],
        pos: { x: 400, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-rice",
        carriedItem: null,
      };

      const simultaneousInputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, simultaneousInputs);

      // P0 got the 1 portion
      expect((state.players[0].carriedItem as IngredientItem)?.ingredient).toBe(
        "rice",
      );
      // P1 did not get duplicate rice
      expect(state.players[1].carriedItem).toBeNull();
      // Rice cooker is now empty (or started cooking if P1 triggered empty cooker)
      expect(state.riceCooker.portions).toBe(0);
    });
  });

  describe("Order Station Interactions & Timers", () => {
    it("accepts a pending order at station-order with action1", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
      };

      expect(state.orderStation.pendingOrder).not.toBeNull();
      expect(state.activeOrders).toHaveLength(0);

      // Position P0 at station-order (160, 440)
      state.players[0] = {
        ...state.players[0],
        pos: { x: 160, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-order",
        carriedItem: null,
      };

      const inputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, inputs);

      expect(state.orderStation.pendingOrder).toBeNull();
      expect(state.activeOrders).toHaveLength(1);
      expect(state.activeOrders[0].recipeId).toBe("cucumber-maki");
      expect(state.activeOrders[0].status).toBe("active");
      expect(state.activeOrders[0].timeRemaining).toBeCloseTo(45);
    });

    it("allows accepting an order while carrying an item", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
      };

      state.players[0] = {
        ...state.players[0],
        pos: { x: 160, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-order",
        carriedItem: createIngredientItem("nori"),
      };

      const inputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, inputs);

      expect(state.activeOrders).toHaveLength(1);
      // Carried item remains in player's hand
      expect((state.players[0].carriedItem as IngredientItem)?.ingredient).toBe(
        "nori",
      );
    });

    it("counts down active order timer during updateWorldState simulation", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
      };

      // Accept order first
      state.players[0] = {
        ...state.players[0],
        pos: { x: 160, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-order",
      };

      const acceptInput = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, acceptInput);
      expect(state.activeOrders[0].timeRemaining).toBeCloseTo(45);

      // Advance by 10 seconds (600 ticks of 1/60s)
      for (let i = 0; i < 600; i++) {
        state = updateWorldState(state, 1 / 60);
      }

      expect(state.activeOrders[0].timeRemaining).toBeCloseTo(35, 0.1);
      expect(state.activeOrders[0].status).toBe("active");
    });
  });

  describe("Delivery Station Interactions & Complete Order Path", () => {
    it("delivers a matching plate on-time and increments score", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        activeOrders: [
          {
            id: "ord-1",
            recipeId: "cucumber-maki",
            totalTime: 45,
            timeRemaining: 25,
            isExpress: false,
            status: "active",
          },
        ],
      };

      // Position P0 at delivery station carrying cucumber-maki plate
      state.players[0] = {
        ...state.players[0],
        pos: { x: 760, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-delivery",
        carriedItem: createPlateItem("cucumber-maki"),
      };

      const inputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, inputs);

      // Plate is delivered
      expect(state.players[0].carriedItem).toBeNull();
      // Active order fulfilled and removed
      expect(state.activeOrders).toHaveLength(0);
      // Score awarded
      expect(state.scoreState.totalScore).toBe(100);
      expect(state.scoreState.completedOrders).toBe(1);
      expect(state.scoreState.onTimeOrders).toBe(1);
      expect(state.scoreState.recentFeedback?.type).toBe("success");
    });

    it("delivers a plate via action2Pressed (Abgeben/Ablegen key) as well", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        activeOrders: [
          {
            id: "ord-1",
            recipeId: "cucumber-maki",
            totalTime: 45,
            timeRemaining: 25,
            isExpress: false,
            status: "active",
          },
        ],
      };

      state.players[0] = {
        ...state.players[0],
        pos: { x: 760, y: 380 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-delivery",
        carriedItem: createPlateItem("cucumber-maki"),
      };

      const inputs = [
        { ...createNeutralPlayerInput(), action2: true, action2Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, inputs);

      expect(state.players[0].carriedItem).toBeNull();
      expect(state.activeOrders).toHaveLength(0);
      expect(state.scoreState.totalScore).toBe(100);
      expect(state.scoreState.completedOrders).toBe(1);
      expect(state.scoreState.recentFeedback?.type).toBe("success");
    });

    it("delivers an expired order with reduced points", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        activeOrders: [
          {
            id: "ord-late",
            recipeId: "cucumber-maki",
            totalTime: 45,
            timeRemaining: 0,
            isExpress: false,
            status: "expired",
          },
        ],
      };

      state.players[0] = {
        ...state.players[0],
        pos: { x: 760, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-delivery",
        carriedItem: createPlateItem("cucumber-maki"),
      };

      const inputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, inputs);

      expect(state.players[0].carriedItem).toBeNull();
      expect(state.activeOrders).toHaveLength(0);
      expect(state.scoreState.totalScore).toBe(50);
      expect(state.scoreState.completedOrders).toBe(1);
      expect(state.scoreState.lateOrders).toBe(1);
      expect(state.scoreState.recentFeedback?.type).toBe("late");
    });

    it("penalizes delivery of an incorrect dish and keeps active orders intact", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        scoreState: {
          totalScore: 50,
          completedOrders: 1,
          onTimeOrders: 1,
          lateOrders: 0,
          wrongDeliveries: 0,
          recentFeedback: null,
        },
        activeOrders: [
          {
            id: "ord-cuke",
            recipeId: "cucumber-maki",
            totalTime: 45,
            timeRemaining: 30,
            isExpress: false,
            status: "active",
          },
        ],
      };

      // Player carries salmon-nigiri plate to delivery
      state.players[0] = {
        ...state.players[0],
        pos: { x: 760, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-delivery",
        carriedItem: createPlateItem("salmon-nigiri"),
      };

      const inputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, inputs);

      // Plate is cleared from player hand
      expect(state.players[0].carriedItem).toBeNull();
      // Active order remains open
      expect(state.activeOrders).toHaveLength(1);
      expect(state.activeOrders[0].id).toBe("ord-cuke");
      // Score penalized
      expect(state.scoreState.totalScore).toBe(30); // 50 - 20
      expect(state.scoreState.wrongDeliveries).toBe(1);
      expect(state.scoreState.recentFeedback?.type).toBe("wrong");
    });

    it("does not accept raw ingredients at delivery station", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        activeOrders: [
          {
            id: "ord-1",
            recipeId: "cucumber-maki",
            totalTime: 45,
            timeRemaining: 30,
            isExpress: false,
            status: "active",
          },
        ],
      };

      state.players[0] = {
        ...state.players[0],
        pos: { x: 760, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-delivery",
        carriedItem: createIngredientItem("cucumber"),
      };

      const inputs = [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      state = updateWorldState(state, 1 / 60, inputs);

      // Player still holds raw cucumber, score and orders unchanged
      expect((state.players[0].carriedItem as IngredientItem)?.ingredient).toBe(
        "cucumber",
      );
      expect(state.scoreState.totalScore).toBe(0);
      expect(state.activeOrders).toHaveLength(1);
    });

    it("plays through a complete cooperative order lifecycle (order -> ingredients -> roll -> deliver)", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
      };

      // 1. P0 accepts order at station-order
      state.players[0] = {
        ...state.players[0],
        pos: { x: 160, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-order",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect(state.activeOrders).toHaveLength(1);
      expect(state.activeOrders[0].recipeId).toBe("cucumber-maki");

      // 2. Prepare rice at rice cooker: start cooking and advance time
      state.players[1] = {
        ...state.players[1],
        pos: { x: 380, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-rice",
      };
      state = updateWorldState(state, 1 / 60, [
        createNeutralPlayerInput(),
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect(state.riceCooker.state).toBe("cooking");

      // Advance 10s so rice finishes
      for (let i = 0; i < 600; i++) {
        state = updateWorldState(state, 1 / 60);
      }
      expect(state.riceCooker.state).toBe("ready");

      // 3. P1 takes rice from cooker
      state.players[1] = {
        ...state.players[1],
        pos: { x: 380, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-rice",
      };
      state = updateWorldState(state, 1 / 60, [
        createNeutralPlayerInput(),
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect((state.players[1].carriedItem as IngredientItem)?.ingredient).toBe(
        "rice",
      );

      // 4. P1 puts rice onto roll station
      state.players[1] = {
        ...state.players[1],
        pos: { x: 380, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
      };
      state = updateWorldState(state, 1 / 60, [
        createNeutralPlayerInput(),
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect(state.players[1].carriedItem).toBeNull();
      expect(state.rollStation.items).toHaveLength(1);

      // 5. P0 gets nori from fridge and places on roll station
      state.players[0] = {
        ...state.players[0],
        pos: { x: 560, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-fridge",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect((state.players[0].carriedItem as IngredientItem)?.ingredient).toBe(
        "nori",
      );

      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect(state.players[0].carriedItem).toBeNull();
      expect(state.rollStation.items).toHaveLength(2);

      // 6. P0 gets cucumber from fridge and places on roll station
      state.players[0] = {
        ...state.players[0],
        pos: { x: 610, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-fridge",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect((state.players[0].carriedItem as IngredientItem)?.ingredient).toBe(
        "cucumber",
      );

      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect(state.rollStation.items).toHaveLength(3);

      // 7. P0 triggers rolling (action1 on roll station with valid recipe)
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect(state.rollStation.state).toBe("rolling");

      // Advance 2s for rolling animation
      for (let i = 0; i < 130; i++) {
        state = updateWorldState(state, 1 / 60);
      }
      expect(state.rollStation.state).toBe("idle");
      expect(state.rollStation.items).toHaveLength(1);
      expect(state.rollStation.items[0].type).toBe("plate");

      // 8. P0 picks up plate from roll station
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect(state.players[0].carriedItem?.type).toBe("plate");
      expect(state.rollStation.items).toHaveLength(0);

      // 9. P0 moves to delivery station and delivers plate
      state.players[0] = {
        ...state.players[0],
        pos: { x: 760, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-delivery",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);

      // 10. Verify order fulfilled and score increased
      expect(state.players[0].carriedItem).toBeNull();
      expect(state.activeOrders).toHaveLength(0);
      expect(state.scoreState.totalScore).toBe(100);
      expect(state.scoreState.completedOrders).toBe(1);
      expect(state.scoreState.onTimeOrders).toBe(1);
    });

    it("complete gameplay flow for salmon-nigiri (rice + salmon)", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        activeOrders: [
          createActiveOrderFromPending(
            createPendingOrder("ord-nigiri", "salmon-nigiri"),
          ),
        ],
        riceCooker: {
          ...createInitialWorldState().riceCooker,
          state: "ready",
          portions: 3,
        },
      };

      // 1. P0 takes rice and places on roll station
      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-rice",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect(state.players[0].carriedItem?.type).toBe("ingredient");

      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect(state.rollStation.items).toHaveLength(1);

      // 2. P0 takes salmon from fridge and places on roll station
      state.players[0] = {
        ...state.players[0],
        pos: { x: 590, y: 160 }, // Salmon pos in fridge
        facing: { x: 0, y: -1 },
        targetStationId: "station-fridge",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect((state.players[0].carriedItem as IngredientItem)?.ingredient).toBe(
        "salmon",
      );

      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect(state.rollStation.items).toHaveLength(2);

      // 3. Roll salmon-nigiri
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect(state.rollStation.state).toBe("rolling");
      expect(state.rollStation.rollingRecipeId).toBe("salmon-nigiri");

      // Advance roll timer
      for (let i = 0; i < 130; i++) {
        state = updateWorldState(state, 1 / 60);
      }
      expect(state.rollStation.state).toBe("idle");
      expect(
        (state.rollStation.items[0] as { recipeId: string }).recipeId,
      ).toBe("salmon-nigiri");

      // 4. Deliver salmon-nigiri
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      state.players[0] = {
        ...state.players[0],
        pos: { x: 760, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-delivery",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);

      expect(state.activeOrders).toHaveLength(0);
      expect(state.scoreState.totalScore).toBe(100);
      expect(state.scoreState.recentFeedback?.type).toBe("success");
    });

    it("complete gameplay flow for avocado-maki (nori + rice + avocado)", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        activeOrders: [
          createActiveOrderFromPending(
            createPendingOrder("ord-avocado", "avocado-maki"),
          ),
        ],
        riceCooker: {
          ...createInitialWorldState().riceCooker,
          state: "ready",
          portions: 3,
        },
      };

      // 1. Place rice
      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-rice",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);

      // 2. Place nori
      state.players[0] = {
        ...state.players[0],
        pos: { x: 560, y: 160 },
        facing: { x: 0, y: -1 },
        targetStationId: "station-fridge",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);

      // 3. Place avocado
      state.players[0] = {
        ...state.players[0],
        pos: { x: 640, y: 160 }, // Avocado pos in fridge
        facing: { x: 0, y: -1 },
        targetStationId: "station-fridge",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect((state.players[0].carriedItem as IngredientItem)?.ingredient).toBe(
        "avocado",
      );

      state.players[0] = {
        ...state.players[0],
        pos: { x: 380, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-roll",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);

      // 4. Roll avocado-maki
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect(state.rollStation.state).toBe("rolling");
      expect(state.rollStation.rollingRecipeId).toBe("avocado-maki");

      for (let i = 0; i < 130; i++) {
        state = updateWorldState(state, 1 / 60);
      }
      expect(
        (state.rollStation.items[0] as { recipeId: string }).recipeId,
      ).toBe("avocado-maki");

      // 5. Deliver
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      state.players[0] = {
        ...state.players[0],
        pos: { x: 760, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-delivery",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);

      expect(state.activeOrders).toHaveLength(0);
      expect(state.scoreState.totalScore).toBe(110);
    });

    it("manages multiple parallel orders and accepts up to 3 orders at counter", () => {
      let state: WorldState = {
        ...createInitialWorldState(),
        phase: "running",
        orderStation: {
          pendingOrder: createPendingOrder("ord-1", "cucumber-maki", 45),
          nextSpawnTimer: 0,
          totalOrdersSpawned: 1,
        },
        activeOrders: [],
      };

      // Player 0 at order station accepts ord-1
      state.players[0] = {
        ...state.players[0],
        pos: { x: 160, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-order",
      };

      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);

      expect(state.activeOrders).toHaveLength(1);
      expect(state.activeOrders[0].id).toBe("ord-1");
      expect(state.orderStation.pendingOrder).toBeNull();

      // Fast forward spawn delay (4 seconds) with neutral inputs (button released)
      const neutralInputs = [
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ] as const;

      for (let i = 0; i < 250; i++) {
        state = updateWorldState(state, 1 / 60, neutralInputs);
      }
      expect(state.orderStation.pendingOrder).not.toBeNull();

      // Accept second order
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect(state.activeOrders).toHaveLength(2);

      // Fast forward spawn delay again with neutral inputs
      for (let i = 0; i < 250; i++) {
        state = updateWorldState(state, 1 / 60, neutralInputs);
      }
      expect(state.orderStation.pendingOrder).not.toBeNull();

      // Accept third order
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);
      expect(state.activeOrders).toHaveLength(3);

      // Verify that when delivering one order, only that order is completed
      const plate = createPlateItem(state.activeOrders[0].recipeId);
      state.players[0] = {
        ...state.players[0],
        carriedItem: plate,
        pos: { x: 760, y: 390 },
        facing: { x: 0, y: 1 },
        targetStationId: "station-delivery",
      };
      state = updateWorldState(state, 1 / 60, [
        { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
        createNeutralPlayerInput(),
      ]);

      expect(state.activeOrders).toHaveLength(2);
      expect(state.scoreState.completedOrders).toBe(1);
    });
  });
});
