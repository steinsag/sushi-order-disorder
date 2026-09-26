import type { Camera } from "./Camera";

export interface SpriteShadow {
  radiusX: number;
  radiusY: number;
  offsetY?: number;
  opacity?: number;
}

export interface SpriteRenderCommand {
  id: string;
  image?: CanvasImageSource | null;
  /** World X position of ground/foot anchor */
  worldX: number;
  /** World Y position of ground/foot anchor */
  worldY: number;
  /** Width in world units */
  width: number;
  /** Height in world units */
  height: number;
  /** Normalized anchor X (0 = left, 0.5 = center, 1 = right) */
  anchorX: number;
  /** Normalized anchor Y (0 = top, 1 = bottom / foot position) */
  anchorY: number;
  /** Override depth (defaults to worldY) */
  depth?: number;
  /** Deterministic tie-breaker for identical depth */
  sortOrder?: number;
  /** Flip horizontally */
  flipX?: boolean;
  /** Opacity from 0 to 1 */
  opacity?: number;
  /** Rotation in radians */
  rotation?: number;
  /** Ground shadow */
  shadow?: SpriteShadow;
  /** Highlight / Action ring color */
  highlightColor?: string;
  /** Badge / text label */
  badge?: {
    text: string;
    color?: string;
    offsetY?: number;
  };
}

/**
 * Deterministically sorts render commands by foot/ground depth,
 * with secondary tie-breaking by sortOrder and id.
 */
export function sortSprites(
  commands: SpriteRenderCommand[],
): SpriteRenderCommand[] {
  return [...commands].sort((a, b) => {
    const depthA = a.depth ?? a.worldY;
    const depthB = b.depth ?? b.worldY;
    if (depthA !== depthB) {
      return depthA - depthB;
    }
    const orderA = a.sortOrder ?? 0;
    const orderB = b.sortOrder ?? 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Draws a single sprite command transformed through the camera.
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  cmd: SpriteRenderCommand,
  camera: Camera,
): void {
  const screenPos = camera.worldToScreen({ x: cmd.worldX, y: cmd.worldY });
  const zoom = camera.zoom;
  const drawW = cmd.width * zoom;
  const drawH = cmd.height * zoom;

  const drawX = screenPos.x - drawW * cmd.anchorX;
  const drawY = screenPos.y - drawH * cmd.anchorY;

  // Ground shadow if requested
  if (cmd.shadow) {
    const shadowOffsetY = (cmd.shadow.offsetY ?? 2) * zoom;
    const rx = cmd.shadow.radiusX * zoom;
    const ry = cmd.shadow.radiusY * zoom;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${cmd.shadow.opacity ?? 0.25})`;
    ctx.beginPath();
    ctx.ellipse(
      screenPos.x,
      screenPos.y + shadowOffsetY,
      Math.max(1, rx),
      Math.max(1, ry),
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }

  // Highlight / Action ring
  if (cmd.highlightColor) {
    ctx.save();
    ctx.strokeStyle = cmd.highlightColor;
    ctx.lineWidth = Math.max(2, 3 * zoom);
    ctx.beginPath();
    ctx.arc(
      screenPos.x,
      screenPos.y - drawH * 0.4,
      Math.max(4, drawW * 0.55),
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.restore();
  }

  // Draw sprite image
  if (cmd.image) {
    ctx.save();
    if (cmd.opacity !== undefined && cmd.opacity < 1) {
      ctx.globalAlpha = Math.max(0, Math.min(1, cmd.opacity));
    }

    if (cmd.flipX || cmd.rotation) {
      ctx.translate(screenPos.x, screenPos.y);
      if (cmd.rotation) {
        ctx.rotate(cmd.rotation);
      }
      if (cmd.flipX) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(
        cmd.image,
        -drawW * cmd.anchorX,
        -drawH * cmd.anchorY,
        drawW,
        drawH,
      );
    } else {
      ctx.drawImage(cmd.image, drawX, drawY, drawW, drawH);
    }
    ctx.restore();
  } else {
    // Fallback colored rectangle if image is missing
    ctx.save();
    ctx.fillStyle = "#64748b";
    ctx.fillRect(drawX, drawY, drawW, drawH);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  // Badge / text
  if (cmd.badge) {
    ctx.save();
    ctx.fillStyle = cmd.badge.color ?? "#ffffff";
    ctx.font = `bold ${Math.max(10, Math.round(11 * zoom))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    const badgeY = screenPos.y + (cmd.badge.offsetY ?? 16) * zoom;
    ctx.fillText(cmd.badge.text, screenPos.x, badgeY);
    ctx.restore();
  }
}

/**
 * Sorts and draws a complete list of sprite commands.
 */
export function renderSpriteScene(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  commands: SpriteRenderCommand[],
): void {
  const sorted = sortSprites(commands);
  for (const cmd of sorted) {
    drawSprite(ctx, cmd, camera);
  }
}
