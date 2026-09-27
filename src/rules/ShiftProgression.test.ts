import { describe, expect, it } from "vitest";
import {
  createInitialWorldState,
  updateWorldState,
  type WorldState,
} from "../state/WorldState";
import { createNeutralPlayerInput } from "../input/PlayerInput";
import { getShiftProgression, SHIFT_PROGRESSION_TIERS } from "./ShiftConfig";
import { createPlateItem } from "../state/ItemState";

describe("ShiftProgression and Lifecycle", () => {
  it("progresses through Warmup, Rush and Peak tiers based on remaining time", () => {
    let state: WorldState = {
      ...createInitialWorldState(100), // 100s shift
      phase: "running",
    };

    // 0s elapsed: Warmup tier
    expect(getShiftProgression(state.shift.progress)).toEqual(
      SHIFT_PROGRESSION_TIERS.warmup,
    );

    // Advance 30s (progress 0.3): Rush tier
    state = updateWorldState(state, 30);
    expect(state.shift.progress).toBeCloseTo(0.3);
    expect(getShiftProgression(state.shift.progress)).toEqual(
      SHIFT_PROGRESSION_TIERS.rush,
    );

    // Advance 40s (total 70s, progress 0.7): Peak tier
    state = updateWorldState(state, 40);
    expect(state.shift.progress).toBeCloseTo(0.7);
    expect(getShiftProgression(state.shift.progress)).toEqual(
      SHIFT_PROGRESSION_TIERS.peak,
    );

    // Advance 35s (total 105s): completed phase
    state = updateWorldState(state, 35);
    expect(state.phase).toBe("completed");
    expect(state.shift.isFinished).toBe(true);
  });

  it("spawns orders according to warmup, rush and peak tier configuration", () => {
    // 1. Warmup state (progress 0): maxActiveOrders is 2, expressChance 0, 2 available recipes
    let warmupState: WorldState = {
      ...createInitialWorldState(100),
      phase: "running",
      orderStation: {
        pendingOrder: null,
        nextSpawnTimer: 0,
        totalOrdersSpawned: 0,
      },
    };

    warmupState = updateWorldState(warmupState, 0.016);
    expect(warmupState.orderStation.pendingOrder).not.toBeNull();
    const warmupOrder = warmupState.orderStation.pendingOrder!;
    expect(SHIFT_PROGRESSION_TIERS.warmup.availableRecipes).toContain(
      warmupOrder.recipeId,
    );
    expect(warmupOrder.isExpress).toBe(false);

    // 2. Peak state (progress 0.8): recipes include all 4, higher express chance, shorter patience
    let peakState: WorldState = {
      ...createInitialWorldState(100),
      phase: "running",
      shift: {
        totalDuration: 100,
        timeRemaining: 20,
        progress: 0.8,
        isFinished: false,
      },
      orderStation: {
        pendingOrder: null,
        nextSpawnTimer: 0,
        totalOrdersSpawned: 0,
      },
    };

    peakState = updateWorldState(peakState, 0.016);
    expect(peakState.orderStation.pendingOrder).not.toBeNull();
    const peakOrder = peakState.orderStation.pendingOrder!;
    expect(SHIFT_PROGRESSION_TIERS.peak.availableRecipes).toContain(
      peakOrder.recipeId,
    );
  });

  it("plays through a complete match with score accumulation and final evaluation", () => {
    let state: WorldState = {
      ...createInitialWorldState(60), // 1 minute shift
      phase: "running",
    };

    // Simulate accepting and delivering an order
    state.players[0] = {
      ...state.players[0],
      pos: { x: 160, y: 390 },
      facing: { x: 0, y: 1 },
      targetStationId: "station-order",
    };

    // Accept order-1 (cucumber-maki)
    state = updateWorldState(state, 1 / 60, [
      { ...createNeutralPlayerInput(), action1: true, action1Pressed: true },
      createNeutralPlayerInput(),
      createNeutralPlayerInput(),
      createNeutralPlayerInput(),
    ]);

    expect(state.activeOrders).toHaveLength(1);

    // Deliver order at station-delivery
    const plate = createPlateItem("cucumber-maki");
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

    expect(state.scoreState.completedOrders).toBe(1);
    expect(state.scoreState.onTimeOrders).toBe(1);
    expect(state.scoreState.totalScore).toBe(100);

    // Fast-forward shift time to completion
    state = updateWorldState(state, 65);
    expect(state.phase).toBe("completed");
    expect(state.scoreState.totalScore).toBe(100);
  });
});
