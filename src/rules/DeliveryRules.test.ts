import { beforeEach, describe, expect, it } from "vitest";
import { evaluateDelivery } from "./DeliveryRules";
import { createPlateItem } from "../state/ItemState";
import {
  type ActiveOrder,
  createActiveOrderFromPending,
  createPendingOrder,
  resetOrderCounterForTest,
} from "../state/OrderState";

describe("DeliveryRules", () => {
  beforeEach(() => {
    resetOrderCounterForTest();
  });

  it("successfully fulfills an on-time active order and returns correct score and message", () => {
    const pending = createPendingOrder("order-1", "cucumber-maki", 45);
    const active = createActiveOrderFromPending(pending);
    const plate = createPlateItem("cucumber-maki");

    const outcome = evaluateDelivery(plate, [active]);

    expect(outcome.result.type).toBe("success");
    expect(outcome.result.matchedOrder?.id).toBe("order-1");
    expect(outcome.result.scoreDelta).toBe(100);
    expect(outcome.result.message).toContain(
      "🥒 Gurken-Maki pünktlich geliefert! (+100)",
    );
    expect(outcome.updatedActiveOrders).toHaveLength(0);
  });

  it("fulfills an expired/late order with reduced points", () => {
    const pending = createPendingOrder("order-1", "cucumber-maki", 45);
    const expiredOrder: ActiveOrder = {
      ...createActiveOrderFromPending(pending),
      status: "expired",
      timeRemaining: 0,
    };
    const plate = createPlateItem("cucumber-maki");

    const outcome = evaluateDelivery(plate, [expiredOrder]);

    expect(outcome.result.type).toBe("late");
    expect(outcome.result.matchedOrder?.id).toBe("order-1");
    expect(outcome.result.scoreDelta).toBe(50); // 100 * 0.5
    expect(outcome.result.message).toContain(
      "🥒 Gurken-Maki verspätet geliefert! (+50)",
    );
    expect(outcome.updatedActiveOrders).toHaveLength(0);
  });

  it("awards express bonus on on-time delivery", () => {
    const pending = createPendingOrder("order-1", "salmon-nigiri", 40, true);
    const active = createActiveOrderFromPending(pending);
    const plate = createPlateItem("salmon-nigiri");

    const outcome = evaluateDelivery(plate, [active]);

    expect(outcome.result.type).toBe("success");
    expect(outcome.result.scoreDelta).toBe(150); // 100 * 1.5
    expect(outcome.updatedActiveOrders).toHaveLength(0);
  });

  it("penalizes delivery of an incorrect dish and keeps active orders open", () => {
    const pending = createPendingOrder("order-1", "cucumber-maki", 45);
    const active = createActiveOrderFromPending(pending);
    const wrongPlate = createPlateItem("salmon-nigiri");

    const outcome = evaluateDelivery(wrongPlate, [active]);

    expect(outcome.result.type).toBe("wrong");
    expect(outcome.result.matchedOrder).toBeNull();
    expect(outcome.result.scoreDelta).toBe(-20);
    expect(outcome.result.message).toContain("Falsches Gericht");
    expect(outcome.updatedActiveOrders).toHaveLength(1);
    expect(outcome.updatedActiveOrders[0].id).toBe("order-1");
  });

  it("penalizes delivery when no active orders exist", () => {
    const plate = createPlateItem("cucumber-maki");

    const outcome = evaluateDelivery(plate, []);

    expect(outcome.result.type).toBe("wrong");
    expect(outcome.result.matchedOrder).toBeNull();
    expect(outcome.result.scoreDelta).toBe(-20);
    expect(outcome.updatedActiveOrders).toHaveLength(0);
  });

  it("selects the most urgent order when multiple matching orders are active", () => {
    const order1: ActiveOrder = {
      id: "order-1",
      recipeId: "cucumber-maki",
      totalTime: 45,
      timeRemaining: 30,
      isExpress: false,
      status: "active",
    };
    const order2: ActiveOrder = {
      id: "order-2",
      recipeId: "cucumber-maki",
      totalTime: 45,
      timeRemaining: 10,
      isExpress: false,
      status: "active",
    };
    const plate = createPlateItem("cucumber-maki");

    const outcome = evaluateDelivery(plate, [order1, order2]);

    expect(outcome.result.type).toBe("success");
    expect(outcome.result.matchedOrder?.id).toBe("order-2"); // Most urgent (10s remaining)
    expect(outcome.updatedActiveOrders).toHaveLength(1);
    expect(outcome.updatedActiveOrders[0].id).toBe("order-1");
  });
});
