import { describe, expect, it } from "vitest";
import { createInitialWorldState, updateWorldState } from "./WorldState";

describe("WorldState", () => {
  it("initializes in title phase with 0 simulation time", () => {
    const state = createInitialWorldState();
    expect(state.phase).toBe("title");
    expect(state.simulationTime).toBe(0);
    expect(state.tickCount).toBe(0);
  });

  it("does not increment simulation time when not running", () => {
    const state = createInitialWorldState();
    const updated = updateWorldState(state, 1 / 60);
    expect(updated.simulationTime).toBe(0);
    expect(updated.tickCount).toBe(0);
  });

  it("increments simulation time and tickCount deterministically when running", () => {
    const state = { ...createInitialWorldState(), phase: "running" as const };
    const step1 = updateWorldState(state, 0.05);
    expect(step1.simulationTime).toBeCloseTo(0.05, 5);
    expect(step1.tickCount).toBe(1);

    const step2 = updateWorldState(step1, 0.05);
    expect(step2.simulationTime).toBeCloseTo(0.1, 5);
    expect(step2.tickCount).toBe(2);
  });
});
