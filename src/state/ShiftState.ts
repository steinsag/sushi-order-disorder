import { DEFAULT_SHIFT_DURATION } from "../rules/ShiftConfig";

export interface ShiftState {
  readonly totalDuration: number;
  readonly timeRemaining: number;
  readonly progress: number; // 0..1
  readonly isFinished: boolean;
}

export function createInitialShiftState(
  totalDuration: number = DEFAULT_SHIFT_DURATION,
): ShiftState {
  return {
    totalDuration,
    timeRemaining: totalDuration,
    progress: 0,
    isFinished: false,
  };
}

export function advanceShiftState(state: ShiftState, dt: number): ShiftState {
  if (state.isFinished) {
    return state;
  }

  const nextTimeRemaining = Math.max(0, state.timeRemaining - dt);
  const isFinished = nextTimeRemaining <= 0;
  const progress =
    state.totalDuration > 0
      ? Math.min(1, Math.max(0, 1 - nextTimeRemaining / state.totalDuration))
      : 1;

  return {
    totalDuration: state.totalDuration,
    timeRemaining: nextTimeRemaining,
    progress,
    isFinished,
  };
}
