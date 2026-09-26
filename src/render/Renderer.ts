import type { WorldState } from "../state/WorldState";
import { Camera } from "./Camera";
import { AssetLoader } from "./AssetLoader";
import { type SpriteRenderCommand, renderSpriteScene } from "./SpriteRenderer";
import { SPRITE_METADATA, SPRITE_URLS, type SpriteId } from "./SpriteAssets";
import type { Vec2 } from "../math/vec2";

export interface RendererOptions {
  width?: number;
  height?: number;
  assetLoader?: AssetLoader;
  camera?: Camera;
}

export interface KitchenObject {
  id: string;
  spriteId: SpriteId;
  pos: Vec2; // Ground/foot anchor in world coords
}

export const DEFAULT_KITCHEN_OBJECTS: readonly KitchenObject[] = [
  { id: "station-order", spriteId: "station_order", pos: { x: 160, y: 110 } },
  { id: "station-rice", spriteId: "station_rice", pos: { x: 380, y: 110 } },
  { id: "station-fridge", spriteId: "station_fridge", pos: { x: 600, y: 110 } },
  { id: "counter-island", spriteId: "counter", pos: { x: 480, y: 280 } },
  { id: "station-roll", spriteId: "station_roll", pos: { x: 380, y: 440 } },
  {
    id: "station-delivery",
    spriteId: "station_delivery",
    pos: { x: 760, y: 440 },
  },
];

export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly camera: Camera;
  private readonly assetLoader: AssetLoader;
  private width = 960;
  private height = 540;
  private kitchenObjects: KitchenObject[] = [...DEFAULT_KITCHEN_OBJECTS];

  constructor(canvas: HTMLCanvasElement, options: RendererOptions = {}) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to obtain 2D canvas rendering context");
    }
    this.ctx = context;
    if (options.width) this.width = options.width;
    if (options.height) this.height = options.height;

    this.assetLoader = options.assetLoader ?? new AssetLoader();
    this.camera =
      options.camera ??
      new Camera({
        width: this.width,
        height: this.height,
        padding: 50,
      });

    this.resize();
    this.loadInitialAssets();
  }

  private loadInitialAssets(): void {
    // Asynchronously preload all game sprites
    this.assetLoader.loadAll(SPRITE_URLS).catch(() => {
      // Errors are caught and handled gracefully by AssetLoader fallback
    });
  }

  public getCamera(): Camera {
    return this.camera;
  }

  public getAssetLoader(): AssetLoader {
    return this.assetLoader;
  }

  public setKitchenObjects(objects: KitchenObject[]): void {
    this.kitchenObjects = [...objects];
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
    this.camera.resize(displayWidth, displayHeight, dpr);
  }

  public render(state: WorldState, dt = 0): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Collect joined player foot positions for dynamic camera framing
    const joinedPlayers = state.players.filter((p) => p.joined);
    const playerPositions = joinedPlayers.map((p) => p.pos);

    // Update camera to keep players and kitchen in view
    this.camera.frameScene(playerPositions, state.bounds, dt);

    // Render floor & world background
    this.renderEnvironment(ctx, state);

    // Build sprite render commands for scene objects and players
    const commands: SpriteRenderCommand[] = [];

    // 1. Kitchen Stations & Scenery
    for (let i = 0; i < this.kitchenObjects.length; i++) {
      const obj = this.kitchenObjects[i];
      const meta = SPRITE_METADATA[obj.spriteId];
      const image = this.assetLoader.getImage(obj.spriteId);

      commands.push({
        id: obj.id,
        image,
        worldX: obj.pos.x,
        worldY: obj.pos.y,
        width: meta.width,
        height: meta.height,
        anchorX: meta.anchorX,
        anchorY: meta.anchorY,
        depth: obj.pos.y + (meta.defaultDepthOffset ?? 0),
        sortOrder: 10 + i,
      });
    }

    // 2. Active Players
    const chefSpriteIds: SpriteId[] = [
      "chef_p1",
      "chef_p2",
      "chef_p3",
      "chef_p4",
    ];

    for (const player of joinedPlayers) {
      const spriteId = chefSpriteIds[player.id];
      const meta = SPRITE_METADATA[spriteId];
      const image = this.assetLoader.getImage(spriteId);

      const actionActive = player.input.action1 || player.input.action2;
      const highlightColor = actionActive
        ? player.input.action1
          ? "#38bdf8"
          : "#f43f5e"
        : undefined;

      commands.push({
        id: `player-${player.id}`,
        image,
        worldX: player.pos.x,
        worldY: player.pos.y,
        width: meta.width,
        height: meta.height,
        anchorX: meta.anchorX,
        anchorY: meta.anchorY,
        depth: player.pos.y,
        sortOrder: 50 + player.id,
        flipX: player.facing.x < -0.1,
        shadow: {
          radiusX: 18,
          radiusY: 7,
          offsetY: 2,
          opacity: 0.35,
        },
        highlightColor,
        badge: {
          text: `P${player.id + 1}`,
          color: player.color,
          offsetY: 16,
        },
      });
    }

    // Stable 2.5D depth sort and draw scene
    renderSpriteScene(ctx, this.camera, commands);

    // Render phase overlay and HUD (in screen coordinates)
    this.renderScreenHUD(ctx, state, w, h);
  }

  private renderEnvironment(
    ctx: CanvasRenderingContext2D,
    state: WorldState,
  ): void {
    const w = this.width;
    const h = this.height;

    // Outer restaurant ambiance
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, w, h);

    // Kitchen floor transformed via Camera
    const bounds = state.bounds;
    const kitchenMargin = 20;
    const kx = bounds.minX - kitchenMargin;
    const ky = bounds.minY - kitchenMargin;
    const kw = bounds.maxX - bounds.minX + kitchenMargin * 2;
    const kh = bounds.maxY - bounds.minY + kitchenMargin * 2;

    const screenFloor = this.camera.worldToScreenRect(kx, ky, kw, kh);

    // Floor base
    ctx.fillStyle = "#27272a";
    ctx.fillRect(screenFloor.x, screenFloor.y, screenFloor.w, screenFloor.h);

    // Wooden checkered floor tile grid
    ctx.save();
    ctx.beginPath();
    ctx.rect(screenFloor.x, screenFloor.y, screenFloor.w, screenFloor.h);
    ctx.clip();

    const tileSize = 32 * this.camera.zoom;
    const startX = screenFloor.x;
    const startY = screenFloor.y;

    for (let x = startX; x < startX + screenFloor.w; x += tileSize) {
      for (let y = startY; y < startY + screenFloor.h; y += tileSize) {
        const colIdx = Math.floor((x - startX) / tileSize);
        const rowIdx = Math.floor((y - startY) / tileSize);
        if ((colIdx + rowIdx) % 2 === 0) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    }

    // Floor grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = Math.max(1, 1 * this.camera.zoom);
    ctx.beginPath();
    for (let x = startX; x <= startX + screenFloor.w; x += tileSize) {
      ctx.moveTo(x, screenFloor.y);
      ctx.lineTo(x, screenFloor.y + screenFloor.h);
    }
    for (let y = startY; y <= startY + screenFloor.h; y += tileSize) {
      ctx.moveTo(screenFloor.x, y);
      ctx.lineTo(screenFloor.x + screenFloor.w, y);
    }
    ctx.stroke();
    ctx.restore();

    // Kitchen wall border
    ctx.strokeStyle = "#52525b";
    ctx.lineWidth = Math.max(2, 4 * this.camera.zoom);
    ctx.strokeRect(screenFloor.x, screenFloor.y, screenFloor.w, screenFloor.h);
  }

  private renderScreenHUD(
    ctx: CanvasRenderingContext2D,
    state: WorldState,
    w: number,
    h: number,
  ): void {
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
      // HUD preview / Debug info in top-left corner
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(16, 16, 240, 68, 6);
        ctx.fill();
      } else {
        ctx.fillRect(16, 16, 240, 68);
      }

      ctx.fillStyle = "#a7f3d0";
      ctx.font = "13px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Status: ${state.phase.toUpperCase()}`, 28, 36);
      ctx.fillText(
        `Zeit: ${state.simulationTime.toFixed(1)}s | Ticks: ${state.tickCount}`,
        28,
        54,
      );
      const joinedCount = state.players.filter((p) => p.joined).length;
      ctx.fillText(`Aktive Köche: ${joinedCount}/4`, 28, 72);
    }
  }
}
