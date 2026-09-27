import type { RecipeId } from "./RecipeConfig";
import type { ScoreState } from "../state/ScoreState";

export const DEFAULT_SHIFT_DURATION = 120; // 120 seconds per shift (2 minutes)

export interface ShiftProgression {
  readonly phaseName: "warmup" | "rush" | "peak";
  readonly availableRecipes: readonly RecipeId[];
  readonly maxActiveOrders: number;
  readonly expressChance: number;
  readonly orderSpawnDelay: number;
  readonly orderPatienceMultiplier: number;
}

export const SHIFT_PROGRESSION_TIERS = {
  warmup: {
    phaseName: "warmup" as const,
    availableRecipes: ["salmon-nigiri", "cucumber-maki"] as readonly RecipeId[],
    maxActiveOrders: 2,
    expressChance: 0.0,
    orderSpawnDelay: 4.5,
    orderPatienceMultiplier: 1.2,
  },
  rush: {
    phaseName: "rush" as const,
    availableRecipes: [
      "salmon-nigiri",
      "cucumber-maki",
      "salmon-maki",
    ] as readonly RecipeId[],
    maxActiveOrders: 3,
    expressChance: 0.2,
    orderSpawnDelay: 3.5,
    orderPatienceMultiplier: 1.0,
  },
  peak: {
    phaseName: "peak" as const,
    availableRecipes: [
      "salmon-nigiri",
      "cucumber-maki",
      "salmon-maki",
      "avocado-maki",
    ] as readonly RecipeId[],
    maxActiveOrders: 4,
    expressChance: 0.35,
    orderSpawnDelay: 2.5,
    orderPatienceMultiplier: 0.85,
  },
} as const;

export function getShiftProgression(progress: number): ShiftProgression {
  const clamped = Math.min(1, Math.max(0, progress));
  if (clamped < 0.25) {
    return SHIFT_PROGRESSION_TIERS.warmup;
  }
  if (clamped < 0.65) {
    return SHIFT_PROGRESSION_TIERS.rush;
  }
  return SHIFT_PROGRESSION_TIERS.peak;
}

export interface ShiftRating {
  readonly stars: 0 | 1 | 2 | 3;
  readonly title: string;
  readonly description: string;
}

export const SHIFT_STAR_THRESHOLDS = {
  threeStars: 300,
  twoStars: 180,
  oneStar: 80,
} as const;

export function calculateShiftRating(scoreState: ScoreState): ShiftRating {
  const score = scoreState.totalScore;
  if (score >= SHIFT_STAR_THRESHOLDS.threeStars) {
    return {
      stars: 3,
      title: "⭐⭐⭐ Meisterköche",
      description:
        "Hervorragende Zusammenarbeit und meisterhafte Küchenleistung!",
    };
  }
  if (score >= SHIFT_STAR_THRESHOLDS.twoStars) {
    return {
      stars: 2,
      title: "⭐⭐ Eingespieltes Team",
      description: "Gute Küchenleistung mit solider Organisation.",
    };
  }
  if (score >= SHIFT_STAR_THRESHOLDS.oneStar) {
    return {
      stars: 1,
      title: "⭐ Küchenlehrlinge",
      description:
        "Die Schicht überstanden, aber es gibt noch Ausbaupotenzial.",
    };
  }
  return {
    stars: 0,
    title: "Küchen-Chaos",
    description:
      "Zu viele Bestellungen verpasst oder falsche Gerichte ausgegeben.",
  };
}
