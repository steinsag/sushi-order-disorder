import { describe, expect, it } from "vitest";
import { AssetLoader } from "./AssetLoader";

describe("AssetLoader", () => {
  it("creates fallback image when requested", () => {
    const loader = new AssetLoader();
    const fallback = loader.getFallbackImage();
    expect(fallback).toBeDefined();
    expect(loader.getImage("non-existent")).toBe(fallback);
  });

  it("registers custom image directly", () => {
    const loader = new AssetLoader();
    const fakeImg = {
      src: "test.png",
      width: 32,
      height: 32,
    } as HTMLImageElement;
    loader.register("custom", fakeImg);

    expect(loader.has("custom")).toBe(true);
    expect(loader.get("custom")).toBe(fakeImg);
    expect(loader.getImage("custom")).toBe(fakeImg);
  });

  it("handles async loading and tracks loading state", async () => {
    // Mock image factory that simulates successful image loading
    const loader = new AssetLoader(() => {
      const listeners: Record<string, () => void> = {};
      let imageSrc = "";
      const img = {
        get src() {
          return imageSrc;
        },
        set src(val: string) {
          imageSrc = val;
          // Simulate async onload
          setTimeout(() => {
            listeners["load"]?.();
          }, 5);
        },
        width: 64,
        height: 64,
        complete: false,
        naturalWidth: 64,
        addEventListener: (type: string, cb: () => void) => {
          listeners[type] = cb;
        },
        removeEventListener: () => {},
      } as unknown as HTMLImageElement;
      return img;
    });

    const promise = loader.load("test-sprite", "sprite.png");
    expect(loader.isReady()).toBe(false);

    const loadedImg = await promise;
    expect(loadedImg).toBeDefined();
    expect(loader.has("test-sprite")).toBe(true);
    expect(loader.isReady()).toBe(true);

    const state = loader.getLoadingState();
    expect(state.loaded).toBe(1);
    expect(state.failed).toBe(0);
    expect(state.ready).toBe(true);
  });

  it("handles load failure gracefully without throwing and returns fallback", async () => {
    const loader = new AssetLoader(() => {
      const listeners: Record<string, () => void> = {};
      let imageSrc = "";
      const img = {
        get src() {
          return imageSrc;
        },
        set src(val: string) {
          imageSrc = val;
          setTimeout(() => {
            listeners["error"]?.();
          }, 5);
        },
        width: 0,
        height: 0,
        complete: false,
        naturalWidth: 0,
        addEventListener: (type: string, cb: () => void) => {
          listeners[type] = cb;
        },
        removeEventListener: () => {},
      } as unknown as HTMLImageElement;
      return img;
    });

    const img = await loader.load("corrupted", "bad.png");
    expect(img).toBe(loader.getFallbackImage());

    const state = loader.getLoadingState();
    expect(state.failed).toBe(1);
    expect(state.ready).toBe(true);
  });

  it("loads multiple assets with loadAll", async () => {
    const loader = new AssetLoader(() => {
      const listeners: Record<string, () => void> = {};
      return {
        set src(val: string) {
          void val;
          setTimeout(() => listeners["load"]?.(), 5);
        },
        width: 32,
        height: 32,
        complete: false,
        naturalWidth: 32,
        addEventListener: (type: string, cb: () => void) => {
          listeners[type] = cb;
        },
        removeEventListener: () => {},
      } as unknown as HTMLImageElement;
    });

    await loader.loadAll({
      a: "a.png",
      b: "b.png",
      c: "c.png",
    });

    expect(loader.has("a")).toBe(true);
    expect(loader.has("b")).toBe(true);
    expect(loader.has("c")).toBe(true);
    expect(loader.getLoadingState().loaded).toBe(3);
  });
});
