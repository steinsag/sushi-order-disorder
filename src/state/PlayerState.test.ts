import { describe, expect, it } from "vitest";
import {
  createPlayerState,
  DEFAULT_KITCHEN_BOUNDS,
  updatePlayer,
} from "./PlayerState";
import { normalizeMove } from "../math/vec2";
import { createNeutralPlayerInput } from "../input/PlayerInput";

describe("PlayerState and Movement", () => {
  it("moves horizontally and vertically based on speed and dt", () => {
    let player = createPlayerState(0, true, { x: 200, y: 200 });
    const inputRight = {
      ...createNeutralPlayerInput(),
      move: { x: 1, y: 0 },
    };

    // dt = 0.5s at 240px/s => +120px
    player = updatePlayer(player, inputRight, 0.5);
    expect(player.pos.x).toBe(320);
    expect(player.pos.y).toBe(200);
    expect(player.facing).toEqual({ x: 1, y: 0 });
    expect(player.vel).toEqual({ x: 240, y: 0 });
  });

  it("moves at the exact same total speed on diagonal movement", () => {
    const startPos = { x: 300, y: 300 };
    let playerStraight = createPlayerState(0, true, startPos);
    let playerDiagonal = createPlayerState(1, true, startPos);

    const inputStraight = {
      ...createNeutralPlayerInput(),
      move: { x: 1, y: 0 },
    };
    const inputDiagonal = {
      ...createNeutralPlayerInput(),
      move: normalizeMove(1, 1),
    };

    playerStraight = updatePlayer(playerStraight, inputStraight, 1.0);
    playerDiagonal = updatePlayer(playerDiagonal, inputDiagonal, 1.0);

    const distStraight = Math.hypot(
      playerStraight.pos.x - startPos.x,
      playerStraight.pos.y - startPos.y,
    );
    const distDiagonal = Math.hypot(
      playerDiagonal.pos.x - startPos.x,
      playerDiagonal.pos.y - startPos.y,
    );

    expect(distStraight).toBeCloseTo(playerStraight.speed);
    expect(distDiagonal).toBeCloseTo(playerDiagonal.speed);
    expect(distDiagonal).toBeCloseTo(distStraight);
  });

  it("maintains consistent distance over time across different framerates (60Hz vs 30Hz vs 120Hz)", () => {
    const totalDuration = 1.0; // 1 second total
    const start = { x: 200, y: 200 };
    const move = normalizeMove(1, 1);
    const input = { ...createNeutralPlayerInput(), move };

    // 60 Hz simulation (60 steps of 1/60s)
    let p60 = createPlayerState(0, true, start);
    const dt60 = 1 / 60;
    for (let i = 0; i < 60; i++) {
      p60 = updatePlayer(p60, input, dt60);
    }

    // 30 Hz simulation (30 steps of 1/30s)
    let p30 = createPlayerState(1, true, start);
    const dt30 = 1 / 30;
    for (let i = 0; i < 30; i++) {
      p30 = updatePlayer(p30, input, dt30);
    }

    // 120 Hz simulation (120 steps of 1/120s)
    let p120 = createPlayerState(2, true, start);
    const dt120 = 1 / 120;
    for (let i = 0; i < 120; i++) {
      p120 = updatePlayer(p120, input, dt120);
    }

    // Single 1.0s step
    let p1 = createPlayerState(3, true, start);
    p1 = updatePlayer(p1, input, totalDuration);

    expect(p60.pos.x).toBeCloseTo(p1.pos.x, 2);
    expect(p60.pos.y).toBeCloseTo(p1.pos.y, 2);
    expect(p30.pos.x).toBeCloseTo(p60.pos.x, 2);
    expect(p30.pos.y).toBeCloseTo(p60.pos.y, 2);
    expect(p120.pos.x).toBeCloseTo(p60.pos.x, 2);
    expect(p120.pos.y).toBeCloseTo(p60.pos.y, 2);
  });

  it("clamps player positions inside kitchen bounds", () => {
    let player = createPlayerState(0, true, {
      x: DEFAULT_KITCHEN_BOUNDS.maxX - 10,
      y: DEFAULT_KITCHEN_BOUNDS.maxY - 10,
    });
    const moveOut = { ...createNeutralPlayerInput(), move: { x: 1, y: 1 } };

    // Update with large dt to exceed boundaries
    player = updatePlayer(player, moveOut, 2.0);

    expect(player.pos.x).toBe(DEFAULT_KITCHEN_BOUNDS.maxX);
    expect(player.pos.y).toBe(DEFAULT_KITCHEN_BOUNDS.maxY);
  });

  it("does not move when not joined", () => {
    let player = createPlayerState(0, false, { x: 200, y: 200 });
    const move = { ...createNeutralPlayerInput(), move: { x: 1, y: 0 } };

    player = updatePlayer(player, move, 1.0);
    expect(player.pos.x).toBe(200);
    expect(player.pos.y).toBe(200);
    expect(player.vel).toEqual({ x: 0, y: 0 });
  });

  it("slides along obstacle colliders during player update", () => {
    const obstacle = { minX: 300, maxX: 400, minY: 200, maxY: 300 };
    let player = createPlayerState(0, true, { x: 280, y: 250 });
    const moveDiagonal = {
      ...createNeutralPlayerInput(),
      move: { x: 1, y: 1 },
    };

    // Moving right-down at 240px/s for 0.1s => dx = 24, dy = 24
    // X will be stopped by obstacle (300 - 16 = 284), Y slides down (250 + 24 = 274)
    player = updatePlayer(player, moveDiagonal, 0.1, DEFAULT_KITCHEN_BOUNDS, [
      obstacle,
    ]);

    expect(player.pos.x).toBe(284);
    expect(player.pos.y).toBeCloseTo(274, 1);
  });
});
