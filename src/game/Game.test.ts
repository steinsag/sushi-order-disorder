import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Game } from "./Game";
import { KeyboardState } from "../input/KeyboardInput";

interface MockElement {
  className: string;
  innerHTML: string;
  dataset: Record<string, string>;
  style: Record<string, string>;
  classList: {
    add: (cls: string) => void;
    remove: (cls: string) => void;
  };
  appendChild: (child: MockElement) => MockElement;
  removeChild: (child: MockElement) => MockElement;
  remove: () => void;
  querySelector: (sel: string) => MockElement | null;
  querySelectorAll: (sel: string) => MockElement[];
  addEventListener: (type: string, cb: (e?: unknown) => void) => void;
  removeEventListener: (type: string, cb: (e?: unknown) => void) => void;
  getBoundingClientRect: () => {
    width: number;
    height: number;
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  getContext?: (type: string) => unknown;
}

function createMockElement(tag = "div"): MockElement {
  const listeners = new Map<string, ((e?: unknown) => void)[]>();
  const element: MockElement = {
    className: "",
    innerHTML: "",
    dataset: {},
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
    },
    appendChild: (child) => child,
    removeChild: (child) => child,
    remove: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (type, cb) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type)!.push(cb);
    },
    removeEventListener: (type, cb) => {
      const arr = listeners.get(type);
      if (arr) {
        const idx = arr.indexOf(cb);
        if (idx !== -1) arr.splice(idx, 1);
      }
    },
    getBoundingClientRect: () => ({
      width: 960,
      height: 540,
      left: 0,
      top: 0,
      right: 960,
      bottom: 540,
    }),
  };

  if (tag === "canvas") {
    element.getContext = () => ({
      setTransform: () => {},
      clearRect: () => {},
      fillRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      strokeRect: () => {},
      fillText: () => {},
      arc: () => {},
      ellipse: () => {},
      canvas: {
        getBoundingClientRect: () => ({ width: 960, height: 540 }),
      },
    });
  }

  return element;
}

describe("Game integration", () => {
  const originalDocument = globalThis.document;

  beforeEach(() => {
    globalThis.document = {
      createElement: (tag: string) => createMockElement(tag),
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as Document;
  });

  afterEach(() => {
    globalThis.document = originalDocument;
  });

  it("boots game, starts match and integrates input and player movement", () => {
    const container = createMockElement("div") as unknown as HTMLElement;
    const keyboard = new KeyboardState();
    const game = new Game(container, {
      inputOptions: { keyboard },
      loopOptions: { raf: () => 1, caf: () => {} },
    });

    expect(game.getState().phase).toBe("title");
    expect(game.getState().players[0].joined).toBe(true);
    expect(game.getState().players[1].joined).toBe(true);

    // Start match
    game.startMatch();
    expect(game.getState().phase).toBe("running");

    const p1StartX = game.getState().players[0].pos.x;

    // Simulate P1 pressing ArrowRight (keyboard arrows scheme)
    keyboard.setKeyDown("ArrowRight");

    // Advance update step by 0.25s
    game.update(0.25);

    expect(game.getState().players[0].pos.x).toBeCloseTo(
      p1StartX + 240 * 0.25,
      1,
    );

    // Simulate pause key (Escape)
    keyboard.setKeyDown("Escape");
    game.update(0.016);
    expect(game.getState().phase).toBe("paused");

    game.destroy();
  });

  it("allows joining and leaving player slots", () => {
    const container = createMockElement("div") as unknown as HTMLElement;
    const game = new Game(container, {
      loopOptions: { raf: () => 1, caf: () => {} },
    });

    expect(game.getState().players[2].joined).toBe(false);

    game.togglePlayerSlot(2);
    expect(game.getState().players[2].joined).toBe(true);

    game.togglePlayerSlot(2);
    expect(game.getState().players[2].joined).toBe(false);

    game.destroy();
  });
});
