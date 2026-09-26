import { describe, expect, it } from "vitest";
import {
  applyDeadzone,
  applyRadialDeadzone,
  clamp,
  normalizeMove,
} from "./vec2";

describe("vec2 and math helpers", () => {
  describe("clamp", () => {
    it("clamps values within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

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

    it("normalizes negative diagonals to length 1", () => {
      const res = normalizeMove(-1, -1);
      expect(res.x).toBeCloseTo(-Math.SQRT1_2);
      expect(res.y).toBeCloseTo(-Math.SQRT1_2);
      expect(Math.hypot(res.x, res.y)).toBeCloseTo(1);
    });
  });

  describe("applyDeadzone", () => {
    it("filters small values below deadzone to 0", () => {
      expect(applyDeadzone(0.1, 0.2)).toBe(0);
      expect(applyDeadzone(-0.15, 0.2)).toBe(0);
      expect(applyDeadzone(0, 0.2)).toBe(0);
    });

    it("rescales values above deadzone smoothly between 0 and 1", () => {
      expect(applyDeadzone(0.2, 0.2)).toBe(0);
      expect(applyDeadzone(0.6, 0.2)).toBeCloseTo(0.5); // (0.6 - 0.2) / 0.8 = 0.5
      expect(applyDeadzone(1.0, 0.2)).toBe(1.0);
      expect(applyDeadzone(-1.0, 0.2)).toBe(-1.0);
      expect(applyDeadzone(-0.6, 0.2)).toBeCloseTo(-0.5);
    });
  });

  describe("applyRadialDeadzone", () => {
    it("returns zero vector if stick magnitude is within deadzone", () => {
      const res = applyRadialDeadzone(0.1, 0.1, 0.2); // hypot is ~0.1414 < 0.2
      expect(res).toEqual({ x: 0, y: 0 });
    });

    it("rescales 2D stick vector when magnitude exceeds deadzone", () => {
      const res = applyRadialDeadzone(0.6, 0.8, 0.2); // magnitude = 1.0
      expect(Math.hypot(res.x, res.y)).toBeCloseTo(1.0);
      expect(res.x).toBeCloseTo(0.6);
      expect(res.y).toBeCloseTo(0.8);
    });

    it("preserves angle on diagonal stick inputs", () => {
      const res = applyRadialDeadzone(0.5, 0.5, 0.2);
      expect(res.x).toBeGreaterThan(0);
      expect(res.y).toBeGreaterThan(0);
      expect(res.x).toBeCloseTo(res.y);
      expect(Math.hypot(res.x, res.y)).toBeLessThan(1);
    });
  });
});
