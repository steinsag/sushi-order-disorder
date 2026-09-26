import type { Vec2 } from "../math/vec2";

export interface CameraBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CameraOptions {
  width?: number;
  height?: number;
  dpr?: number;
  minZoom?: number;
  maxZoom?: number;
  padding?: number;
  smoothing?: number;
}

export class Camera {
  public width = 960;
  public height = 540;
  public dpr = 1;

  public center: Vec2 = { x: 480, y: 270 };
  public targetCenter: Vec2 = { x: 480, y: 270 };

  public zoom = 1;
  public targetZoom = 1;

  public minZoom = 0.4;
  public maxZoom = 2.0;
  public padding = 60;
  public smoothing = 8; // Smoothing factor (higher = faster tracking)

  constructor(options: CameraOptions = {}) {
    if (options.width !== undefined) this.width = options.width;
    if (options.height !== undefined) this.height = options.height;
    if (options.dpr !== undefined) this.dpr = options.dpr;
    if (options.minZoom !== undefined) this.minZoom = options.minZoom;
    if (options.maxZoom !== undefined) this.maxZoom = options.maxZoom;
    if (options.padding !== undefined) this.padding = options.padding;
    if (options.smoothing !== undefined) this.smoothing = options.smoothing;

    this.center = { x: this.width / 2, y: this.height / 2 };
    this.targetCenter = { ...this.center };
  }

  public resize(width: number, height: number, dpr = 1): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.dpr = Math.max(1, dpr);
  }

  public setPosition(pos: Vec2, snap = false): void {
    this.targetCenter = { ...pos };
    if (snap) {
      this.center = { ...pos };
    }
  }

  public setZoom(zoom: number, snap = false): void {
    const clamped = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    this.targetZoom = clamped;
    if (snap) {
      this.zoom = clamped;
    }
  }

  /**
   * Transforms a 2D world coordinate into screen coordinate (CSS pixels relative to canvas)
   */
  public worldToScreen(worldPos: Vec2): Vec2 {
    return {
      x: (worldPos.x - this.center.x) * this.zoom + this.width / 2,
      y: (worldPos.y - this.center.y) * this.zoom + this.height / 2,
    };
  }

  /**
   * Transforms a 2D screen coordinate back into world coordinate
   */
  public screenToWorld(screenPos: Vec2): Vec2 {
    return {
      x: (screenPos.x - this.width / 2) / this.zoom + this.center.x,
      y: (screenPos.y - this.height / 2) / this.zoom + this.center.y,
    };
  }

  /**
   * Transforms a rectangle in world space to screen space
   */
  public worldToScreenRect(
    x: number,
    y: number,
    w: number,
    h: number,
  ): { x: number; y: number; w: number; h: number } {
    const screenPos = this.worldToScreen({ x, y });
    return {
      x: screenPos.x,
      y: screenPos.y,
      w: w * this.zoom,
      h: h * this.zoom,
    };
  }

  /**
   * Calculates zoom and center to comfortably frame the given bounds
   */
  public fitBounds(bounds: CameraBounds, padding = this.padding): void {
    const spanX = Math.max(1, bounds.maxX - bounds.minX + padding * 2);
    const spanY = Math.max(1, bounds.maxY - bounds.minY + padding * 2);

    const scaleX = this.width / spanX;
    const scaleY = this.height / spanY;
    const idealZoom = Math.min(scaleX, scaleY);

    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, idealZoom));
    this.targetCenter = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    };
  }

  /**
   * Frame all active player targets and the kitchen scene bounds
   */
  public frameScene(
    playerPositions: Vec2[],
    baseBounds: CameraBounds,
    dt = 0,
    snap = false,
  ): void {
    let minX = baseBounds.minX;
    let maxX = baseBounds.maxX;
    let minY = baseBounds.minY;
    let maxY = baseBounds.maxY;

    if (playerPositions.length > 0) {
      for (const p of playerPositions) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }

    this.fitBounds({ minX, maxX, minY, maxY }, this.padding);

    if (snap || dt <= 0) {
      this.center = { ...this.targetCenter };
      this.zoom = this.targetZoom;
    } else {
      // Smooth tracking with frame rate independent lerp
      const factor = 1 - Math.exp(-this.smoothing * dt);
      this.center.x += (this.targetCenter.x - this.center.x) * factor;
      this.center.y += (this.targetCenter.y - this.center.y) * factor;
      this.zoom += (this.targetZoom - this.zoom) * factor;
    }
  }

  /**
   * Returns the visible world rectangle currently visible in the camera viewport
   */
  public getVisibleWorldBounds(): CameraBounds {
    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.screenToWorld({ x: this.width, y: this.height });
    return {
      minX: topLeft.x,
      maxX: bottomRight.x,
      minY: topLeft.y,
      maxY: bottomRight.y,
    };
  }
}
