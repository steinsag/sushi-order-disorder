import type { RecipeDefinition } from "./RecipeConfig";

/**
 * Balance configuration for scoring, bonuses, penalties, and UI feedback.
 * These are initial balance parameters for MVP and can be tuned.
 */
export const SCORING_CONFIG = {
  /** Multiplier for deliveries completed after the timer expired */
  lateDeliveryMultiplier: 0.5,
  /** Penalty points deducted for delivering an incorrect plate */
  wrongDeliveryPenalty: 20,
  /** Multiplier for express priority orders delivered on-time */
  expressBonusMultiplier: 1.5,
  /** Minimum points awarded for a late delivery */
  minLatePoints: 10,
  /** Duration (seconds) for delivery feedback toasts in the HUD */
  feedbackDisplayDuration: 3.0,
} as const;

/**
 * Calculates the score delta for delivering a recipe plate.
 */
export function calculateDeliveryScore(
  recipe: RecipeDefinition,
  isOnTime: boolean,
  isExpress = false,
): number {
  if (isOnTime) {
    let points = recipe.basePoints;
    if (isExpress) {
      points = Math.round(points * SCORING_CONFIG.expressBonusMultiplier);
    }
    return points;
  }

  return Math.max(
    SCORING_CONFIG.minLatePoints,
    Math.round(recipe.basePoints * SCORING_CONFIG.lateDeliveryMultiplier),
  );
}

/**
 * Returns the penalty points for an incorrect delivery.
 */
export function getWrongDeliveryPenalty(): number {
  return SCORING_CONFIG.wrongDeliveryPenalty;
}
