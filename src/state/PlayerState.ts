import { type Vec2 } from "../math/vec2";
import {
  type PlayerIndex,
  type PlayerInput,
  createNeutralPlayerInput,
} from "../input/PlayerInput";
import { DEFAULT_PLAYER_RADIUS, moveAndSlide } from "../world/Collision";
import type { ColliderAABB } from "../rules/StationConfig";

export const DEFAULT_PLAYER_SPEED = 240; // World pixels per second

export const PLAYER_COLORS: readonly [string, string, string, string] = [
  "#38bdf8", // P1: Cyan / Sky Blue
  "#fb923c", // P2: Orange
  "#4ade80", // P3: Lime / Green
  "#c084fc", // P4: Purple
] as const;

export interface KitchenBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const DEFAULT_KITCHEN_BOUNDS: KitchenBounds = {
  minX: 64,
  maxX: 896,
  minY: 64,
  maxY: 476,
};

export const DEFAULT_SPAWN_POSITIONS: readonly [Vec2, Vec2, Vec2, Vec2] = [
  { x: 280, y: 260 },
  { x: 680, y: 260 },
  { x: 280, y: 360 },
  { x: 680, y: 360 },
] as const;

export interface PlayerState {
  id: PlayerIndex;
  joined: boolean;
  pos: Vec2;
  vel: Vec2;
  facing: Vec2;
  speed: number;
  radius: number;
  color: string;
  input: PlayerInput;
  targetStationId?: string | null;
}

export function createPlayerState(
  id: PlayerIndex,
  joined = false,
  pos?: Vec2,
): PlayerState {
  return {
    id,
    joined,
    pos: pos ? { ...pos } : { ...DEFAULT_SPAWN_POSITIONS[id] },
    vel: { x: 0, y: 0 },
    facing: { x: 0, y: 1 }, // Default facing downwards
    speed: DEFAULT_PLAYER_SPEED,
    radius: DEFAULT_PLAYER_RADIUS,
    color: PLAYER_COLORS[id],
    input: createNeutralPlayerInput(),
    targetStationId: null,
  };
}

export function updatePlayer(
  player: PlayerState,
  input: PlayerInput,
  dt: number,
  bounds: KitchenBounds = DEFAULT_KITCHEN_BOUNDS,
  obstacles: readonly ColliderAABB[] = [],
): PlayerState {
  if (!player.joined) {
    return {
      ...player,
      vel: { x: 0, y: 0 },
      input: createNeutralPlayerInput(),
      targetStationId: null,
    };
  }

  const vx = input.move.x * player.speed;
  const vy = input.move.y * player.speed;

  let facing = player.facing;
  if (input.move.x !== 0 || input.move.y !== 0) {
    facing = { x: input.move.x, y: input.move.y };
  }

  const moveDelta: Vec2 = { x: vx * dt, y: vy * dt };
  const { pos: nextPos, vel: actualVel } = moveAndSlide(
    player.pos,
    moveDelta,
    player.radius ?? DEFAULT_PLAYER_RADIUS,
    obstacles,
    bounds,
  );

  return {
    ...player,
    pos: nextPos,
    vel: dt > 0 ? { x: actualVel.x / dt, y: actualVel.y / dt } : { x: 0, y: 0 },
    facing,
    input,
  };
}
