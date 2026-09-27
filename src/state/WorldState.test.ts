import { describe, expect, it } from "vitest";
import {
  createInitialWorldState,
  setPlayerJoined,
  updateWorldState,
  type WorldState,
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

  it("updates interaction targets and respects obstacles during world update", () => {
    const state = {
      ...createInitialWorldState(),
      phase: "running" as const,
    };

    // Position P1 just above station-order (160, 440)
    state.players[0] = {
      ...state.players[0],
      pos: { x: 160, y: 390 },
      facing: { x: 0, y: 1 },
    };

    const updated = updateWorldState(state, 0.016);
    expect(updated.players[0].targetStationId).toBe("station-order");

    // Attempt to run straight down into the station obstacle
    const moveDown = [
      { ...createNeutralPlayerInput(), move: { x: 0, y: 1 } },
      createNeutralPlayerInput(),
      createNeutralPlayerInput(),
      createNeutralPlayerInput(),
    ] as const;

    const blocked = updateWorldState(updated, 1.0, moveDown);
    // station-order collider minY is 400. Player with radius 16 should be blocked at 400 - 16 = 384
    expect(blocked.players[0].pos.y).toBeLessThanOrEqual(384);
  });

  it("processes multiple player updates in deterministic slot order", () => {
    const state = {
      ...createInitialWorldState(),
      phase: "running" as const,
    };

    // P1 at order (160, 440), P2 at rice (380, 110)
    state.players[0] = {
      ...state.players[0],
      pos: { x: 160, y: 390 },
      facing: { x: 0, y: 1 },
    };
    state.players[1] = {
      ...state.players[1],
      pos: { x: 380, y: 160 },
      facing: { x: 0, y: -1 },
    };

    const updated = updateWorldState(state, 0.016);
    expect(updated.players[0].targetStationId).toBe("station-order");
    expect(updated.players[1].targetStationId).toBe("station-rice");
  });

  it("advances shift timer when running and transitions to completed phase when time expires", () => {
    let state: WorldState = {
      ...createInitialWorldState(10), // 10s shift
      phase: "running",
    };

    expect(state.shift.timeRemaining).toBe(10);
    expect(state.shift.isFinished).toBe(false);

    // Advance 4s
    state = updateWorldState(state, 4.0);
    expect(state.phase).toBe("running");
    expect(state.shift.timeRemaining).toBeCloseTo(6.0);
    expect(state.shift.progress).toBeCloseTo(0.4);
    expect(state.shift.isFinished).toBe(false);

    // Advance 7s (exceeding remaining 6s)
    state = updateWorldState(state, 7.0);
    expect(state.phase).toBe("completed");
    expect(state.shift.timeRemaining).toBe(0);
    expect(state.shift.progress).toBe(1.0);
    expect(state.shift.isFinished).toBe(true);

    // Subsequent updates in completed phase do nothing
    const frozen = updateWorldState(state, 1.0);
    expect(frozen.phase).toBe("completed");
    expect(frozen.simulationTime).toBe(state.simulationTime);
  });

  it("freezes shift and station timers completely when in paused phase", () => {
    const state: WorldState = {
      ...createInitialWorldState(100),
      phase: "paused",
      simulationTime: 42,
      tickCount: 1000,
    };

    const pausedUpdate = updateWorldState(state, 5.0);
    expect(pausedUpdate.phase).toBe("paused");
    expect(pausedUpdate.simulationTime).toBe(42);
    expect(pausedUpdate.tickCount).toBe(1000);
    expect(pausedUpdate.shift.timeRemaining).toBe(100);
  });
});
