import { describe, expect, it } from "vitest";
import { advanceShiftState, createInitialShiftState } from "./ShiftState";

describe("ShiftState", () => {
  it("initializes with default duration and progress 0", () => {
    const shift = createInitialShiftState(120);
    expect(shift.totalDuration).toBe(120);
    expect(shift.timeRemaining).toBe(120);
    expect(shift.progress).toBe(0);
    expect(shift.isFinished).toBe(false);
  });

  it("advances time remaining and updates progress proportionally", () => {
    const shift = createInitialShiftState(100);
    const step1 = advanceShiftState(shift, 25);

    expect(step1.timeRemaining).toBe(75);
    expect(step1.progress).toBeCloseTo(0.25);
    expect(step1.isFinished).toBe(false);

    const step2 = advanceShiftState(step1, 50);
    expect(step2.timeRemaining).toBe(25);
    expect(step2.progress).toBeCloseTo(0.75);
    expect(step2.isFinished).toBe(false);
  });

  it("marks shift as finished and clamps time remaining at 0", () => {
    const shift = createInitialShiftState(60);
    const finished = advanceShiftState(shift, 65);

    expect(finished.timeRemaining).toBe(0);
    expect(finished.progress).toBe(1);
    expect(finished.isFinished).toBe(true);

    // Subsequent advance does not alter finished state
    const after = advanceShiftState(finished, 10);
    expect(after.timeRemaining).toBe(0);
    expect(after.isFinished).toBe(true);
  });
});
