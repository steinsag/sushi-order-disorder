import type { RecipeId } from "../rules/RecipeConfig";
import { SCORING_CONFIG } from "../rules/ScoringConfig";

export type DeliveryFeedbackType = "success" | "late" | "wrong";

export interface DeliveryFeedback {
  readonly id: string;
  readonly type: DeliveryFeedbackType;
  readonly scoreDelta: number;
  readonly timeRemaining: number;
  readonly recipeId: RecipeId;
  readonly isExpress: boolean;
}

export interface ScoreState {
  readonly totalScore: number;
  readonly completedOrders: number;
  readonly onTimeOrders: number;
  readonly lateOrders: number;
  readonly wrongDeliveries: number;
  readonly recentFeedback: DeliveryFeedback | null;
}

let feedbackIdCounter = 1;

export function resetFeedbackCounterForTest(): void {
  feedbackIdCounter = 1;
}

export function createInitialScoreState(): ScoreState {
  return {
    totalScore: 0,
    completedOrders: 0,
    onTimeOrders: 0,
    lateOrders: 0,
    wrongDeliveries: 0,
    recentFeedback: null,
  };
}

export function advanceScoreState(state: ScoreState, dt: number): ScoreState {
  if (!state.recentFeedback) {
    return state;
  }

  const nextTimer = state.recentFeedback.timeRemaining - dt;
  if (nextTimer <= 0) {
    return {
      ...state,
      recentFeedback: null,
    };
  }

  return {
    ...state,
    recentFeedback: {
      ...state.recentFeedback,
      timeRemaining: nextTimer,
    },
  };
}

export function applyDeliveryFeedback(
  state: ScoreState,
  type: DeliveryFeedbackType,
  scoreDelta: number,
  recipeId: RecipeId,
  isExpress: boolean,
  displayDuration: number = SCORING_CONFIG.feedbackDisplayDuration,
): ScoreState {
  const nextScore = Math.max(0, state.totalScore + scoreDelta);
  const isSuccess = type === "success";
  const isLate = type === "late";
  const isWrong = type === "wrong";

  return {
    totalScore: nextScore,
    completedOrders: state.completedOrders + (isSuccess || isLate ? 1 : 0),
    onTimeOrders: state.onTimeOrders + (isSuccess ? 1 : 0),
    lateOrders: state.lateOrders + (isLate ? 1 : 0),
    wrongDeliveries: state.wrongDeliveries + (isWrong ? 1 : 0),
    recentFeedback: {
      id: `feedback-${feedbackIdCounter++}`,
      type,
      scoreDelta,
      timeRemaining: displayDuration,
      recipeId,
      isExpress,
    },
  };
}
