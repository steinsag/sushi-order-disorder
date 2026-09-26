export type GamePhase = "loading" | "title" | "running" | "paused" | "error";

export interface WorldState {
  phase: GamePhase;
  simulationTime: number;
  tickCount: number;
  errorMessage?: string;
}

export function createInitialWorldState(): WorldState {
  return {
    phase: "title",
    simulationTime: 0,
    tickCount: 0,
  };
}

/**
 * Pure simulation update function, independent of DOM or wall clock.
 */
export function updateWorldState(state: WorldState, dt: number): WorldState {
  if (state.phase !== "running") {
    return state;
  }

  return {
    ...state,
    simulationTime: state.simulationTime + dt,
    tickCount: state.tickCount + 1,
  };
}
