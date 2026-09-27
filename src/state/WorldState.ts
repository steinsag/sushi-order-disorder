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
import type { DroppedItem } from "./ItemState";
import {
  createInitialCounterState,
  createInitialFridgeState,
  createInitialRiceCookerState,
  createInitialRollStationState,
  type CounterStationState,
  type FridgeStationState,
  type RiceCookerStationState,
  type RollStationState,
} from "./StationState";
import {
  type ActiveOrder,
  createInitialOrderStationState,
  type OrderStationState,
} from "./OrderState";
import { createInitialScoreState, type ScoreState } from "./ScoreState";
import {
  advanceShiftState,
  createInitialShiftState,
  type ShiftState,
} from "./ShiftState";
import {
  advanceStationTimers,
  processPlayerInteractions,
} from "../rules/InteractionRules";

export type GamePhase =
  "loading" | "title" | "running" | "paused" | "completed" | "error";

export interface WorldState {
  phase: GamePhase;
  simulationTime: number;
  tickCount: number;
  players: [PlayerState, PlayerState, PlayerState, PlayerState];
  bounds: KitchenBounds;
  stations: readonly StationDefinition[];
  obstacles: readonly ColliderAABB[];
  orderStation: OrderStationState;
  activeOrders: readonly ActiveOrder[];
  scoreState: ScoreState;
  shift: ShiftState;
  riceCooker: RiceCookerStationState;
  fridge: FridgeStationState;
  rollStation: RollStationState;
  rollStations: Record<string, RollStationState>;
  counters: Record<string, CounterStationState>;
  droppedItems: readonly DroppedItem[];
  errorMessage?: string;
}

export function createInitialWorldState(
  customShiftDuration?: number,
): WorldState {
  const initialRoll1 = createInitialRollStationState();
  const initialRoll2 = createInitialRollStationState();
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
    orderStation: createInitialOrderStationState(),
    activeOrders: [],
    scoreState: createInitialScoreState(),
    shift: createInitialShiftState(customShiftDuration),
    riceCooker: createInitialRiceCookerState(),
    fridge: createInitialFridgeState(),
    rollStation: initialRoll1,
    rollStations: {
      "station-roll-1": initialRoll1,
      "station-roll-2": initialRoll2,
      "station-roll": initialRoll1,
    },
    counters: {
      "counter-island": createInitialCounterState(),
    },
    droppedItems: [],
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

  // Advance shift timer first
  const updatedShift = advanceShiftState(state.shift, dt);
  if (updatedShift.isFinished) {
    return {
      ...state,
      shift: updatedShift,
      phase: "completed",
    };
  }

  const runningState: WorldState = {
    ...state,
    shift: updatedShift,
  };

  // 1. Advance station timers (e.g. rice cooking progress)
  let updatedState = advanceStationTimers(runningState, dt);

  // 2. Update player positions, velocities, and facing directions with obstacles & boundaries
  const updatedPlayers = updatedState.players.map((p, i) => {
    const input = inputs ? inputs[i] : p.input;
    const moved = updatePlayer(
      p,
      input,
      dt,
      updatedState.bounds,
      updatedState.obstacles,
    );

    // Determine unambiguous interaction target for active players
    const target = findInteractionTarget(moved, updatedState.stations);
    return {
      ...moved,
      targetStationId: target ? target.id : null,
    };
  }) as [PlayerState, PlayerState, PlayerState, PlayerState];

  updatedState = {
    ...updatedState,
    simulationTime: updatedState.simulationTime + dt,
    tickCount: updatedState.tickCount + 1,
    players: updatedPlayers,
  };

  // 3. Process player interactions in deterministic slot order (0 -> 1 -> 2 -> 3)
  for (let slot = 0; slot < 4; slot++) {
    updatedState = processPlayerInteractions(updatedState, slot as PlayerIndex);
  }

  return updatedState;
}
