import type { PlayerIndex, PlayerInput } from "../input/PlayerInput";
import {
  createPlayerState,
  DEFAULT_KITCHEN_BOUNDS,
  type KitchenBounds,
  type PlayerState,
  updatePlayer,
} from "./PlayerState";

export type GamePhase = "loading" | "title" | "running" | "paused" | "error";

export interface WorldState {
  phase: GamePhase;
  simulationTime: number;
  tickCount: number;
  players: [PlayerState, PlayerState, PlayerState, PlayerState];
  bounds: KitchenBounds;
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
 */
export function updateWorldState(
  state: WorldState,
  dt: number,
  inputs?: readonly [PlayerInput, PlayerInput, PlayerInput, PlayerInput],
): WorldState {
  if (state.phase !== "running") {
    return state;
  }

  const updatedPlayers = state.players.map((p, i) => {
    const input = inputs ? inputs[i] : p.input;
    return updatePlayer(p, input, dt, state.bounds);
  }) as [PlayerState, PlayerState, PlayerState, PlayerState];

  return {
    ...state,
    simulationTime: state.simulationTime + dt,
    tickCount: state.tickCount + 1,
    players: updatedPlayers,
  };
}
