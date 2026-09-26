import { describe, expect, it, vi } from "vitest";
import { GameLoop, type VisibilityTarget } from "./GameLoop";
import {
  createInitialWorldState,
  updateWorldState,
  type WorldState,
} from "../state/WorldState";

describe("GameLoop", () => {
  it("executes fixed update steps and passes dt to update callback", () => {
    const updates: number[] = [];
    const renders: number[] = [];

    const loop = new GameLoop(
      (dt) => updates.push(dt),
      (alpha) => renders.push(alpha),
      { fixedStep: 1 / 60 },
    );

    loop.start();

    // First frame initializes the baseline time and renders initial state at alpha 0
    loop.tick(1000);
    expect(updates.length).toBe(0);
    expect(renders.length).toBe(1);
    expect(renders[0]).toBe(0);

    // Advance by exactly 1/60s (approx 16.6667ms)
    loop.tick(1000 + 1000 / 60);
    expect(updates.length).toBe(1);
    expect(updates[0]).toBeCloseTo(1 / 60, 5);
    expect(renders.length).toBe(2);
  });

  it("accumulates delta time across multiple ticks and performs sub-steps", () => {
    const updates: number[] = [];
    const renders: number[] = [];

    const fixedStep = 0.02; // 50Hz (20ms)
    const loop = new GameLoop(
      (dt) => updates.push(dt),
      (alpha) => renders.push(alpha),
      { fixedStep },
    );

    loop.start();
    loop.tick(0);

    // Advance 50ms: should result in 2 steps of 20ms (40ms total) with 10ms leftover -> alpha = 10 / 20 = 0.5
    loop.tick(50);
    expect(updates.length).toBe(2);
    expect(updates[0]).toBe(fixedStep);
    expect(updates[1]).toBe(fixedStep);
    expect(renders.at(-1)).toBeCloseTo(0.5, 3);
  });

  it("clamps large delta time jumps to maxFrameTime and limits sub-steps", () => {
    const updates: number[] = [];
    const renders: number[] = [];

    const fixedStep = 1 / 60; // ~0.01667s
    const loop = new GameLoop(
      (dt) => updates.push(dt),
      (alpha) => renders.push(alpha),
      {
        fixedStep,
        maxFrameTime: 0.1, // clamp delta to 100ms
        maxSubSteps: 5,
      },
    );

    loop.start();
    loop.tick(1000);

    // Simulate 5-second jump (e.g. background tab or long block)
    loop.tick(6000);

    // Delta clamped to 100ms: maxSubSteps is 5, so 5 steps of 1/60s = 83.33ms consumed
    expect(updates.length).toBe(5);
    for (const dt of updates) {
      expect(dt).toBeCloseTo(1 / 60, 5);
    }
  });

  it("guarantees update-then-render call sequence during each frame", () => {
    const sequence: string[] = [];

    const loop = new GameLoop(
      () => sequence.push("update"),
      () => sequence.push("render"),
      { fixedStep: 0.01 },
    );

    loop.start();
    loop.tick(1000);
    expect(sequence).toEqual(["render"]);

    sequence.length = 0;
    loop.tick(1025); // 25ms: 2 updates of 10ms followed by 1 render
    expect(sequence).toEqual(["update", "update", "render"]);
  });

  it("drives WorldState simulation deterministically over variable tick lengths", () => {
    let state: WorldState = {
      ...createInitialWorldState(),
      phase: "running",
    };

    const loop = new GameLoop(
      (dt) => {
        state = updateWorldState(state, dt);
      },
      () => {},
      { fixedStep: 1 / 60 },
    );

    loop.start();
    loop.tick(0);

    // Feed variable realistic frame deltas (10ms to 33ms, representing 30-100 fps) totaling ~1000ms
    const frameDeltas = [
      16, 17, 16, 33, 16, 17, 8, 25, 16, 17, 33, 16, 17, 16, 16, 33, 16, 17, 16,
      17, 33, 16, 17, 16, 16, 33, 16, 17, 16, 17, 33, 16, 17, 16, 16, 33, 16,
      17, 16, 17, 33, 16, 17, 16, 16, 33, 16, 17, 16, 17,
    ];

    let totalElapsed = 0;
    for (const delta of frameDeltas) {
      totalElapsed += delta;
      loop.tick(totalElapsed);
    }

    // At 60Hz, accumulated time should execute the expected fixed updates
    expect(state.tickCount).toBeGreaterThanOrEqual(50);
    expect(state.simulationTime).toBeCloseTo(state.tickCount * (1 / 60), 4);
  });

  it("handles negative, zero, or NaN timestamps gracefully without errors", () => {
    const updates: number[] = [];

    const loop = new GameLoop(
      (dt) => updates.push(dt),
      () => {},
    );

    loop.start();
    loop.tick(1000);

    // Negative progression (clock reset/backward)
    loop.tick(500);
    expect(updates.length).toBe(0);

    // NaN timestamp
    loop.tick(Number.NaN);
    expect(updates.length).toBe(0);
  });

  it("does not allow duplicate loops when start is called multiple times", () => {
    let rafCallCount = 0;
    const fakeRaf = vi.fn(() => {
      rafCallCount++;
      return rafCallCount;
    });

    const loop = new GameLoop(
      () => {},
      () => {},
      { raf: fakeRaf },
    );

    loop.start();
    loop.start();
    loop.start();

    expect(rafCallCount).toBe(1);
    expect(loop.running).toBe(true);
  });

  it("stops cleanly and cancels scheduled frame", () => {
    const fakeCaf = vi.fn();
    const fakeRaf = vi.fn(() => 42);

    const loop = new GameLoop(
      () => {},
      () => {},
      { raf: fakeRaf, caf: fakeCaf },
    );

    loop.start();
    expect(loop.running).toBe(true);

    loop.stop();
    expect(loop.running).toBe(false);
    expect(fakeCaf).toHaveBeenCalledWith(42);

    // Calling tick while stopped should do nothing
    const updates: number[] = [];
    const loop2 = new GameLoop(
      (dt) => updates.push(dt),
      () => {},
    );
    loop2.tick(100);
    expect(updates.length).toBe(0);
  });

  it("handles visibility changes without time leaps or duplicate loops", () => {
    const updates: number[] = [];
    const listeners = new Map<string, () => void>();

    const fakeDoc: VisibilityTarget = {
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
      removeEventListener(type) {
        listeners.delete(type);
      },
      hidden: false,
    };

    const loop = new GameLoop(
      (dt) => updates.push(dt),
      () => {},
      { visibilityTarget: fakeDoc, fixedStep: 1 / 60 },
    );

    loop.start();
    loop.tick(1000);

    // Tab gets hidden
    fakeDoc.hidden = true;
    listeners.get("visibilitychange")?.();

    // Tab becomes visible 10 seconds later
    fakeDoc.hidden = false;
    listeners.get("visibilitychange")?.();

    // First tick after returning resets lastTime baseline
    loop.tick(11000);
    expect(updates.length).toBe(0);

    // Next tick works normally from the new baseline
    loop.tick(11000 + 1000 / 60);
    expect(updates.length).toBe(1);

    loop.stop();
    expect(listeners.size).toBe(0);
  });
});
