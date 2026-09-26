import { describe, expect, it } from "vitest";
import { Renderer } from "./Renderer";
import { createInitialWorldState } from "../state/WorldState";

function createMockCanvas(width = 960, height = 540): HTMLCanvasElement {
  return {
    width,
    height,
    getBoundingClientRect: () => ({
      width,
      height,
      top: 0,
      left: 0,
      bottom: height,
      right: width,
    }),
    getContext: () => ({
      clearRect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      ellipse: () => {},
      rect: () => {},
      clip: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      drawImage: () => {},
      fillText: () => {},
      setTransform: () => {},
      font: "",
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      textAlign: "center",
      globalAlpha: 1,
    }),
  } as unknown as HTMLCanvasElement;
}

describe("Renderer integration", () => {
  it("initializes and renders title phase cleanly", () => {
    const canvas = createMockCanvas();
    const renderer = new Renderer(canvas);
    const state = createInitialWorldState();

    expect(() => renderer.render(state, 0)).not.toThrow();
    expect(renderer.getCamera()).toBeDefined();
    expect(renderer.getAssetLoader()).toBeDefined();
  });

  it("renders running match with joined players and stations", () => {
    const canvas = createMockCanvas();
    const renderer = new Renderer(canvas);
    const state = createInitialWorldState();
    state.phase = "running";
    state.players[0].targetStationId = "station-order";

    expect(() => renderer.render(state, 0.016)).not.toThrow();
  });

  it("handles resize and DPR adjustments", () => {
    const canvas = createMockCanvas(800, 600);
    const renderer = new Renderer(canvas, { width: 800, height: 600 });

    renderer.resize();
    expect(renderer.getCamera().width).toBe(800);
    expect(renderer.getCamera().height).toBe(600);
  });

  it("renders error and loading states without throwing", () => {
    const canvas = createMockCanvas();
    const renderer = new Renderer(canvas);
    const state = createInitialWorldState();

    state.phase = "loading";
    expect(() => renderer.render(state, 0)).not.toThrow();

    state.phase = "error";
    state.errorMessage = "Test Asset Failure";
    expect(() => renderer.render(state, 0)).not.toThrow();
  });
});
