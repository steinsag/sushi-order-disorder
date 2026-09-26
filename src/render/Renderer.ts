import type { WorldState } from "../state/WorldState";
import type { PlayerState } from "../state/PlayerState";

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
    const bounds = state.bounds;
    const kitchenX = bounds.minX - 16;
    const kitchenY = bounds.minY - 16;
    const kitchenW = bounds.maxX - bounds.minX + 32;
    const kitchenH = bounds.maxY - bounds.minY + 32;

    // Floor base
    ctx.fillStyle = "#2b2b36";
    ctx.fillRect(kitchenX, kitchenY, kitchenW, kitchenH);

    // Grid pattern on kitchen floor
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    const gridSize = 32;

    ctx.beginPath();
    for (let x = kitchenX; x <= kitchenX + kitchenW; x += gridSize) {
      ctx.moveTo(x, kitchenY);
      ctx.lineTo(x, kitchenY + kitchenH);
    }
    for (let y = kitchenY; y <= kitchenY + kitchenH; y += gridSize) {
      ctx.moveTo(kitchenX, y);
      ctx.lineTo(kitchenX + kitchenW, y);
    }
    ctx.stroke();

    // Kitchen border
    ctx.strokeStyle = "#434356";
    ctx.lineWidth = 3;
    ctx.strokeRect(kitchenX, kitchenY, kitchenW, kitchenH);

    // Draw players (sorted by Y position for proper 2.5D visual overlap)
    const sortedPlayers = [...state.players]
      .filter((p) => p.joined)
      .sort((a, b) => a.pos.y - b.pos.y);

    for (const player of sortedPlayers) {
      this.drawPlayer(ctx, player);
    }

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
      ctx.fillText("SUSHI RUSH", w / 2, h / 2 - 40);

      ctx.fillStyle = "#9ca3af";
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText("Küche bereit – Klicke auf Start", w / 2, h / 2);
    } else if (state.phase === "running" || state.phase === "paused") {
      // HUD preview / Debug info
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(kitchenX + 10, kitchenY + 10, 260, 60);

      ctx.fillStyle = "#a7f3d0";
      ctx.font = "13px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `Status: ${state.phase.toUpperCase()}`,
        kitchenX + 20,
        kitchenY + 30,
      );
      ctx.fillText(
        `Zeit: ${state.simulationTime.toFixed(1)}s | Ticks: ${state.tickCount}`,
        kitchenX + 20,
        kitchenY + 46,
      );
      const joinedCount = state.players.filter((p) => p.joined).length;
      ctx.fillText(
        `Aktive Köche: ${joinedCount}/4`,
        kitchenX + 20,
        kitchenY + 62,
      );
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState): void {
    const x = player.pos.x;
    const y = player.pos.y;
    const radius = 18;

    // Shadow on floor
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y + 2, radius * 1.1, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Action ring indicator if action1 or action2 held
    if (player.input.action1 || player.input.action2) {
      ctx.strokeStyle = player.input.action1 ? "#38bdf8" : "#f43f5e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 8, radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Player body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(x, y - 8, radius, 0, Math.PI * 2);
    ctx.fill();

    // Player outline
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Chef hat / top highlight
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y - 18, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Facing direction dot / visor
    const faceX = x + player.facing.x * 10;
    const faceY = y - 8 + player.facing.y * 10;
    ctx.fillStyle = "#1e1e24";
    ctx.beginPath();
    ctx.arc(faceX, faceY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Player ID badge
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`P${player.id + 1}`, x, y + 24);
  }
}
