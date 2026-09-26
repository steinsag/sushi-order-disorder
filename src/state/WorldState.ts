import type { PlayerIndex, PlayerInput } from "../input/PlayerInput";
import {
  createPlayerState,
  DEFAULT_KITCHEN_BOUNDS,
  type KitchenBounds,
  type PlayerState,
  updatePlayer,
} from "./PlayerState";
import type { ColliderAABB, StationDefinition } from "../rules/StationConfig";
import { DEFAULT_STATIONS, getStationColliders } from "../world/KitchenLayout";
import { findInteractionTarget } from "../world/Interaction";

export type GamePhase = "loading" | "title" | "running" | "paused" | "error";

export interface WorldState {
  phase: GamePhase;
  simulationTime: number;
  tickCount: number;
  players: [PlayerState, PlayerState, PlayerState, PlayerState];
  bounds: KitchenBounds;
  stations: readonly StationDefinition[];
  obstacles: readonly ColliderAABB[];
  errorMessage?: string;
}

export function createInitialWorldState(): WorldState {
  return {
    phase: "title",
    simulationTime: 0,
    tickCount: 0,
    players: [
      createPlayerState(0, true), // P1 starts joined by default
      createPlayerState(1, true), // P2 starts joined by default
      createPlayerState(2, false), // P3 available to join
      createPlayerState(3, false), // P4 available to join
    ],
    bounds: DEFAULT_KITCHEN_BOUNDS,
    stations: DEFAULT_STATIONS,
    obstacles: getStationColliders(DEFAULT_STATIONS),
  };
}

export function setPlayerJoined(
  state: WorldState,
  slot: PlayerIndex,
  joined: boolean,
): WorldState {
  const newPlayers = [...state.players] as [
    PlayerState,
    PlayerState,
    PlayerState,
    PlayerState,
  ];
  newPlayers[slot] = {
    ...newPlayers[slot],
    joined,
  };
  return {
    ...state,
    players: newPlayers,
  };
}

/**
 * Pure simulation update function, independent of DOM or wall clock.
 * Simultaneous actions and target calculations are processed deterministically in player slot order (0 -> 1 -> 2 -> 3).
 */
export function updateWorldState(
  state: WorldState,
  dt: number,
  inputs?: readonly [PlayerInput, PlayerInput, PlayerInput, PlayerInput],
): WorldState {
  if (state.phase !== "running") {
    return state;
  }

  // 1. Update player positions, velocities, and facing directions with obstacles & boundaries
  const updatedPlayers = state.players.map((p, i) => {
    const input = inputs ? inputs[i] : p.input;
    const moved = updatePlayer(p, input, dt, state.bounds, state.obstacles);

    // 2. Determine unambiguous interaction target for active players
    const target = findInteractionTarget(moved, state.stations);
    return {
      ...moved,
      targetStationId: target ? target.id : null,
    };
  }) as [PlayerState, PlayerState, PlayerState, PlayerState];

  return {
    ...state,
    simulationTime: state.simulationTime + dt,
    tickCount: state.tickCount + 1,
    players: updatedPlayers,
  };
}
