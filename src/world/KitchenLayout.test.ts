import { describe, expect, it } from "vitest";
import { DEFAULT_STATIONS, getStationColliders } from "./KitchenLayout";
import {
  DEFAULT_KITCHEN_BOUNDS,
  DEFAULT_SPAWN_POSITIONS,
} from "../state/PlayerState";
import {
  checkCircleAABBOverlap,
  DEFAULT_PLAYER_RADIUS,
  moveAndSlide,
} from "./Collision";
import { findInteractionTarget } from "./Interaction";
import type { Vec2 } from "../math/vec2";

describe("Kitchen Layout & Reachability", () => {
  it("contains all five stations required by README.md", () => {
    const stationTypes = DEFAULT_STATIONS.map((s) => s.type);
    expect(stationTypes).toContain("order"); // Bestellannahme
    expect(stationTypes).toContain("rice"); // Reiskocher
    expect(stationTypes).toContain("fridge"); // Kühlschrank
    expect(stationTypes).toContain("roll"); // Rollstation
    expect(stationTypes).toContain("delivery"); // Ausgabe
  });

  it("verifies spawn points are free of obstacle collisions", () => {
    const colliders = getStationColliders(DEFAULT_STATIONS);

    for (const spawn of DEFAULT_SPAWN_POSITIONS) {
      for (const box of colliders) {
        const collides = checkCircleAABBOverlap(
          spawn,
          DEFAULT_PLAYER_RADIUS,
          box,
        );
        expect(collides).toBe(false);
      }
    }
  });

  it("ensures all five stations are reachable from player spawn positions", () => {
    const colliders = getStationColliders(DEFAULT_STATIONS);
    const bounds = DEFAULT_KITCHEN_BOUNDS;

    // Helper step simulation from start to target waypoint
    const walkTo = (start: Vec2, target: Vec2, stepSize = 10): Vec2 => {
      let current = { ...start };
      const maxSteps = 200;
      for (let s = 0; s < maxSteps; s++) {
        const dx = target.x - current.x;
        const dy = target.y - current.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= stepSize) {
          const { pos } = moveAndSlide(
            current,
            { x: dx, y: dy },
            DEFAULT_PLAYER_RADIUS,
            colliders,
            bounds,
          );
          current = pos;
          break;
        }
        const delta = {
          x: (dx / dist) * stepSize,
          y: (dy / dist) * stepSize,
        };
        const { pos } = moveAndSlide(
          current,
          delta,
          DEFAULT_PLAYER_RADIUS,
          colliders,
          bounds,
        );
        current = pos;
      }
      return current;
    };

    // Approach points for each station that are within reach
    const approachPoints: Record<string, { approach: Vec2; facing: Vec2 }> = {
      "station-order": {
        approach: { x: 160, y: 390 },
        facing: { x: 0, y: 1 },
      },
      "station-rice": {
        approach: { x: 380, y: 160 },
        facing: { x: 0, y: -1 },
      },
      "station-fridge": {
        approach: { x: 600, y: 160 },
        facing: { x: 0, y: -1 },
      },
      "station-roll": {
        approach: { x: 380, y: 390 },
        facing: { x: 0, y: 1 },
      },
      "station-delivery": {
        approach: { x: 760, y: 390 },
        facing: { x: 0, y: 1 },
      },
    };

    const spawnP1 = DEFAULT_SPAWN_POSITIONS[0]; // (280, 260)

    for (const [stationId, { approach, facing }] of Object.entries(
      approachPoints,
    )) {
      const reachedPos = walkTo(spawnP1, approach);
      const target = findInteractionTarget(
        { pos: reachedPos, facing, joined: true },
        DEFAULT_STATIONS,
      );

      expect(target).not.toBeNull();
      expect(target?.id).toBe(stationId);
    }
  });

  it("verifies spatial separation between roll station and delivery counter", () => {
    const roll = DEFAULT_STATIONS.find((s) => s.type === "roll");
    const delivery = DEFAULT_STATIONS.find((s) => s.type === "delivery");

    expect(roll).toBeDefined();
    expect(delivery).toBeDefined();

    if (roll && delivery) {
      const distance = Math.hypot(
        roll.pos.x - delivery.pos.x,
        roll.pos.y - delivery.pos.y,
      );
      // Delivery counter must be separated from roll station to require players to move across the kitchen
      expect(distance).toBeGreaterThanOrEqual(300);
    }
  });
});
