import { describe, expect, it } from "vitest";
import {
  type SpriteRenderCommand,
  sortSprites,
  drawSprite,
} from "./SpriteRenderer";
import { Camera } from "./Camera";

describe("SpriteRenderer and Depth Sorting", () => {
  it("sorts sprites stably by foot Y position (2.5D depth)", () => {
    // Scene with a counter at worldY = 250
    const counter: SpriteRenderCommand = {
      id: "counter",
      worldX: 400,
      worldY: 250,
      width: 96,
      height: 64,
      anchorX: 0.5,
      anchorY: 1.0,
      sortOrder: 10,
    };

    // Chef 1 is behind/above counter (worldY = 200)
    const chef1Behind: SpriteRenderCommand = {
      id: "chef-1",
      worldX: 400,
      worldY: 200,
      width: 48,
      height: 48,
      anchorX: 0.5,
      anchorY: 1.0,
      sortOrder: 50,
    };

    // Chef 2 is in front of/below counter (worldY = 300)
    const chef2InFront: SpriteRenderCommand = {
      id: "chef-2",
      worldX: 420,
      worldY: 300,
      width: 48,
      height: 48,
      anchorX: 0.5,
      anchorY: 1.0,
      sortOrder: 51,
    };

    const sorted = sortSprites([chef2InFront, counter, chef1Behind]);

    expect(sorted.map((s) => s.id)).toEqual(["chef-1", "counter", "chef-2"]);
  });

  it("updates draw order when a figure crosses a scene object from back to front", () => {
    const counter: SpriteRenderCommand = {
      id: "island-counter",
      worldX: 400,
      worldY: 250,
      width: 96,
      height: 64,
      anchorX: 0.5,
      anchorY: 1.0,
    };

    const chef: SpriteRenderCommand = {
      id: "moving-chef",
      worldX: 400,
      worldY: 200, // Starts behind
      width: 48,
      height: 48,
      anchorX: 0.5,
      anchorY: 1.0,
    };

    // Behind counter
    let sorted = sortSprites([counter, chef]);
    expect(sorted[0].id).toBe("moving-chef");
    expect(sorted[1].id).toBe("island-counter");

    // Chef walks down past counter to worldY = 300
    const movedChef: SpriteRenderCommand = {
      ...chef,
      worldY: 300, // Now in front
    };

    sorted = sortSprites([counter, movedChef]);
    expect(sorted[0].id).toBe("island-counter");
    expect(sorted[1].id).toBe("moving-chef");
  });

  it("resolves equal depth deterministically using sortOrder and id", () => {
    const itemA: SpriteRenderCommand = {
      id: "item-b",
      worldX: 100,
      worldY: 200,
      width: 32,
      height: 32,
      anchorX: 0.5,
      anchorY: 1.0,
      sortOrder: 5,
    };

    const itemB: SpriteRenderCommand = {
      id: "item-a",
      worldX: 120,
      worldY: 200,
      width: 32,
      height: 32,
      anchorX: 0.5,
      anchorY: 1.0,
      sortOrder: 5,
    };

    const sorted = sortSprites([itemA, itemB]);
    // Equal depth & sortOrder -> secondary tie breaker is alphabetical id
    expect(sorted[0].id).toBe("item-a");
    expect(sorted[1].id).toBe("item-b");
  });

  it("calculates correct top-left draw position using foot anchor", () => {
    const camera = new Camera({ width: 800, height: 600 });
    camera.setPosition({ x: 400, y: 300 }, true);
    camera.setZoom(1.0, true);

    const drawnCalls: { x: number; y: number; w: number; h: number }[] = [];

    const mockCtx = {
      save: () => {},
      restore: () => {},
      drawImage: (
        _img: unknown,
        x: number,
        y: number,
        w: number,
        h: number,
      ) => {
        drawnCalls.push({ x, y, w, h });
      },
    } as unknown as CanvasRenderingContext2D;

    const fakeImg = {} as CanvasImageSource;

    // Sprite at world pos (400, 300) with anchor (0.5, 1.0), size 48x48
    // In screen coordinates with camera at (400, 300), world (400, 300) maps to screen (400, 300).
    // drawX = 400 - 48*0.5 = 376
    // drawY = 300 - 48*1.0 = 252
    drawSprite(
      mockCtx,
      {
        id: "chef",
        image: fakeImg,
        worldX: 400,
        worldY: 300,
        width: 48,
        height: 48,
        anchorX: 0.5,
        anchorY: 1.0,
      },
      camera,
    );

    expect(drawnCalls.length).toBe(1);
    expect(drawnCalls[0].x).toBe(376);
    expect(drawnCalls[0].y).toBe(252);
    expect(drawnCalls[0].w).toBe(48);
    expect(drawnCalls[0].h).toBe(48);
  });
});
