import { describe, expect, it } from "vitest";
import {
  createInitialWorldState,
  setPlayerJoined,
  updateWorldState,
} from "./WorldState";
import { createNeutralPlayerInput } from "../input/PlayerInput";

describe("WorldState", () => {
  it("initializes in title phase with 0 simulation time and 4 slots", () => {
    const state = createInitialWorldState();
    expect(state.phase).toBe("title");
    expect(state.simulationTime).toBe(0);
    expect(state.tickCount).toBe(0);
    expect(state.players).toHaveLength(4);
    expect(state.players[0].joined).toBe(true);
    expect(state.players[1].joined).toBe(true);
    expect(state.players[2].joined).toBe(false);
    expect(state.players[3].joined).toBe(false);
  });

  it("does not increment simulation time when not running", () => {
    const state = createInitialWorldState();
    const updated = updateWorldState(state, 1 / 60);
    expect(updated.simulationTime).toBe(0);
    expect(updated.tickCount).toBe(0);
  });

  it("increments simulation time and updates players when running", () => {
    const state = { ...createInitialWorldState(), phase: "running" as const };
    const p1Start = state.players[0].pos.x;
    const inputs = [
      { ...createNeutralPlayerInput(), move: { x: 1, y: 0 } },
      createNeutralPlayerInput(),
      createNeutralPlayerInput(),
      createNeutralPlayerInput(),
    ] as const;

    const step1 = updateWorldState(state, 0.5, inputs);
    expect(step1.simulationTime).toBeCloseTo(0.5, 5);
    expect(step1.tickCount).toBe(1);
    expect(step1.players[0].pos.x).toBe(p1Start + 240 * 0.5);
    expect(step1.players[1].pos.x).toBe(state.players[1].pos.x);
  });

  it("handles setPlayerJoined toggle", () => {
    let state = createInitialWorldState();
    expect(state.players[2].joined).toBe(false);

    state = setPlayerJoined(state, 2, true);
    expect(state.players[2].joined).toBe(true);

    state = setPlayerJoined(state, 2, false);
    expect(state.players[2].joined).toBe(false);
  });
});
