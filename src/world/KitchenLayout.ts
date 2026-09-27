import type { ColliderAABB, StationDefinition } from "../rules/StationConfig";
import { DEFAULT_INTERACTION_RADIUS } from "../rules/StationConfig";

export function createStationCollider(
  posX: number,
  posY: number,
  halfWidth = 44,
  height = 46,
): ColliderAABB {
  return {
    minX: posX - halfWidth,
    maxX: posX + halfWidth,
    minY: posY - height + 6,
    maxY: posY + 6,
  };
}

export const DEFAULT_STATIONS: readonly StationDefinition[] = [
  {
    id: "station-order",
    type: "order",
    label: "Bestellannahme",
    spriteId: "station_order",
    pos: { x: 160, y: 440 },
    interactionPoint: { x: 160, y: 410 },
    interactionRadius: DEFAULT_INTERACTION_RADIUS,
    collider: createStationCollider(160, 440),
    isInteractable: true,
  },
  {
    id: "station-rice",
    type: "rice",
    label: "Reiskocher",
    spriteId: "station_rice",
    pos: { x: 380, y: 110 },
    interactionPoint: { x: 380, y: 120 },
    interactionRadius: DEFAULT_INTERACTION_RADIUS,
    collider: createStationCollider(380, 110),
    isInteractable: true,
  },
  {
    id: "station-fridge",
    type: "fridge",
    label: "Kühlschrank",
    spriteId: "station_fridge",
    pos: { x: 600, y: 110 },
    interactionPoint: { x: 600, y: 120 },
    interactionRadius: DEFAULT_INTERACTION_RADIUS,
    collider: createStationCollider(600, 110),
    isInteractable: true,
  },
  {
    id: "counter-island",
    type: "counter",
    label: "Arbeitsfläche",
    spriteId: "counter",
    pos: { x: 480, y: 280 },
    interactionPoint: { x: 480, y: 280 },
    interactionRadius: DEFAULT_INTERACTION_RADIUS,
    collider: createStationCollider(480, 280),
    isInteractable: true,
  },
  {
    id: "station-roll-1",
    type: "roll",
    label: "Rollstation 1",
    spriteId: "station_roll",
    pos: { x: 380, y: 440 },
    interactionPoint: { x: 380, y: 410 },
    interactionRadius: DEFAULT_INTERACTION_RADIUS,
    collider: createStationCollider(380, 440),
    isInteractable: true,
  },
  {
    id: "station-roll-2",
    type: "roll",
    label: "Rollstation 2",
    spriteId: "station_roll",
    pos: { x: 570, y: 440 },
    interactionPoint: { x: 570, y: 410 },
    interactionRadius: DEFAULT_INTERACTION_RADIUS,
    collider: createStationCollider(570, 440),
    isInteractable: true,
  },
  {
    id: "station-delivery",
    type: "delivery",
    label: "Ausgabe",
    spriteId: "station_delivery",
    pos: { x: 760, y: 440 },
    interactionPoint: { x: 760, y: 410 },
    interactionRadius: DEFAULT_INTERACTION_RADIUS,
    collider: createStationCollider(760, 440),
    isInteractable: true,
  },
] as const;

export function getStationColliders(
  stations: readonly StationDefinition[] = DEFAULT_STATIONS,
): ColliderAABB[] {
  return stations.map((s) => s.collider);
}
