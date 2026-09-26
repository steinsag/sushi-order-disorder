import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Overlay } from "./Overlay";
import { createInitialWorldState, type WorldState } from "../state/WorldState";
import { type ActiveOrder } from "../state/OrderState";

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
}

function createMockElement(): MockElement {
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
    querySelector: (sel: string) => {
      if (element.innerHTML.includes(sel.replace(/^[.#]/, ""))) {
        return createMockElement();
      }
      return null;
    },
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
  };

  return element;
}

describe("Overlay UI & Recipe Cards", () => {
  const originalDocument = globalThis.document;

  beforeEach(() => {
    globalThis.document = {
      createElement: () => createMockElement(),
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as Document;
  });

  afterEach(() => {
    globalThis.document = originalDocument;
  });

  it("renders pending order banner when an order is waiting at the counter", () => {
    const root = createMockElement() as unknown as HTMLElement;
    const callbacks = {
      onStart: vi.fn(),
      onPauseToggle: vi.fn(),
      onReset: vi.fn(),
      onRetry: vi.fn(),
    };

    const overlay = new Overlay(root, callbacks);
    const state: WorldState = {
      ...createInitialWorldState(),
      phase: "running",
      activeOrders: [],
    };

    overlay.render(state);

    // Check that generated HTML contains pending order banner
    // @ts-expect-error accessing innerHTML on container mock
    const container = overlay["container"] as MockElement;
    expect(container.innerHTML).toContain("pending-order-banner");
    expect(container.innerHTML).toContain("Bestellannahme bereit");
    overlay.destroy();
  });

  it("renders well-readable recipe card with dish title, ingredients and timer when order is active", () => {
    const root = createMockElement() as unknown as HTMLElement;
    const callbacks = {
      onStart: vi.fn(),
      onPauseToggle: vi.fn(),
      onReset: vi.fn(),
      onRetry: vi.fn(),
    };

    const overlay = new Overlay(root, callbacks);
    const activeOrder: ActiveOrder = {
      id: "ord-test",
      recipeId: "cucumber-maki",
      totalTime: 45,
      timeRemaining: 30,
      isExpress: false,
      status: "active",
    };

    const state: WorldState = {
      ...createInitialWorldState(),
      phase: "running",
      activeOrders: [activeOrder],
    };

    overlay.render(state);

    // @ts-expect-error accessing innerHTML on container mock
    const container = overlay["container"] as MockElement;
    const html = container.innerHTML;

    // Recipe card should be present
    expect(html).toContain("recipe-card");
    expect(html).toContain('data-order-id="ord-test"');

    // Title & emoji
    expect(html).toContain("Gurken-Maki");
    expect(html).toContain("🥒");

    // Ingredients
    expect(html).toContain("Nori");
    expect(html).toContain("Reis");
    expect(html).toContain("Gurke");

    // Timer countdown and width
    expect(html).toContain("30s");
    expect(html).toContain("width: 66.66");

    overlay.destroy();
  });

  it("shows expired state when active order runs out of time", () => {
    const root = createMockElement() as unknown as HTMLElement;
    const callbacks = {
      onStart: vi.fn(),
      onPauseToggle: vi.fn(),
      onReset: vi.fn(),
      onRetry: vi.fn(),
    };

    const overlay = new Overlay(root, callbacks);
    const activeOrder: ActiveOrder = {
      id: "ord-expired",
      recipeId: "cucumber-maki",
      totalTime: 45,
      timeRemaining: 0,
      isExpress: false,
      status: "expired",
    };

    const state: WorldState = {
      ...createInitialWorldState(),
      phase: "running",
      activeOrders: [activeOrder],
    };

    overlay.render(state);

    // @ts-expect-error accessing innerHTML on container mock
    const container = overlay["container"] as MockElement;
    const html = container.innerHTML;

    expect(html).toContain("card-expired");
    expect(html).toContain("Abgelaufen");

    overlay.destroy();
  });

  it("renders score badge and delivery feedback toast when available", () => {
    const root = createMockElement() as unknown as HTMLElement;
    const callbacks = {
      onStart: vi.fn(),
      onPauseToggle: vi.fn(),
      onReset: vi.fn(),
      onRetry: vi.fn(),
    };

    const overlay = new Overlay(root, callbacks);
    const state: WorldState = {
      ...createInitialWorldState(),
      phase: "running",
      scoreState: {
        totalScore: 250,
        completedOrders: 2,
        onTimeOrders: 2,
        lateOrders: 0,
        wrongDeliveries: 0,
        recentFeedback: {
          id: "fb-1",
          type: "success",
          message: "🥒 Gurken-Maki pünktlich geliefert! (+100)",
          scoreDelta: 100,
          timeRemaining: 2.5,
          recipeId: "cucumber-maki",
        },
      },
    };

    overlay.render(state);

    // @ts-expect-error accessing innerHTML on container mock
    const container = overlay["container"] as MockElement;
    const html = container.innerHTML;

    expect(html).toContain("hud-score-badge");
    expect(html).toContain("250");
    expect(html).toContain("hud-delivery-toast");
    expect(html).toContain("feedback-success");
    expect(html).toContain("Gurken-Maki pünktlich geliefert! (+100)");

    overlay.destroy();
  });
});
