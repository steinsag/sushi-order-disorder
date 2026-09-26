export interface LoadingState {
  total: number;
  loaded: number;
  failed: number;
  ready: boolean;
}

export type ImageFactory = () => HTMLImageElement;

export class AssetLoader {
  private readonly cache = new Map<string, HTMLImageElement>();
  private readonly pending = new Map<string, Promise<HTMLImageElement>>();
  private readonly failed = new Set<string>();
  private totalCount = 0;
  private fallbackImage: HTMLImageElement | null = null;
  private readonly createImage: ImageFactory;

  constructor(customImageFactory?: ImageFactory) {
    this.createImage =
      customImageFactory ??
      (() => {
        if (typeof Image !== "undefined") {
          return new Image();
        }
        // Minimal fallback element in non-browser environments
        return {
          src: "",
          width: 32,
          height: 32,
          complete: true,
          addEventListener: () => {},
          removeEventListener: () => {},
        } as unknown as HTMLImageElement;
      });
  }

  public getFallbackImage(): HTMLImageElement {
    if (!this.fallbackImage) {
      const img = this.createImage();
      // 1x1 transparent PNG data URI as baseline fallback
      img.src =
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><rect width='32' height='32' fill='%2364748b' rx='4'/></svg>";
      this.fallbackImage = img;
    }
    return this.fallbackImage;
  }

  public register(id: string, image: HTMLImageElement): void {
    this.cache.set(id, image);
    this.failed.delete(id);
  }

  public async load(id: string, src: string): Promise<HTMLImageElement> {
    const existing = this.cache.get(id);
    if (existing) {
      return existing;
    }

    const inFlight = this.pending.get(id);
    if (inFlight) {
      return inFlight;
    }

    this.totalCount++;

    const promise = new Promise<HTMLImageElement>((resolve) => {
      const img = this.createImage();

      const onDone = (success: boolean) => {
        this.pending.delete(id);
        if (success) {
          this.cache.set(id, img);
          resolve(img);
        } else {
          this.failed.add(id);
          // Return fallback on failure instead of rejecting to keep game loop robust
          resolve(this.getFallbackImage());
        }
      };

      if (typeof img.addEventListener === "function") {
        img.addEventListener("load", () => onDone(true), { once: true });
        img.addEventListener("error", () => onDone(false), { once: true });
      } else {
        img.onload = () => onDone(true);
        img.onerror = () => onDone(false);
      }

      try {
        img.src = src;
        // In some environments, data URIs or already cached images are complete immediately
        if (img.complete && img.naturalWidth !== 0) {
          onDone(true);
        }
      } catch {
        onDone(false);
      }
    });

    this.pending.set(id, promise);
    return promise;
  }

  public async loadAll(manifest: Record<string, string>): Promise<void> {
    const promises = Object.entries(manifest).map(([id, src]) =>
      this.load(id, src),
    );
    await Promise.all(promises);
  }

  public get(id: string): HTMLImageElement | null {
    return this.cache.get(id) ?? null;
  }

  public getImage(id: string): HTMLImageElement {
    return this.cache.get(id) ?? this.getFallbackImage();
  }

  public has(id: string): boolean {
    return this.cache.has(id);
  }

  public isReady(): boolean {
    return this.pending.size === 0;
  }

  public getLoadingState(): LoadingState {
    const loaded = this.cache.size;
    const failed = this.failed.size;
    const total = Math.max(this.totalCount, loaded + failed);
    return {
      total,
      loaded,
      failed,
      ready: this.pending.size === 0,
    };
  }

  public clear(): void {
    this.cache.clear();
    this.pending.clear();
    this.failed.clear();
    this.totalCount = 0;
  }
}
