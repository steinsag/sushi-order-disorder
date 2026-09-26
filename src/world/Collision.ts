import { clamp, type Vec2 } from "../math/vec2";
import type { KitchenBounds } from "../state/PlayerState";
import type { ColliderAABB } from "../rules/StationConfig";

export const DEFAULT_PLAYER_RADIUS = 16;

/**
 * Checks if a circle overlaps an axis-aligned bounding box.
 */
export function checkCircleAABBOverlap(
  circlePos: Vec2,
  radius: number,
  box: ColliderAABB,
): boolean {
  const closestX = clamp(circlePos.x, box.minX, box.maxX);
  const closestY = clamp(circlePos.y, box.minY, box.maxY);

  const dx = circlePos.x - closestX;
  const dy = circlePos.y - closestY;

  return dx * dx + dy * dy < radius * radius;
}

/**
 * Resolves collision between a circle and an AABB by pushing the circle out along the collision normal.
 */
export function resolveCircleAABB(
  circlePos: Vec2,
  radius: number,
  box: ColliderAABB,
): Vec2 {
  const closestX = clamp(circlePos.x, box.minX, box.maxX);
  const closestY = clamp(circlePos.y, box.minY, box.maxY);

  const dx = circlePos.x - closestX;
  const dy = circlePos.y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= radius * radius) {
    return { ...circlePos };
  }

  // If circle center is strictly inside the box
  if (distSq < 1e-6) {
    const leftDist = circlePos.x - box.minX;
    const rightDist = box.maxX - circlePos.x;
    const topDist = circlePos.y - box.minY;
    const bottomDist = box.maxY - circlePos.y;

    const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);

    if (minDist === leftDist) {
      return { x: box.minX - radius, y: circlePos.y };
    } else if (minDist === rightDist) {
      return { x: box.maxX + radius, y: circlePos.y };
    } else if (minDist === topDist) {
      return { x: circlePos.x, y: box.minY - radius };
    } else {
      return { x: circlePos.x, y: box.maxY + radius };
    }
  }

  const dist = Math.sqrt(distSq);
  const penetration = radius - dist;
  const normalX = dx / dist;
  const normalY = dy / dist;

  return {
    x: circlePos.x + normalX * penetration,
    y: circlePos.y + normalY * penetration,
  };
}

/**
 * Moves a circle with smooth sliding along obstacle colliders and kitchen bounds.
 * Uses adaptive substepping to prevent tunneling on large dt steps.
 */
export function moveAndSlide(
  currentPos: Vec2,
  moveDelta: Vec2,
  radius: number,
  obstacles: readonly ColliderAABB[],
  bounds: KitchenBounds,
): { pos: Vec2; vel: Vec2 } {
  const dist = Math.hypot(moveDelta.x, moveDelta.y);
  const maxStep = Math.max(2, radius * 0.5);
  const steps = Math.max(1, Math.ceil(dist / maxStep));

  let posX = currentPos.x;
  let posY = currentPos.y;
  const stepX = moveDelta.x / steps;
  const stepY = moveDelta.y / steps;

  for (let s = 0; s < steps; s++) {
    // 1. Move and resolve on X axis
    posX = clamp(posX + stepX, bounds.minX, bounds.maxX);
    for (const obs of obstacles) {
      const resolved = resolveCircleAABB({ x: posX, y: posY }, radius, obs);
      posX = resolved.x;
      posY = resolved.y;
    }

    // 2. Move and resolve on Y axis
    posY = clamp(posY + stepY, bounds.minY, bounds.maxY);
    for (const obs of obstacles) {
      const resolved = resolveCircleAABB({ x: posX, y: posY }, radius, obs);
      posX = resolved.x;
      posY = resolved.y;
    }

    // 3. Final safety clamp & obstacle pass
    posX = clamp(posX, bounds.minX, bounds.maxX);
    posY = clamp(posY, bounds.minY, bounds.maxY);
    for (const obs of obstacles) {
      const resolved = resolveCircleAABB({ x: posX, y: posY }, radius, obs);
      posX = clamp(resolved.x, bounds.minX, bounds.maxX);
      posY = clamp(resolved.y, bounds.minY, bounds.maxY);
    }
  }

  return {
    pos: { x: posX, y: posY },
    vel: {
      x: dtSafeVel(posX - currentPos.x),
      y: dtSafeVel(posY - currentPos.y),
    },
  };
}

function dtSafeVel(v: number): number {
  return Math.abs(v) < 1e-6 ? 0 : v;
}
