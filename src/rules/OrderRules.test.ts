import { describe, expect, it } from "vitest";
import {
  acceptOrderAtCounter,
  advanceActiveOrders,
  advanceOrderStationState,
  DEFAULT_MAX_ACTIVE_ORDERS,
} from "./OrderRules";
import {
  type ActiveOrder,
  createInitialOrderStationState,
  createPendingOrder,
} from "../state/OrderState";

describe("OrderRules", () => {
  describe("advanceActiveOrders", () => {
    it("decrements remaining time by dt for all parallel orders", () => {
      const orders: ActiveOrder[] = [
        {
          id: "ord-1",
          recipeId: "cucumber-maki",
          totalTime: 45,
          timeRemaining: 45,
          isExpress: false,
          status: "active",
        },
        {
          id: "ord-2",
          recipeId: "salmon-nigiri",
          totalTime: 40,
          timeRemaining: 20,
          isExpress: true,
          status: "active",
        },
      ];

      const advanced = advanceActiveOrders(orders, 5.0);
      expect(advanced[0].timeRemaining).toBeCloseTo(40.0);
      expect(advanced[0].status).toBe("active");
      expect(advanced[1].timeRemaining).toBeCloseTo(15.0);
      expect(advanced[1].status).toBe("active");
    });

    it("marks order as expired when time reaches 0 while keeping others active", () => {
      const orders: ActiveOrder[] = [
        {
          id: "ord-1",
          recipeId: "cucumber-maki",
          totalTime: 45,
          timeRemaining: 2.0,
          isExpress: false,
          status: "active",
        },
        {
          id: "ord-2",
          recipeId: "salmon-maki",
          totalTime: 45,
          timeRemaining: 30.0,
          isExpress: false,
          status: "active",
        },
      ];

      const advanced = advanceActiveOrders(orders, 3.0);
      expect(advanced[0].timeRemaining).toBe(0);
      expect(advanced[0].status).toBe("expired");
      expect(advanced[1].timeRemaining).toBeCloseTo(27.0);
      expect(advanced[1].status).toBe("active");
    });

    it("does not further decrement already expired or completed orders", () => {
      const orders: ActiveOrder[] = [
        {
          id: "ord-1",
          recipeId: "cucumber-maki",
          totalTime: 45,
          timeRemaining: 0,
          isExpress: false,
          status: "expired",
        },
        {
          id: "ord-2",
          recipeId: "cucumber-maki",
          totalTime: 45,
          timeRemaining: 15,
          isExpress: false,
          status: "completed",
        },
      ];

      const advanced = advanceActiveOrders(orders, 5.0);
      expect(advanced[0].timeRemaining).toBe(0);
      expect(advanced[0].status).toBe("expired");
      expect(advanced[1].timeRemaining).toBe(15);
      expect(advanced[1].status).toBe("completed");
    });
  });

  describe("acceptOrderAtCounter", () => {
    it("turns a pending order into an active order and clears pendingOrder", () => {
      const station = createInitialOrderStationState(
        createPendingOrder("test-order", "cucumber-maki", 45),
      );
      const activeOrders: ActiveOrder[] = [];

      const result = acceptOrderAtCounter(station, activeOrders);

      expect(result.accepted).toBe(true);
      expect(result.orderStation.pendingOrder).toBeNull();
      expect(result.orderStation.nextSpawnTimer).toBeGreaterThan(0);
      expect(result.activeOrders).toHaveLength(1);
      expect(result.activeOrders[0].id).toBe("test-order");
      expect(result.activeOrders[0].recipeId).toBe("cucumber-maki");
      expect(result.activeOrders[0].timeRemaining).toBe(45);
      expect(result.activeOrders[0].status).toBe("active");
    });

    it("allows accepting multiple parallel orders up to DEFAULT_MAX_ACTIVE_ORDERS", () => {
      let station = createInitialOrderStationState(
        createPendingOrder("ord-1", "salmon-nigiri", 40),
      );
      let activeOrders: ActiveOrder[] = [];

      // Accept first order
      let result = acceptOrderAtCounter(
        station,
        activeOrders,
        DEFAULT_MAX_ACTIVE_ORDERS,
      );
      expect(result.accepted).toBe(true);
      activeOrders = [...result.activeOrders];
      expect(activeOrders).toHaveLength(1);

      // New pending order arrives
      station = {
        ...result.orderStation,
        pendingOrder: createPendingOrder("ord-2", "avocado-maki", 45),
      };

      // Accept second order
      result = acceptOrderAtCounter(
        station,
        activeOrders,
        DEFAULT_MAX_ACTIVE_ORDERS,
      );
      expect(result.accepted).toBe(true);
      activeOrders = [...result.activeOrders];
      expect(activeOrders).toHaveLength(2);
      expect(activeOrders[0].recipeId).toBe("salmon-nigiri");
      expect(activeOrders[1].recipeId).toBe("avocado-maki");

      // New pending order arrives
      station = {
        ...result.orderStation,
        pendingOrder: createPendingOrder("ord-3", "salmon-maki", 45),
      };

      // Accept third order
      result = acceptOrderAtCounter(
        station,
        activeOrders,
        DEFAULT_MAX_ACTIVE_ORDERS,
      );
      expect(result.accepted).toBe(true);
      activeOrders = [...result.activeOrders];
      expect(activeOrders).toHaveLength(3);

      // Now with 3 active orders, attempting to accept a 4th order should fail
      station = {
        ...result.orderStation,
        pendingOrder: createPendingOrder("ord-4", "cucumber-maki", 45),
      };
      result = acceptOrderAtCounter(
        station,
        activeOrders,
        DEFAULT_MAX_ACTIVE_ORDERS,
      );
      expect(result.accepted).toBe(false);
      expect(result.activeOrders).toHaveLength(3);
    });

    it("returns accepted = false if no pending order exists", () => {
      const station = {
        pendingOrder: null,
        nextSpawnTimer: 2.0,
        totalOrdersSpawned: 1,
      };
      const activeOrders: ActiveOrder[] = [];

      const result = acceptOrderAtCounter(station, activeOrders);
      expect(result.accepted).toBe(false);
      expect(result.activeOrders).toHaveLength(0);
    });
  });

  describe("advanceOrderStationState", () => {
    it("spawns a new pending order from available recipes once spawn timer reaches zero", () => {
      const station = {
        pendingOrder: null,
        nextSpawnTimer: 2.0,
        totalOrdersSpawned: 1,
      };

      // 1 second passes -> timer is 1.0, still no pending order
      const step1 = advanceOrderStationState(station, 0, 1.0, 3, {
        availableRecipes: ["salmon-nigiri"],
        expressChance: 0,
        randomFn: () => 0,
      });
      expect(step1.pendingOrder).toBeNull();
      expect(step1.nextSpawnTimer).toBeCloseTo(1.0);

      // Another 1.5 seconds pass -> spawn timer elapses, pending order appears
      const step2 = advanceOrderStationState(step1, 0, 1.5, 3, {
        availableRecipes: ["salmon-nigiri"],
        expressChance: 0,
        randomFn: () => 0,
      });
      expect(step2.pendingOrder).not.toBeNull();
      expect(step2.pendingOrder?.recipeId).toBe("salmon-nigiri");
      expect(step2.pendingOrder?.totalTime).toBe(40);
      expect(step2.pendingOrder?.isExpress).toBe(false);
      expect(step2.nextSpawnTimer).toBe(0);
      expect(step2.totalOrdersSpawned).toBe(2);
    });

    it("spawns express order when randomFn satisfies expressChance", () => {
      const station = {
        pendingOrder: null,
        nextSpawnTimer: 0,
        totalOrdersSpawned: 1,
      };

      const step = advanceOrderStationState(station, 0, 0.1, 3, {
        availableRecipes: ["salmon-maki"],
        expressChance: 0.5,
        randomFn: () => 0.1, // Less than 0.5 -> Express!
      });

      expect(step.pendingOrder).not.toBeNull();
      expect(step.pendingOrder?.recipeId).toBe("salmon-maki");
      expect(step.pendingOrder?.isExpress).toBe(true);
      expect(step.pendingOrder?.totalTime).toBeLessThan(45); // Express time reduced
    });

    it("does not spawn while active order limit is occupied", () => {
      const station = {
        pendingOrder: null,
        nextSpawnTimer: 2.0,
        totalOrdersSpawned: 1,
      };

      const step = advanceOrderStationState(station, 3, 5.0, 3);
      expect(step.pendingOrder).toBeNull();
    });

    it("spawns when active orders are below limit", () => {
      const station = {
        pendingOrder: null,
        nextSpawnTimer: 1.0,
        totalOrdersSpawned: 1,
      };

      const step = advanceOrderStationState(station, 2, 2.0, 3);
      expect(step.pendingOrder).not.toBeNull();
    });
  });
});
