import { describe, expect, it } from "vitest";
import {
  acceptOrderAtCounter,
  advanceActiveOrders,
  advanceOrderStationState,
} from "./OrderRules";
import {
  type ActiveOrder,
  createInitialOrderStationState,
  createPendingOrder,
} from "../state/OrderState";

describe("OrderRules", () => {
  describe("advanceActiveOrders", () => {
    it("decrements remaining time by dt", () => {
      const orders: ActiveOrder[] = [
        {
          id: "ord-1",
          recipeId: "cucumber-maki",
          totalTime: 45,
          timeRemaining: 45,
          isExpress: false,
          status: "active",
        },
      ];

      const advanced = advanceActiveOrders(orders, 5.0);
      expect(advanced[0].timeRemaining).toBeCloseTo(40.0);
      expect(advanced[0].status).toBe("active");
    });

    it("marks order as expired when time reaches 0", () => {
      const orders: ActiveOrder[] = [
        {
          id: "ord-1",
          recipeId: "cucumber-maki",
          totalTime: 45,
          timeRemaining: 2.0,
          isExpress: false,
          status: "active",
        },
      ];

      const advanced = advanceActiveOrders(orders, 3.0);
      expect(advanced[0].timeRemaining).toBe(0);
      expect(advanced[0].status).toBe("expired");
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

      const result = acceptOrderAtCounter(station, activeOrders, 1);

      expect(result.accepted).toBe(true);
      expect(result.orderStation.pendingOrder).toBeNull();
      expect(result.orderStation.nextSpawnTimer).toBeGreaterThan(0);
      expect(result.activeOrders).toHaveLength(1);
      expect(result.activeOrders[0].id).toBe("test-order");
      expect(result.activeOrders[0].recipeId).toBe("cucumber-maki");
      expect(result.activeOrders[0].timeRemaining).toBe(45);
      expect(result.activeOrders[0].status).toBe("active");
    });

    it("returns accepted = false if no pending order exists", () => {
      const station = {
        pendingOrder: null,
        nextSpawnTimer: 2.0,
        totalOrdersSpawned: 1,
      };
      const activeOrders: ActiveOrder[] = [];

      const result = acceptOrderAtCounter(station, activeOrders, 1);
      expect(result.accepted).toBe(false);
      expect(result.activeOrders).toHaveLength(0);
    });

    it("rejects acceptance if active order limit is reached", () => {
      const station = createInitialOrderStationState(
        createPendingOrder("test-order", "cucumber-maki", 45),
      );
      const activeOrders: ActiveOrder[] = [
        {
          id: "already-active",
          recipeId: "cucumber-maki",
          totalTime: 45,
          timeRemaining: 30,
          isExpress: false,
          status: "active",
        },
      ];

      const result = acceptOrderAtCounter(station, activeOrders, 1);
      expect(result.accepted).toBe(false);
      expect(result.orderStation.pendingOrder).not.toBeNull();
    });
  });

  describe("advanceOrderStationState", () => {
    it("spawns a new pending order once spawn timer reaches zero", () => {
      const station = {
        pendingOrder: null,
        nextSpawnTimer: 2.0,
        totalOrdersSpawned: 1,
      };

      // 1 second passes -> timer is 1.0, still no pending order
      const step1 = advanceOrderStationState(station, 0, 1.0, 1);
      expect(step1.pendingOrder).toBeNull();
      expect(step1.nextSpawnTimer).toBeCloseTo(1.0);

      // Another 1.5 seconds pass -> spawn timer elapses, pending order appears
      const step2 = advanceOrderStationState(step1, 0, 1.5, 1);
      expect(step2.pendingOrder).not.toBeNull();
      expect(step2.pendingOrder?.recipeId).toBe("cucumber-maki");
      expect(step2.nextSpawnTimer).toBe(0);
      expect(step2.totalOrdersSpawned).toBe(2);
    });

    it("does not spawn while active order limit is occupied", () => {
      const station = {
        pendingOrder: null,
        nextSpawnTimer: 2.0,
        totalOrdersSpawned: 1,
      };

      const step = advanceOrderStationState(station, 1, 5.0, 1);
      expect(step.pendingOrder).toBeNull();
    });
  });
});
