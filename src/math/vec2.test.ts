import { describe, expect, it } from "vitest";
import { normalizeMove } from "./vec2.ts";

describe("normalizeMove", () => {
  it("returns {x: 0, y: 0} for zero input", () => {
    expect(normalizeMove(0, 0)).toEqual({ x: 0, y: 0 });
  });

  it("leaves vectors with length <= 1 unchanged", () => {
    expect(normalizeMove(0.5, 0)).toEqual({ x: 0.5, y: 0 });
    expect(normalizeMove(0, -0.8)).toEqual({ x: 0, y: -0.8 });
  });

  it("normalizes diagonal input with length > 1 to length 1", () => {
    const res = normalizeMove(1, 1);
    expect(res.x).toBeCloseTo(Math.SQRT1_2);
    expect(res.y).toBeCloseTo(Math.SQRT1_2);
    expect(Math.hypot(res.x, res.y)).toBeCloseTo(1);
  });
});
