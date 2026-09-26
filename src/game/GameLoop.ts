export type UpdateFn = (dt: number) => void;
export type RenderFn = (alpha: number) => void;

export interface VisibilityTarget {
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
  hidden?: boolean;
}

export interface GameLoopOptions {
  /** Target fixed simulation timestep in seconds (default: 1 / 60 ≈ 0.016667s). */
  fixedStep?: number;
  /** Maximum frame delta time in seconds before clamping (default: 0.2s). */
  maxFrameTime?: number;
  /** Maximum number of simulation sub-steps per frame to prevent death spiral (default: 5). */
  maxSubSteps?: number;
  /** Custom requestAnimationFrame implementation. */
  raf?: (cb: (time: number) => void) => number;
  /** Custom cancelAnimationFrame implementation. */
  caf?: (id: number) => void;
  /** Custom visibility change event target. */
  visibilityTarget?: VisibilityTarget;
}

/**
 * Deterministic fixed-timestep game loop driven by requestAnimationFrame.
 * Clamps large frame deltas (e.g. lag spikes or background tabs) and provides an
 * alpha interpolation factor (0 <= alpha < 1) for smooth rendering.
 */
export class GameLoop {
  private isRunning = false;
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private accumulator = 0;

  private readonly update: UpdateFn;
  private readonly render: RenderFn;
  private readonly fixedStep: number;
  private readonly maxFrameTime: number;
  private readonly maxSubSteps: number;
  private readonly raf: (cb: (time: number) => void) => number;
  private readonly caf: (id: number) => void;
  private readonly visibilityTarget?: VisibilityTarget;
  private readonly onVisibilityChange = (): void => {
    this.handleVisibilityChange();
  };

  constructor(
    update: UpdateFn,
    render: RenderFn,
    options: GameLoopOptions = {},
  ) {
    this.update = update;
    this.render = render;
    this.fixedStep = options.fixedStep ?? 1 / 60;
    this.maxFrameTime = options.maxFrameTime ?? 0.2;
    this.maxSubSteps = options.maxSubSteps ?? 5;
    this.raf =
      options.raf ??
      ((cb: (time: number) => void) =>
        typeof requestAnimationFrame !== "undefined"
          ? requestAnimationFrame(cb)
          : (setTimeout(() => cb(Date.now()), 16) as unknown as number));
    this.caf =
      options.caf ??
      ((id: number) =>
        typeof cancelAnimationFrame !== "undefined"
          ? cancelAnimationFrame(id)
          : clearTimeout(id));
    this.visibilityTarget =
      options.visibilityTarget ??
      (typeof document !== "undefined" ? document : undefined);
  }

  public get running(): boolean {
    return this.isRunning;
  }

  public get timestep(): number {
    return this.fixedStep;
  }

  public start(): void {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.lastTime = null;
    this.accumulator = 0;

    if (this.visibilityTarget) {
      this.visibilityTarget.addEventListener(
        "visibilitychange",
        this.onVisibilityChange,
      );
    }

    this.scheduleNextTick();
  }

  public stop(): void {
    if (!this.isRunning) {
      return;
    }
    this.isRunning = false;
    if (this.rafId !== null) {
      this.caf(this.rafId);
      this.rafId = null;
    }
    if (this.visibilityTarget) {
      this.visibilityTarget.removeEventListener(
        "visibilitychange",
        this.onVisibilityChange,
      );
    }
  }

  /**
   * Advances simulation with the given timestamp in milliseconds.
   * Can be invoked directly in automated tests.
   */
  public tick(currentTimeMs: number): void {
    if (!this.isRunning) {
      return;
    }

    if (this.lastTime === null) {
      this.lastTime = currentTimeMs;
      this.render(0);
      return;
    }

    let deltaSeconds = (currentTimeMs - this.lastTime) / 1000;
    this.lastTime = currentTimeMs;

    if (deltaSeconds < 0 || Number.isNaN(deltaSeconds)) {
      deltaSeconds = 0;
    }

    if (deltaSeconds > this.maxFrameTime) {
      deltaSeconds = this.maxFrameTime;
    }

    this.accumulator += deltaSeconds;

    const epsilon = 1e-6;
    let subSteps = 0;
    while (
      this.accumulator >= this.fixedStep - epsilon &&
      subSteps < this.maxSubSteps
    ) {
      this.update(this.fixedStep);
      this.accumulator -= this.fixedStep;
      subSteps++;
    }

    if (this.accumulator < 0) {
      this.accumulator = 0;
    }

    // Drop remaining accumulator if sub-step limit was reached to prevent spiral of death
    if (this.accumulator >= this.fixedStep) {
      this.accumulator = 0;
    }

    const alpha = this.fixedStep > 0 ? this.accumulator / this.fixedStep : 0;
    this.render(Math.min(1, Math.max(0, alpha)));
  }

  private handleVisibilityChange(): void {
    // Reset time anchor and accumulator when tab visibility changes
    this.lastTime = null;
    this.accumulator = 0;
  }

  private scheduleNextTick(): void {
    this.rafId = this.raf((timestamp) => {
      this.rafId = null;
      if (this.isRunning) {
        this.tick(timestamp);
        this.scheduleNextTick();
      }
    });
  }
}
