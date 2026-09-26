import chefP1Url from "../assets/sprites/chef_p1.svg";
import chefP2Url from "../assets/sprites/chef_p2.svg";
import chefP3Url from "../assets/sprites/chef_p3.svg";
import chefP4Url from "../assets/sprites/chef_p4.svg";
import counterUrl from "../assets/sprites/counter.svg";
import stationOrderUrl from "../assets/sprites/station_order.svg";
import stationRiceUrl from "../assets/sprites/station_rice.svg";
import stationFridgeUrl from "../assets/sprites/station_fridge.svg";
import stationRollUrl from "../assets/sprites/station_roll.svg";
import stationDeliveryUrl from "../assets/sprites/station_delivery.svg";

export interface SpriteMetadata {
  width: number;
  height: number;
  /** Normalized X anchor (0 = left, 0.5 = center, 1 = right) */
  anchorX: number;
  /** Normalized Y anchor (0 = top, 1 = bottom / foot position) */
  anchorY: number;
  /** Optional depth offset relative to ground position */
  defaultDepthOffset?: number;
}

export type SpriteId =
  | "chef_p1"
  | "chef_p2"
  | "chef_p3"
  | "chef_p4"
  | "counter"
  | "station_order"
  | "station_rice"
  | "station_fridge"
  | "station_roll"
  | "station_delivery";

export const SPRITE_URLS: Record<SpriteId, string> = {
  chef_p1: chefP1Url,
  chef_p2: chefP2Url,
  chef_p3: chefP3Url,
  chef_p4: chefP4Url,
  counter: counterUrl,
  station_order: stationOrderUrl,
  station_rice: stationRiceUrl,
  station_fridge: stationFridgeUrl,
  station_roll: stationRollUrl,
  station_delivery: stationDeliveryUrl,
};

export const SPRITE_METADATA: Record<SpriteId, SpriteMetadata> = {
  // Player chefs are 48x48 on screen, foot anchor at bottom-center (0.5, 0.95)
  chef_p1: { width: 48, height: 48, anchorX: 0.5, anchorY: 0.95 },
  chef_p2: { width: 48, height: 48, anchorX: 0.5, anchorY: 0.95 },
  chef_p3: { width: 48, height: 48, anchorX: 0.5, anchorY: 0.95 },
  chef_p4: { width: 48, height: 48, anchorX: 0.5, anchorY: 0.95 },

  // Kitchen stations and counters are 96x64, foot anchor at bottom-center (0.5, 0.9)
  counter: { width: 96, height: 64, anchorX: 0.5, anchorY: 0.9 },
  station_order: { width: 96, height: 64, anchorX: 0.5, anchorY: 0.9 },
  station_rice: { width: 96, height: 64, anchorX: 0.5, anchorY: 0.9 },
  station_fridge: { width: 96, height: 64, anchorX: 0.5, anchorY: 0.9 },
  station_roll: { width: 96, height: 64, anchorX: 0.5, anchorY: 0.9 },
  station_delivery: { width: 96, height: 64, anchorX: 0.5, anchorY: 0.9 },
};
