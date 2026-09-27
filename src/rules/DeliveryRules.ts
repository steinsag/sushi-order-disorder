import type { PlateItem } from "../state/ItemState";
import type { ActiveOrder } from "../state/OrderState";
import type { DeliveryFeedbackType } from "../state/ScoreState";
import type { RecipeId } from "./RecipeConfig";
import { getRecipeDefinition } from "./RecipeConfig";
import {
  calculateDeliveryScore,
  getWrongDeliveryPenalty,
} from "./ScoringConfig";

export interface DeliveryEvaluationResult {
  readonly type: DeliveryFeedbackType;
  readonly matchedOrder: ActiveOrder | null;
  readonly scoreDelta: number;
  readonly recipeId: RecipeId;
  readonly isExpress: boolean;
}

export interface DeliveryOutcome {
  readonly result: DeliveryEvaluationResult;
  readonly updatedActiveOrders: readonly ActiveOrder[];
}

/**
 * Evaluates a carried plate against active kitchen orders at the delivery station.
 * Correct on-time orders award full points, late orders award reduced points,
 * and unmatched/wrong plates incur a penalty.
 */
export function evaluateDelivery(
  carriedPlate: PlateItem,
  activeOrders: readonly ActiveOrder[],
): DeliveryOutcome {
  // 1. Search for an on-time matching order (lowest timeRemaining first, then express)
  const onTimeMatches = activeOrders
    .filter(
      (o) =>
        o.recipeId === carriedPlate.recipeId &&
        o.status === "active" &&
        o.timeRemaining > 0,
    )
    .sort((a, b) => {
      const timeDiff = a.timeRemaining - b.timeRemaining;
      if (Math.abs(timeDiff) > 0.001) {
        return timeDiff;
      }
      return (b.isExpress ? 1 : 0) - (a.isExpress ? 1 : 0);
    });

  if (onTimeMatches.length > 0) {
    const matchedOrder = onTimeMatches[0];
    const recipe = getRecipeDefinition(matchedOrder.recipeId);
    const scoreDelta = calculateDeliveryScore(
      recipe,
      true,
      matchedOrder.isExpress,
    );
    return {
      result: {
        type: "success",
        matchedOrder,
        scoreDelta,
        recipeId: recipe.id,
        isExpress: matchedOrder.isExpress,
      },
      updatedActiveOrders: activeOrders.filter((o) => o.id !== matchedOrder.id),
    };
  }

  // 2. Search for an expired / late matching order
  const lateMatches = activeOrders
    .filter(
      (o) =>
        o.recipeId === carriedPlate.recipeId &&
        (o.status === "expired" || o.timeRemaining <= 0),
    )
    .sort((a, b) => (b.isExpress ? 1 : 0) - (a.isExpress ? 1 : 0));

  if (lateMatches.length > 0) {
    const matchedOrder = lateMatches[0];
    const recipe = getRecipeDefinition(matchedOrder.recipeId);
    const scoreDelta = calculateDeliveryScore(
      recipe,
      false,
      matchedOrder.isExpress,
    );
    return {
      result: {
        type: "late",
        matchedOrder,
        scoreDelta,
        recipeId: recipe.id,
        isExpress: matchedOrder.isExpress,
      },
      updatedActiveOrders: activeOrders.filter((o) => o.id !== matchedOrder.id),
    };
  }

  // 3. No matching order found: wrong dish penalty
  const recipe = getRecipeDefinition(carriedPlate.recipeId);
  const penalty = getWrongDeliveryPenalty();
  return {
    result: {
      type: "wrong",
      matchedOrder: null,
      scoreDelta: -penalty,
      recipeId: recipe.id,
      isExpress: false,
    },
    updatedActiveOrders: activeOrders,
  };
}
