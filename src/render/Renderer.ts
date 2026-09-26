import type { WorldState } from "../state/WorldState";

export interface RendererOptions {
  width?: number;
  height?: number;
}

export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private width = 960;
  private height = 540;

  constructor(canvas: HTMLCanvasElement, options: RendererOptions = {}) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to obtain 2D canvas rendering context");
    }
    this.ctx = context;
    if (options.width) this.width = options.width;
    if (options.height) this.height = options.height;
    this.resize();
  }

  public resize(): void {
    const dpr =
      typeof window !== "undefined"
        ? Math.max(1, window.devicePixelRatio || 1)
        : 1;
    const rect = this.canvas.getBoundingClientRect();

    const displayWidth = rect.width > 0 ? rect.width : this.width;
    const displayHeight = rect.height > 0 ? rect.height : this.height;

    this.width = displayWidth;
    this.height = displayHeight;

    this.canvas.width = Math.floor(displayWidth * dpr);
    this.canvas.height = Math.floor(displayHeight * dpr);

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public render(state: WorldState, alpha = 0): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    void alpha;

    ctx.clearRect(0, 0, w, h);

    // Background: kitchen ambiance
    ctx.fillStyle = "#1e1e24";
    ctx.fillRect(0, 0, w, h);

    // Floor area (Kitchen bounds)
    const marginX = Math.max(20, w * 0.05);
    const marginY = Math.max(20, h * 0.05);
    const kitchenW = w - marginX * 2;
    const kitchenH = h - marginY * 2;

    // Floor base
    ctx.fillStyle = "#2b2b36";
    ctx.fillRect(marginX, marginY, kitchenW, kitchenH);

    // Grid pattern on kitchen floor
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    const gridSize = 32;

    ctx.beginPath();
    for (let x = marginX; x <= marginX + kitchenW; x += gridSize) {
      ctx.moveTo(x, marginY);
      ctx.lineTo(x, marginY + kitchenH);
    }
    for (let y = marginY; y <= marginY + kitchenH; y += gridSize) {
      ctx.moveTo(marginX, y);
      ctx.lineTo(marginX + kitchenW, y);
    }
    ctx.stroke();

    // Kitchen border
    ctx.strokeStyle = "#434356";
    ctx.lineWidth = 3;
    ctx.strokeRect(marginX, marginY, kitchenW, kitchenH);

    // Phase specific graphics on canvas
    if (state.phase === "loading") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#f3f4f6";
      ctx.font = "600 24px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Lade Sushi Rush...", w / 2, h / 2);
    } else if (state.phase === "error") {
      ctx.fillStyle = "rgba(180, 20, 20, 0.3)";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 24px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Fehler aufgetreten", w / 2, h / 2 - 20);

      ctx.fillStyle = "#f3f4f6";
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText(
        state.errorMessage ?? "Unbekannter Fehler",
        w / 2,
        h / 2 + 15,
      );
    } else if (state.phase === "title") {
      ctx.fillStyle = "#f3f4f6";
      ctx.font = "bold 36px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SUSHI RUSH", w / 2, h / 2 - 20);

      ctx.fillStyle = "#9ca3af";
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText("Küche bereit – Klicke auf Start", w / 2, h / 2 + 20);
    } else if (state.phase === "running" || state.phase === "paused") {
      // HUD preview / Debug info
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(marginX + 10, marginY + 10, 220, 50);

      ctx.fillStyle = "#a7f3d0";
      ctx.font = "14px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `Status: ${state.phase.toUpperCase()}`,
        marginX + 20,
        marginY + 30,
      );
      ctx.fillText(
        `Zeit: ${state.simulationTime.toFixed(1)}s | Ticks: ${state.tickCount}`,
        marginX + 20,
        marginY + 48,
      );
    }
  }
}
