import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Overlay } from "./Overlay";
import { createInitialWorldState, type WorldState } from "../state/WorldState";
import { type ActiveOrder } from "../state/OrderState";
import { i18n } from "../i18n";

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
    void i18n.changeLanguage("en");
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
    expect(container.innerHTML).toContain("order counter");
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
    expect(html).toContain("Cucumber Maki");
    expect(html).toContain("🥒");

    // Ingredients
    expect(html).toContain("Nori");
    expect(html).toContain("Rice");
    expect(html).toContain("Cucumber");

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
    expect(html).toContain("Expired");

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
          scoreDelta: 100,
          timeRemaining: 2.5,
          recipeId: "cucumber-maki",
          isExpress: false,
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
    expect(html).toContain("Cucumber Maki delivered on time! (+100)");

    overlay.destroy();
  });

  it("renders shift countdown timer in HUD top bar during running phase", () => {
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
      shift: {
        totalDuration: 120,
        timeRemaining: 75, // 1:15
        progress: 0.375,
        isFinished: false,
      },
    };

    overlay.render(state);

    // @ts-expect-error accessing innerHTML on container mock
    const container = overlay["container"] as MockElement;
    const html = container.innerHTML;

    expect(html).toContain("hud-shift-badge");
    expect(html).toContain("1:15");

    overlay.destroy();
  });

  it("renders pause screen in paused phase with resume and reset actions", () => {
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
      phase: "paused",
    };

    overlay.render(state);

    // @ts-expect-error accessing innerHTML on container mock
    const container = overlay["container"] as MockElement;
    const html = container.innerHTML;

    expect(html).toContain("pause-card");
    expect(html).toContain("Game paused");
    expect(html).toContain("btn-resume");
    expect(html).toContain("btn-reset");

    overlay.destroy();
  });

  it("renders shift completed summary screen with score breakdown, rating and restart button", () => {
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
      phase: "completed",
      scoreState: {
        totalScore: 320,
        completedOrders: 3,
        onTimeOrders: 3,
        lateOrders: 0,
        wrongDeliveries: 0,
        recentFeedback: null,
      },
    };

    overlay.render(state);

    // @ts-expect-error accessing innerHTML on container mock
    const container = overlay["container"] as MockElement;
    const html = container.innerHTML;

    expect(html).toContain("summary-card");
    expect(html).toContain("Shift complete");
    expect(html).toContain("Master chefs");
    expect(html).toContain("320");
    expect(html).toContain("btn-restart");
    expect(html).toContain("btn-menu");

    overlay.destroy();
  });

  it("updates the menu immediately when the UI language changes", async () => {
    const overlay = new Overlay(createMockElement() as unknown as HTMLElement, {
      onStart: vi.fn(),
      onPauseToggle: vi.fn(),
      onReset: vi.fn(),
      onRetry: vi.fn(),
    });
    const state = createInitialWorldState();
    overlay.render(state);
    const container = overlay["container"] as unknown as MockElement;

    expect(container.innerHTML).toContain("Start game");
    expect(container.innerHTML).toContain('data-language="en"');
    expect(container.innerHTML).toContain("🇬🇧");
    expect(container.innerHTML).toContain("🇩🇪");

    await i18n.changeLanguage("de");
    expect(container.innerHTML).toContain("Spiel starten");
    expect(container.innerHTML).toContain("Pfeiltasten");
    expect(container.innerHTML).toContain('data-language="de"');
    expect(state.phase).toBe("title");
    overlay.destroy();
  });

  it("translates an active delivery toast after the language changes", async () => {
    const overlay = new Overlay(createMockElement() as unknown as HTMLElement, {
      onStart: vi.fn(),
      onPauseToggle: vi.fn(),
      onReset: vi.fn(),
      onRetry: vi.fn(),
    });
    const state: WorldState = {
      ...createInitialWorldState(),
      phase: "running",
      scoreState: {
        ...createInitialWorldState().scoreState,
        recentFeedback: {
          id: "feedback-1",
          type: "success",
          scoreDelta: 150,
          timeRemaining: 2,
          recipeId: "salmon-nigiri",
          isExpress: true,
        },
      },
    };
    overlay.render(state);
    const container = overlay["container"] as unknown as MockElement;
    expect(container.innerHTML).toContain("Salmon Nigiri delivered on time");

    await i18n.changeLanguage("de");
    expect(container.innerHTML).toContain("Lachs-Nigiri pünktlich geliefert");
    expect(container.innerHTML).toContain("⚡");
    overlay.destroy();
  });
});
