import type { Vec2 } from "../math/vec2";
import type { SpriteId } from "../render/SpriteAssets";

export type StationType =
  "order" | "rice" | "fridge" | "roll" | "delivery" | "counter";

export interface ColliderAABB {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface StationDefinition {
  id: string;
  type: StationType;
  label: string;
  spriteId: SpriteId;
  pos: Vec2; // Ground/foot anchor in world coordinates
  interactionPoint: Vec2; // World coordinates used for distance and line-of-sight targeting
  interactionRadius: number; // Maximum reach radius in world pixels
  collider: ColliderAABB;
  isInteractable: boolean;
}

export const DEFAULT_INTERACTION_RADIUS = 72; // World pixels
