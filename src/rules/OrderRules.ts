import {
  DEFAULT_ORDER_DURATION,
  DEFAULT_ORDER_SPAWN_DELAY,
  DEFAULT_RECIPE_ID,
} from "./RecipeConfig";
import {
  type ActiveOrder,
  createActiveOrderFromPending,
  createPendingOrder,
  generateOrderId,
  type OrderStationState,
} from "../state/OrderState";

export interface OrderAdvanceResult {
  readonly orderStation: OrderStationState;
  readonly activeOrders: readonly ActiveOrder[];
}

export function advanceActiveOrders(
  orders: readonly ActiveOrder[],
  dt: number,
): readonly ActiveOrder[] {
  return orders.map((order) => {
    if (order.status !== "active") {
      return order;
    }

    const nextTime = Math.max(0, order.timeRemaining - dt);
    const nextStatus = nextTime <= 0 ? "expired" : "active";

    return {
      ...order,
      timeRemaining: nextTime,
      status: nextStatus,
    };
  });
}

export function advanceOrderStationState(
  stationState: OrderStationState,
  activeOrderCount: number,
  dt: number,
  maxActiveOrders = 1,
): OrderStationState {
  // If an order is already waiting at the counter, no timer needed
  if (stationState.pendingOrder !== null) {
    return stationState;
  }

  // If active orders have reached capacity, do not spawn yet
  if (activeOrderCount >= maxActiveOrders) {
    return stationState;
  }

  // Count down spawn timer
  const nextTimer = Math.max(0, stationState.nextSpawnTimer - dt);

  if (nextTimer <= 0) {
    // Spawn new pending order
    const newOrder = createPendingOrder(
      generateOrderId(),
      DEFAULT_RECIPE_ID,
      DEFAULT_ORDER_DURATION,
      false,
    );

    return {
      pendingOrder: newOrder,
      nextSpawnTimer: 0,
      totalOrdersSpawned: stationState.totalOrdersSpawned + 1,
    };
  }

  return {
    ...stationState,
    nextSpawnTimer: nextTimer,
  };
}

export function acceptOrderAtCounter(
  stationState: OrderStationState,
  activeOrders: readonly ActiveOrder[],
  maxActiveOrders = 1,
): {
  orderStation: OrderStationState;
  activeOrders: readonly ActiveOrder[];
  accepted: boolean;
} {
  if (!stationState.pendingOrder) {
    return {
      orderStation: stationState,
      activeOrders,
      accepted: false,
    };
  }

  // Check if we can accept more active orders
  const activeCount = activeOrders.filter((o) => o.status === "active").length;
  if (activeCount >= maxActiveOrders) {
    return {
      orderStation: stationState,
      activeOrders,
      accepted: false,
    };
  }

  const newActiveOrder = createActiveOrderFromPending(
    stationState.pendingOrder,
  );

  return {
    orderStation: {
      pendingOrder: null,
      nextSpawnTimer: DEFAULT_ORDER_SPAWN_DELAY,
      totalOrdersSpawned: stationState.totalOrdersSpawned,
    },
    activeOrders: [...activeOrders, newActiveOrder],
    accepted: true,
  };
}
