import type { WorldState } from "../state/WorldState";
import { Camera } from "./Camera";
import { AssetLoader } from "./AssetLoader";
import {
  type SpriteProgressBar,
  type SpriteRenderCommand,
  renderSpriteScene,
} from "./SpriteRenderer";
import { SPRITE_METADATA, SPRITE_URLS, type SpriteId } from "./SpriteAssets";
import type { Vec2 } from "../math/vec2";
import { DEFAULT_STATIONS } from "../world/KitchenLayout";
import { INGREDIENT_METADATA } from "../rules/IngredientConfig";
import { findMatchingRecipe, getRecipeDefinition } from "../rules/RecipeConfig";
import { getFridgeIngredientForPlayerPos } from "../rules/InteractionRules";
import type { Item } from "../state/ItemState";

function getItemDisplay(item: Item): { emoji: string; label: string } {
  if (item.type === "plate") {
    const recipe = getRecipeDefinition(item.recipeId);
    return { emoji: recipe.emoji, label: recipe.name };
  }
  const ingMeta = INGREDIENT_METADATA[item.ingredient];
  return { emoji: ingMeta.emoji, label: ingMeta.label };
}

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

export const DEFAULT_KITCHEN_OBJECTS: readonly KitchenObject[] =
  DEFAULT_STATIONS.map((s) => ({
    id: s.id,
    spriteId: s.spriteId,
    pos: s.pos,
  }));

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
    const stationsToRender: readonly {
      id: string;
      spriteId: SpriteId;
      pos: Vec2;
    }[] =
      state.stations && state.stations.length > 0
        ? state.stations
        : this.kitchenObjects;

    for (let i = 0; i < stationsToRender.length; i++) {
      const obj = stationsToRender[i];
      const meta = SPRITE_METADATA[obj.spriteId];
      const image = this.assetLoader.getImage(obj.spriteId);

      const targetingPlayers = joinedPlayers.filter(
        (p) => p.targetStationId === obj.id,
      );
      const isTargeted = targetingPlayers.length > 0;
      const highlightColor = isTargeted ? targetingPlayers[0].color : undefined;
      const targetPrefix = isTargeted
        ? targetingPlayers.map((p) => `P${p.id + 1}`).join(" ") + " "
        : "";

      let stationText = "";
      let stationProgressBar: SpriteProgressBar | undefined = undefined;

      if (obj.id === "station-order" && state.orderStation) {
        if (state.orderStation.pendingOrder) {
          stationText = isTargeted
            ? "🛎️ Annehmen (Akt1)"
            : "🛎️ Neue Bestellung!";
        } else {
          stationText = "Keine neue Bestellung";
        }
      } else if (obj.id === "station-rice" && state.riceCooker) {
        const rc = state.riceCooker;
        if (rc.state === "cooking") {
          stationText = `♨️ Kocht... (${rc.cookTimeRemaining.toFixed(1)}s)`;
          stationProgressBar = {
            progress: rc.cookingProgress,
            label: `♨️ ${rc.cookTimeRemaining.toFixed(1)}s`,
            fillColor: "#f59e0b",
            bgColor: "#27272a",
            borderColor: "rgba(255, 255, 255, 0.4)",
            offsetY: -56,
            width: 72,
            height: 12,
          };
        } else if (rc.state === "ready" && rc.portions > 0) {
          const portionDots =
            "●".repeat(rc.portions) + "○".repeat(rc.maxPortions - rc.portions);
          stationText = isTargeted
            ? `🍚 Nehmen (Akt1) [${portionDots}]`
            : `🍚 Reis [${portionDots}] (${rc.portions}/${rc.maxPortions})`;
        } else {
          stationText = isTargeted
            ? "🍚 Kochen starten (Akt1)"
            : "🍚 Reiskocher leer (Akt1)";
        }
      } else if (obj.id === "station-roll" && state.rollStation) {
        const rs = state.rollStation;
        if (rs.state === "rolling" && rs.rollingRecipeId) {
          const recipe = getRecipeDefinition(rs.rollingRecipeId);
          stationText = `🔄 Rollt ${recipe.name}... (${rs.rollingTimeRemaining.toFixed(1)}s)`;
          stationProgressBar = {
            progress: rs.rollingProgress,
            label: `🔄 ${rs.rollingTimeRemaining.toFixed(1)}s`,
            fillColor: "#38bdf8",
            bgColor: "#27272a",
            borderColor: "rgba(255, 255, 255, 0.4)",
            offsetY: -56,
            width: 72,
            height: 12,
          };
        } else if (rs.items.length > 0) {
          const matchingRecipe = findMatchingRecipe(rs.items);
          if (matchingRecipe) {
            const itemIcons = rs.items
              .map((item) => getItemDisplay(item).emoji)
              .join(" ");
            stationText = isTargeted
              ? `🍱 ${matchingRecipe.name} rollen (Akt1)`
              : `[ ${itemIcons} ] ✨ Bereit zum Rollen`;
          } else {
            const hasPlate = rs.items.some((i) => i.type === "plate");
            const itemIcons = rs.items
              .map((item) => getItemDisplay(item).emoji)
              .join(" ");
            stationText = isTargeted
              ? hasPlate
                ? `🍽️ Teller nehmen (Akt1)`
                : `[ ${itemIcons} ] Nehmen (Akt1)`
              : `[ ${itemIcons} ]`;
          }
        }
      } else if (
        obj.id === "counter-island" &&
        state.counters?.["counter-island"]
      ) {
        const counterItems = state.counters["counter-island"].items;
        if (counterItems.length > 0) {
          const itemIcons = counterItems
            .map((item) => getItemDisplay(item).emoji)
            .join(" ");
          stationText = `[ ${itemIcons} ]`;
        }
      } else if (obj.id === "station-fridge") {
        if (isTargeted) {
          const firstTargetPlayer = targetingPlayers[0];
          const targetedIng = getFridgeIngredientForPlayerPos(
            firstTargetPlayer.pos,
            obj.pos,
          );
          stationText = `${INGREDIENT_METADATA[targetedIng].emoji} ${INGREDIENT_METADATA[targetedIng].label}`;
        }
      }

      const badgeOffsetY = stationProgressBar ? -74 : -54;
      const badgeText = (targetPrefix + stationText).trim();

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
        highlightColor,
        progressBar: stationProgressBar,
        badge: badgeText
          ? {
              text: badgeText,
              color:
                highlightColor ?? (stationProgressBar ? "#fbbf24" : "#f8fafc"),
              offsetY: badgeOffsetY,
            }
          : undefined,
      });
    }

    // 2. Dropped Items on Floor
    if (state.droppedItems) {
      for (let j = 0; j < state.droppedItems.length; j++) {
        const dropped = state.droppedItems[j];
        const display = getItemDisplay(dropped.item);
        commands.push({
          id: dropped.id,
          worldX: dropped.pos.x,
          worldY: dropped.pos.y,
          width: 24,
          height: 24,
          anchorX: 0.5,
          anchorY: 0.8,
          depth: dropped.pos.y - 1,
          sortOrder: 30 + j,
          shadow: {
            radiusX: 10,
            radiusY: 4,
            offsetY: 2,
            opacity: 0.3,
          },
          badge: {
            text: `${display.emoji} ${display.label}`,
            color: "#ffffff",
            offsetY: -16,
          },
        });
      }
    }

    // 3. Active Players & Carried Items
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

      const playerBadge = player.carriedItem
        ? `P${player.id + 1}: ${getItemDisplay(player.carriedItem).emoji} ${getItemDisplay(player.carriedItem).label}`
        : `P${player.id + 1}`;

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
          text: playerBadge,
          color: player.carriedItem ? "#fef08a" : player.color,
          offsetY: player.carriedItem ? -42 : 16,
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
      ctx.fillText("Lade Sushi Order Disorder...", w / 2, h / 2);
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
      ctx.fillText("SUSHI ORDER DISORDER", w / 2, h / 2 - 40);

      ctx.fillStyle = "#9ca3af";
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText("Küche bereit – Klicke auf Start", w / 2, h / 2);
    } else if (state.phase === "running" || state.phase === "paused") {
      // HUD preview / info in top-left corner
      const joined = state.players.filter((p) => p.joined);
      const hudHeight = 58 + joined.length * 18;

      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(16, 16, 260, hudHeight, 6);
        ctx.fill();
      } else {
        ctx.fillRect(16, 16, 260, hudHeight);
      }

      ctx.fillStyle = "#a7f3d0";
      ctx.font = "13px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Status: ${state.phase.toUpperCase()}`, 28, 36);
      ctx.fillText(
        `Zeit: ${state.simulationTime.toFixed(1)}s | Ticks: ${state.tickCount}`,
        28,
        52,
      );

      for (let i = 0; i < joined.length; i++) {
        const p = joined[i];
        const itemText = p.carriedItem
          ? `${getItemDisplay(p.carriedItem).emoji} ${getItemDisplay(p.carriedItem).label}`
          : "leer";
        ctx.fillStyle = p.color;
        ctx.fillText(`P${p.id + 1}: ${itemText}`, 28, 70 + i * 18);
      }
    }
  }
}
