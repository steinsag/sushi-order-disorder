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

  it("successfully fulfills an on-time active order and returns correct score and recipe", () => {
    const pending = createPendingOrder("order-1", "cucumber-maki", 45);
    const active = createActiveOrderFromPending(pending);
    const plate = createPlateItem("cucumber-maki");

    const outcome = evaluateDelivery(plate, [active]);

    expect(outcome.result.type).toBe("success");
    expect(outcome.result.matchedOrder?.id).toBe("order-1");
    expect(outcome.result.scoreDelta).toBe(100);
    expect(outcome.result.recipeId).toBe("cucumber-maki");
    expect(outcome.result.isExpress).toBe(false);
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
    expect(outcome.result.recipeId).toBe("cucumber-maki");
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
    expect(outcome.result.recipeId).toBe("salmon-nigiri");
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

  it("successfully delivers all four MVP recipes with correct points and IDs", () => {
    // 1. Gurken-Maki
    const o1 = createActiveOrderFromPending(
      createPendingOrder("o-1", "cucumber-maki"),
    );
    const res1 = evaluateDelivery(createPlateItem("cucumber-maki"), [o1]);
    expect(res1.result.type).toBe("success");
    expect(res1.result.scoreDelta).toBe(100);
    expect(res1.result.recipeId).toBe("cucumber-maki");

    // 2. Lachs-Nigiri
    const o2 = createActiveOrderFromPending(
      createPendingOrder("o-2", "salmon-nigiri"),
    );
    const res2 = evaluateDelivery(createPlateItem("salmon-nigiri"), [o2]);
    expect(res2.result.type).toBe("success");
    expect(res2.result.scoreDelta).toBe(100);
    expect(res2.result.recipeId).toBe("salmon-nigiri");

    // 3. Lachs-Maki
    const o3 = createActiveOrderFromPending(
      createPendingOrder("o-3", "salmon-maki"),
    );
    const res3 = evaluateDelivery(createPlateItem("salmon-maki"), [o3]);
    expect(res3.result.type).toBe("success");
    expect(res3.result.scoreDelta).toBe(120);
    expect(res3.result.recipeId).toBe("salmon-maki");

    // 4. Avocado-Maki
    const o4 = createActiveOrderFromPending(
      createPendingOrder("o-4", "avocado-maki"),
    );
    const res4 = evaluateDelivery(createPlateItem("avocado-maki"), [o4]);
    expect(res4.result.type).toBe("success");
    expect(res4.result.scoreDelta).toBe(110);
    expect(res4.result.recipeId).toBe("avocado-maki");
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

  it("prioritizes express order when time remaining is identical", () => {
    const regularOrder: ActiveOrder = {
      id: "ord-regular",
      recipeId: "salmon-maki",
      totalTime: 45,
      timeRemaining: 20,
      isExpress: false,
      status: "active",
    };
    const expressOrder: ActiveOrder = {
      id: "ord-express",
      recipeId: "salmon-maki",
      totalTime: 30,
      timeRemaining: 20,
      isExpress: true,
      status: "active",
    };
    const plate = createPlateItem("salmon-maki");

    const outcome = evaluateDelivery(plate, [regularOrder, expressOrder]);

    expect(outcome.result.type).toBe("success");
    expect(outcome.result.matchedOrder?.id).toBe("ord-express");
    expect(outcome.result.scoreDelta).toBe(180); // 120 * 1.5
    expect(outcome.result.isExpress).toBe(true);
    expect(outcome.updatedActiveOrders).toHaveLength(1);
    expect(outcome.updatedActiveOrders[0].id).toBe("ord-regular");
  });

  it("fulfills only matching recipe among diverse parallel orders", () => {
    const order1 = createActiveOrderFromPending(
      createPendingOrder("o-nigiri", "salmon-nigiri"),
    );
    const order2 = createActiveOrderFromPending(
      createPendingOrder("o-maki", "salmon-maki"),
    );
    const order3 = createActiveOrderFromPending(
      createPendingOrder("o-avocado", "avocado-maki"),
    );

    const plate = createPlateItem("salmon-maki");
    const outcome = evaluateDelivery(plate, [order1, order2, order3]);

    expect(outcome.result.type).toBe("success");
    expect(outcome.result.matchedOrder?.id).toBe("o-maki");
    expect(outcome.updatedActiveOrders).toHaveLength(2);
    expect(outcome.updatedActiveOrders.map((o) => o.id)).toEqual([
      "o-nigiri",
      "o-avocado",
    ]);
  });
});
