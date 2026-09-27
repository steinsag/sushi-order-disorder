import {
  ALL_RECIPE_IDS,
  DEFAULT_ORDER_SPAWN_DELAY,
  type RecipeId,
} from "./RecipeConfig";
import {
  type ActiveOrder,
  createActiveOrderFromPending,
  createRandomPendingOrder,
  generateOrderId,
  type OrderStationState,
} from "../state/OrderState";

export const DEFAULT_MAX_ACTIVE_ORDERS = 3;
export const DEFAULT_EXPRESS_CHANCE = 0.25;

export interface OrderAdvanceResult {
  readonly orderStation: OrderStationState;
  readonly activeOrders: readonly ActiveOrder[];
}

export interface OrderSpawnOptions {
  readonly availableRecipes?: readonly RecipeId[];
  readonly expressChance?: number;
  readonly patienceMultiplier?: number;
  readonly randomFn?: () => number;
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
  maxActiveOrders: number = DEFAULT_MAX_ACTIVE_ORDERS,
  options?: OrderSpawnOptions,
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
    // Spawn new pending order from available recipes
    const availableRecipes = options?.availableRecipes ?? ALL_RECIPE_IDS;
    const expressChance = options?.expressChance ?? DEFAULT_EXPRESS_CHANCE;
    const patienceMultiplier = options?.patienceMultiplier ?? 1.0;
    const randomFn = options?.randomFn ?? Math.random;

    const newOrder = createRandomPendingOrder(
      generateOrderId(),
      availableRecipes,
      expressChance,
      patienceMultiplier,
      randomFn,
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
  maxActiveOrders: number = DEFAULT_MAX_ACTIVE_ORDERS,
  spawnDelay: number = DEFAULT_ORDER_SPAWN_DELAY,
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
      nextSpawnTimer: spawnDelay,
      totalOrdersSpawned: stationState.totalOrdersSpawned,
    },
    activeOrders: [...activeOrders, newActiveOrder],
    accepted: true,
  };
}
