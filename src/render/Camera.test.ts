import { describe, expect, it } from "vitest";
import { Camera } from "./Camera";

describe("Camera", () => {
  it("converts world coordinates to screen and back bijectively", () => {
    const camera = new Camera({ width: 800, height: 600 });
    camera.setPosition({ x: 400, y: 300 }, true);
    camera.setZoom(1.5, true);

    const worldPoint = { x: 450, y: 320 };
    const screenPoint = camera.worldToScreen(worldPoint);
    const roundTrip = camera.screenToWorld(screenPoint);

    expect(roundTrip.x).toBeCloseTo(worldPoint.x, 4);
    expect(roundTrip.y).toBeCloseTo(worldPoint.y, 4);
  });

  it("transforms world rectangle to screen rectangle according to zoom", () => {
    const camera = new Camera({ width: 800, height: 600 });
    camera.setPosition({ x: 0, y: 0 }, true);
    camera.setZoom(2.0, true);

    const rect = camera.worldToScreenRect(-50, -50, 100, 100);
    expect(rect.w).toBe(200);
    expect(rect.h).toBe(200);
    expect(rect.x).toBe(300); // (-50 - 0)*2 + 400 = 300
    expect(rect.y).toBe(200); // (-50 - 0)*2 + 300 = 200
  });

  it("fits bounding box within viewport", () => {
    const camera = new Camera({ width: 1000, height: 500, padding: 0 });
    const bounds = { minX: 0, maxX: 1000, minY: 0, maxY: 1000 };

    camera.fitBounds(bounds, 0);

    // Viewport is 1000x500, bounds are 1000x1000 -> limiting axis is height (500/1000 = 0.5)
    expect(camera.targetZoom).toBeCloseTo(0.5, 2);
    expect(camera.targetCenter.x).toBe(500);
    expect(camera.targetCenter.y).toBe(500);
  });

  it("frames multiple players and bounds dynamically", () => {
    const camera = new Camera({ width: 960, height: 540, padding: 40 });
    const kitchenBounds = { minX: 100, maxX: 900, minY: 100, maxY: 500 };
    const players = [
      { x: 200, y: 250 },
      { x: 800, y: 400 },
    ];

    camera.frameScene(players, kitchenBounds, 0, true);

    expect(camera.center.x).toBe(500);
    expect(camera.center.y).toBe(300);

    // All players must be inside visible world bounds
    const visible = camera.getVisibleWorldBounds();
    expect(visible.minX).toBeLessThanOrEqual(kitchenBounds.minX);
    expect(visible.maxX).toBeGreaterThanOrEqual(kitchenBounds.maxX);
    expect(visible.minY).toBeLessThanOrEqual(kitchenBounds.minY);
    expect(visible.maxY).toBeGreaterThanOrEqual(kitchenBounds.maxY);
  });

  it("updates dimensions and handles DPR on resize", () => {
    const camera = new Camera({ width: 800, height: 600 });
    camera.resize(1280, 720, 2);

    expect(camera.width).toBe(1280);
    expect(camera.height).toBe(720);
    expect(camera.dpr).toBe(2);
  });
});
