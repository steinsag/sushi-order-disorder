import { describe, expect, it } from "vitest";
import {
  checkCircleAABBOverlap,
  DEFAULT_PLAYER_RADIUS,
  moveAndSlide,
  resolveCircleAABB,
} from "./Collision";
import type { ColliderAABB } from "../rules/StationConfig";
import type { KitchenBounds } from "../state/PlayerState";

describe("Collision System", () => {
  const testBox: ColliderAABB = {
    minX: 100,
    maxX: 200,
    minY: 100,
    maxY: 200,
  };

  const testBounds: KitchenBounds = {
    minX: 0,
    maxX: 500,
    minY: 0,
    maxY: 500,
  };

  it("detects circle and AABB overlap correctly", () => {
    // Overlapping left side
    expect(
      checkCircleAABBOverlap({ x: 90, y: 150 }, DEFAULT_PLAYER_RADIUS, testBox),
    ).toBe(true);

    // Completely outside
    expect(
      checkCircleAABBOverlap({ x: 50, y: 150 }, DEFAULT_PLAYER_RADIUS, testBox),
    ).toBe(false);

    // Overlapping corner
    expect(
      checkCircleAABBOverlap({ x: 90, y: 90 }, DEFAULT_PLAYER_RADIUS, testBox),
    ).toBe(true);
  });

  it("resolves circle penetration out of AABB cleanly", () => {
    // Circle penetrating left side at x: 95 (box.minX = 100, r = 16 => expected x: 84)
    const resolved = resolveCircleAABB(
      { x: 95, y: 150 },
      DEFAULT_PLAYER_RADIUS,
      testBox,
    );
    expect(resolved.x).toBeCloseTo(84, 1);
    expect(resolved.y).toBe(150);
  });

  it("pushes circle out to nearest edge when circle center is inside box", () => {
    // Circle center at (110, 150) -> closest edge is minX = 100
    const resolved = resolveCircleAABB(
      { x: 110, y: 150 },
      DEFAULT_PLAYER_RADIUS,
      testBox,
    );
    expect(resolved.x).toBe(100 - DEFAULT_PLAYER_RADIUS);
    expect(resolved.y).toBe(150);
  });

  it("slides along obstacle when moving diagonally into a solid counter", () => {
    const startPos = { x: 80, y: 150 };
    // Try to move diagonal right-down (dx: 30, dy: 30) -> penetrates testBox on X, but Y is unobstructed
    const { pos, vel } = moveAndSlide(
      startPos,
      { x: 30, y: 30 },
      DEFAULT_PLAYER_RADIUS,
      [testBox],
      testBounds,
    );

    // X should be stopped at 100 - 16 = 84
    expect(pos.x).toBe(84);
    // Y should slide freely downwards to 150 + 30 = 180
    expect(pos.y).toBe(180);
    expect(vel.x).toBe(4); // 84 - 80
    expect(vel.y).toBe(30);
  });

  it("clamps movement strictly within kitchen bounds", () => {
    const startPos = { x: 10, y: 10 };
    const { pos } = moveAndSlide(
      startPos,
      { x: -50, y: -50 },
      DEFAULT_PLAYER_RADIUS,
      [],
      testBounds,
    );

    expect(pos.x).toBe(testBounds.minX);
    expect(pos.y).toBe(testBounds.minY);
  });
});
