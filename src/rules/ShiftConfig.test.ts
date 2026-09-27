import { describe, expect, it } from "vitest";
import {
  calculateShiftRating,
  getShiftProgression,
  SHIFT_PROGRESSION_TIERS,
  SHIFT_STAR_THRESHOLDS,
} from "./ShiftConfig";
import { createInitialScoreState, type ScoreState } from "../state/ScoreState";

describe("ShiftConfig", () => {
  describe("getShiftProgression", () => {
    it("returns warmup progression for early shift (0 <= progress < 0.25)", () => {
      const p0 = getShiftProgression(0.0);
      const p10 = getShiftProgression(0.1);
      const p24 = getShiftProgression(0.24);

      expect(p0.phaseName).toBe("warmup");
      expect(p0.availableRecipes).toEqual(["salmon-nigiri", "cucumber-maki"]);
      expect(p0.maxActiveOrders).toBe(2);
      expect(p0.expressChance).toBe(0.0);
      expect(p0.orderSpawnDelay).toBe(4.5);
      expect(p0.orderPatienceMultiplier).toBe(1.2);

      expect(p10).toEqual(SHIFT_PROGRESSION_TIERS.warmup);
      expect(p24).toEqual(SHIFT_PROGRESSION_TIERS.warmup);
    });

    it("returns rush progression for mid shift (0.25 <= progress < 0.65)", () => {
      const p25 = getShiftProgression(0.25);
      const p50 = getShiftProgression(0.5);
      const p64 = getShiftProgression(0.64);

      expect(p25.phaseName).toBe("rush");
      expect(p25.availableRecipes).toEqual([
        "salmon-nigiri",
        "cucumber-maki",
        "salmon-maki",
      ]);
      expect(p25.maxActiveOrders).toBe(3);
      expect(p25.expressChance).toBe(0.2);
      expect(p25.orderSpawnDelay).toBe(3.5);
      expect(p25.orderPatienceMultiplier).toBe(1.0);

      expect(p50).toEqual(SHIFT_PROGRESSION_TIERS.rush);
      expect(p64).toEqual(SHIFT_PROGRESSION_TIERS.rush);
    });

    it("returns peak progression for late shift (0.65 <= progress <= 1.0)", () => {
      const p65 = getShiftProgression(0.65);
      const p80 = getShiftProgression(0.8);
      const p100 = getShiftProgression(1.0);

      expect(p65.phaseName).toBe("peak");
      expect(p65.availableRecipes).toEqual([
        "salmon-nigiri",
        "cucumber-maki",
        "salmon-maki",
        "avocado-maki",
      ]);
      expect(p65.maxActiveOrders).toBe(4);
      expect(p65.expressChance).toBe(0.35);
      expect(p65.orderSpawnDelay).toBe(2.5);
      expect(p65.orderPatienceMultiplier).toBe(0.85);

      expect(p80).toEqual(SHIFT_PROGRESSION_TIERS.peak);
      expect(p100).toEqual(SHIFT_PROGRESSION_TIERS.peak);
    });

    it("clamps negative progress and progress > 1", () => {
      expect(getShiftProgression(-0.5)).toEqual(SHIFT_PROGRESSION_TIERS.warmup);
      expect(getShiftProgression(1.5)).toEqual(SHIFT_PROGRESSION_TIERS.peak);
    });
  });

  describe("calculateShiftRating", () => {
    it("awards 3 stars when score reaches or exceeds 3-star threshold", () => {
      const score: ScoreState = {
        ...createInitialScoreState(),
        totalScore: SHIFT_STAR_THRESHOLDS.threeStars + 50,
        completedOrders: 4,
        onTimeOrders: 4,
      };

      const rating = calculateShiftRating(score);
      expect(rating.stars).toBe(3);
      expect(rating.title).toContain("Meisterköche");
    });

    it("awards 2 stars when score reaches 2-star threshold", () => {
      const score: ScoreState = {
        ...createInitialScoreState(),
        totalScore: SHIFT_STAR_THRESHOLDS.twoStars,
        completedOrders: 2,
        onTimeOrders: 2,
      };

      const rating = calculateShiftRating(score);
      expect(rating.stars).toBe(2);
      expect(rating.title).toContain("Eingespieltes Team");
    });

    it("awards 1 star when score reaches 1-star threshold", () => {
      const score: ScoreState = {
        ...createInitialScoreState(),
        totalScore: SHIFT_STAR_THRESHOLDS.oneStar,
        completedOrders: 1,
        onTimeOrders: 1,
      };

      const rating = calculateShiftRating(score);
      expect(rating.stars).toBe(1);
      expect(rating.title).toContain("Küchenlehrlinge");
    });

    it("awards 0 stars when score is below 1-star threshold", () => {
      const score: ScoreState = {
        ...createInitialScoreState(),
        totalScore: SHIFT_STAR_THRESHOLDS.oneStar - 10,
        completedOrders: 0,
        wrongDeliveries: 2,
      };

      const rating = calculateShiftRating(score);
      expect(rating.stars).toBe(0);
      expect(rating.title).toContain("Küchen-Chaos");
    });
  });
});
