import { describe, expect, it } from "vitest";
import { findInteractionTarget } from "./Interaction";
import { DEFAULT_STATIONS } from "./KitchenLayout";
import type { StationDefinition } from "../rules/StationConfig";

describe("Interaction Target Selection", () => {
  it("selects nearest station when within reach", () => {
    // station-order is at pos (160, 440), interactionPoint (160, 430)
    const target = findInteractionTarget(
      {
        pos: { x: 160, y: 390 },
        facing: { x: 0, y: 1 }, // facing down towards order counter
        joined: true,
      },
      DEFAULT_STATIONS,
    );

    expect(target).not.toBeNull();
    expect(target?.id).toBe("station-order");
    expect(target?.type).toBe("order");
  });

  it("returns null when player is too far away from all stations", () => {
    // Center of open floor: (480, 180) - well outside 72px reach of all stations
    const target = findInteractionTarget(
      {
        pos: { x: 300, y: 280 },
        facing: { x: 0, y: 1 },
        joined: true,
      },
      DEFAULT_STATIONS,
    );

    expect(target).toBeNull();
  });

  it("disambiguates between adjacent stations based on player facing direction", () => {
    // station-rice is at (380, 110) interactionPoint (380, 120)
    // station-fridge is at (600, 110) interactionPoint (600, 120)
    // Place player at midpoint (490, 130), equal distance (~110px) but let's test within shared reach or test two close stations:
    const stationA: StationDefinition = {
      id: "station-a",
      type: "rice",
      label: "Station A",
      spriteId: "station_rice",
      pos: { x: 400, y: 200 },
      interactionPoint: { x: 400, y: 200 },
      interactionRadius: 80,
      collider: { minX: 360, maxX: 440, minY: 160, maxY: 210 },
      isInteractable: true,
    };

    const stationB: StationDefinition = {
      id: "station-b",
      type: "fridge",
      label: "Station B",
      spriteId: "station_fridge",
      pos: { x: 480, y: 200 },
      interactionPoint: { x: 480, y: 200 },
      interactionRadius: 80,
      collider: { minX: 440, maxX: 520, minY: 160, maxY: 210 },
      isInteractable: true,
    };

    const stations = [stationA, stationB];

    // Player stands in the middle at (440, 230)
    // Facing left towards station A
    const targetA = findInteractionTarget(
      {
        pos: { x: 440, y: 230 },
        facing: { x: -1, y: 0 },
        joined: true,
      },
      stations,
    );
    expect(targetA?.id).toBe("station-a");

    // Facing right towards station B
    const targetB = findInteractionTarget(
      {
        pos: { x: 440, y: 230 },
        facing: { x: 1, y: 0 },
        joined: true,
      },
      stations,
    );
    expect(targetB?.id).toBe("station-b");
  });

  it("applies deterministic tie-breaking by station ID when scores are identical", () => {
    const station1: StationDefinition = {
      id: "station-alpha",
      type: "rice",
      label: "Alpha",
      spriteId: "station_rice",
      pos: { x: 300, y: 200 },
      interactionPoint: { x: 300, y: 200 },
      interactionRadius: 100,
      collider: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
      isInteractable: true,
    };

    const station2: StationDefinition = {
      id: "station-beta",
      type: "fridge",
      label: "Beta",
      spriteId: "station_fridge",
      pos: { x: 300, y: 200 },
      interactionPoint: { x: 300, y: 200 },
      interactionRadius: 100,
      collider: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
      isInteractable: true,
    };

    // Both have exact same position, player faces (0, 1)
    const target = findInteractionTarget(
      {
        pos: { x: 300, y: 240 },
        facing: { x: 0, y: -1 },
        joined: true,
      },
      [station2, station1],
    );

    // Lexicographically "station-alpha" < "station-beta"
    expect(target?.id).toBe("station-alpha");
  });

  it("returns null for unjoined players", () => {
    const target = findInteractionTarget(
      {
        pos: { x: 160, y: 140 },
        facing: { x: 0, y: -1 },
        joined: false,
      },
      DEFAULT_STATIONS,
    );

    expect(target).toBeNull();
  });
});
