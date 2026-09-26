import {
  ALL_RECIPE_IDS,
  DEFAULT_RECIPE_ID,
  getRecipeDefinition,
  type RecipeId,
} from "../rules/RecipeConfig";

export type OrderStatus = "active" | "completed" | "expired";

export interface ActiveOrder {
  readonly id: string;
  readonly recipeId: RecipeId;
  readonly totalTime: number;
  readonly timeRemaining: number;
  readonly isExpress: boolean;
  readonly status: OrderStatus;
}

export interface PendingOrder {
  readonly id: string;
  readonly recipeId: RecipeId;
  readonly totalTime: number;
  readonly isExpress: boolean;
}

export interface OrderStationState {
  readonly pendingOrder: PendingOrder | null;
  readonly nextSpawnTimer: number;
  readonly totalOrdersSpawned: number;
}

let orderIdCounter = 1;

export function resetOrderCounterForTest(): void {
  orderIdCounter = 1;
}

export function generateOrderId(): string {
  return `order-${orderIdCounter++}`;
}

export function createPendingOrder(
  id = generateOrderId(),
  recipeId: RecipeId = DEFAULT_RECIPE_ID,
  totalTime?: number,
  isExpress = false,
): PendingOrder {
  const duration =
    totalTime ??
    (isExpress
      ? Math.round(getRecipeDefinition(recipeId).baseDuration * 0.75)
      : getRecipeDefinition(recipeId).baseDuration);

  return {
    id,
    recipeId,
    totalTime: duration,
    isExpress,
  };
}

export function createRandomPendingOrder(
  id = generateOrderId(),
  availableRecipes: readonly RecipeId[] = ALL_RECIPE_IDS,
  expressChance = 0.25,
  randomFn: () => number = Math.random,
): PendingOrder {
  const recipeIndex = Math.floor(randomFn() * availableRecipes.length);
  const recipeId = availableRecipes[recipeIndex] ?? DEFAULT_RECIPE_ID;
  const isExpress = randomFn() < expressChance;
  const recipe = getRecipeDefinition(recipeId);
  const totalTime = isExpress
    ? Math.round(recipe.baseDuration * 0.75)
    : recipe.baseDuration;

  return {
    id,
    recipeId,
    totalTime,
    isExpress,
  };
}

export function createActiveOrderFromPending(
  pending: PendingOrder,
): ActiveOrder {
  return {
    id: pending.id,
    recipeId: pending.recipeId,
    totalTime: pending.totalTime,
    timeRemaining: pending.totalTime,
    isExpress: pending.isExpress,
    status: "active",
  };
}

export function createInitialOrderStationState(
  initialPendingOrder: PendingOrder | null = createPendingOrder("order-1"),
): OrderStationState {
  return {
    pendingOrder: initialPendingOrder,
    nextSpawnTimer: 0,
    totalOrdersSpawned: initialPendingOrder ? 1 : 0,
  };
}
