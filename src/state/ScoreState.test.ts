import { beforeEach, describe, expect, it } from "vitest";
import {
  advanceScoreState,
  applyDeliveryFeedback,
  createInitialScoreState,
  resetFeedbackCounterForTest,
} from "./ScoreState";

describe("ScoreState", () => {
  beforeEach(() => {
    resetFeedbackCounterForTest();
  });

  it("creates initial score state with 0 points and empty stats", () => {
    const initial = createInitialScoreState();
    expect(initial.totalScore).toBe(0);
    expect(initial.completedOrders).toBe(0);
    expect(initial.onTimeOrders).toBe(0);
    expect(initial.lateOrders).toBe(0);
    expect(initial.wrongDeliveries).toBe(0);
    expect(initial.recentFeedback).toBeNull();
  });

  it("applies successful delivery feedback and increments score", () => {
    const initial = createInitialScoreState();
    const state = applyDeliveryFeedback(
      initial,
      "success",
      "Pünktlich geliefert!",
      100,
      "cucumber-maki",
      3.0,
    );

    expect(state.totalScore).toBe(100);
    expect(state.completedOrders).toBe(1);
    expect(state.onTimeOrders).toBe(1);
    expect(state.lateOrders).toBe(0);
    expect(state.wrongDeliveries).toBe(0);
    expect(state.recentFeedback?.type).toBe("success");
    expect(state.recentFeedback?.scoreDelta).toBe(100);
  });

  it("applies penalty on wrong delivery and clamps totalScore to 0", () => {
    const initial = createInitialScoreState();
    const state = applyDeliveryFeedback(
      initial,
      "wrong",
      "Falsches Gericht!",
      -20,
      "cucumber-maki",
      3.0,
    );

    expect(state.totalScore).toBe(0); // Cannot go below 0
    expect(state.completedOrders).toBe(0);
    expect(state.wrongDeliveries).toBe(1);
    expect(state.recentFeedback?.type).toBe("wrong");
    expect(state.recentFeedback?.scoreDelta).toBe(-20);
  });

  it("decrements feedback timer and clears feedback when time expires", () => {
    const initial = createInitialScoreState();
    const stateWithFeedback = applyDeliveryFeedback(
      initial,
      "success",
      "Pünktlich geliefert!",
      100,
      "cucumber-maki",
      2.0,
    );

    const advanced1 = advanceScoreState(stateWithFeedback, 1.0);
    expect(advanced1.recentFeedback).not.toBeNull();
    expect(advanced1.recentFeedback?.timeRemaining).toBeCloseTo(1.0);

    const advanced2 = advanceScoreState(advanced1, 1.5);
    expect(advanced2.recentFeedback).toBeNull();
  });
});
