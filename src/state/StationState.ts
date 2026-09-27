import type { IngredientType } from "../rules/IngredientConfig";
import {
  DEFAULT_FRIDGE_COMPARTMENT_CAPACITY,
  DEFAULT_FRIDGE_REFILL_TIME,
  DEFAULT_RICE_COOK_TIME,
  DEFAULT_RICE_MAX_PORTIONS,
  FRIDGE_INGREDIENTS,
} from "../rules/IngredientConfig";
import type { RecipeId } from "../rules/RecipeConfig";
import {
  DEFAULT_COUNTER_MAX_ITEMS,
  DEFAULT_ROLL_STATION_MAX_ITEMS,
} from "../rules/StationConfig";
import type { Item } from "./ItemState";

export type RiceCookerState = "empty" | "cooking" | "ready";

export interface RiceCookerStationState {
  state: RiceCookerState;
  portions: number;
  maxPortions: number;
  cookTimeRemaining: number;
  totalCookTime: number;
  cookingProgress: number; // 0 to 1
}

export function createInitialRiceCookerState(
  initialPortions = 0,
  cookTime = DEFAULT_RICE_COOK_TIME,
): RiceCookerStationState {
  const isReady = initialPortions > 0;
  return {
    state: isReady ? "ready" : "empty",
    portions: initialPortions,
    maxPortions: DEFAULT_RICE_MAX_PORTIONS,
    cookTimeRemaining: 0,
    totalCookTime: cookTime,
    cookingProgress: isReady ? 1 : 0,
  };
}

export interface FridgeCompartmentState {
  stock: number;
  maxStock: number;
  refillTimeRemaining: number;
  totalRefillTime: number;
  refillProgress: number; // 0 to 1
}

export interface FridgeStationState {
  compartments: Record<IngredientType, FridgeCompartmentState>;
  availableIngredients: readonly IngredientType[];
}

export function createInitialFridgeState(
  initialStock = DEFAULT_FRIDGE_COMPARTMENT_CAPACITY,
  refillTime = DEFAULT_FRIDGE_REFILL_TIME,
): FridgeStationState {
  const compartments = {} as Record<IngredientType, FridgeCompartmentState>;
  for (const ing of FRIDGE_INGREDIENTS) {
    compartments[ing] = {
      stock: initialStock,
      maxStock: initialStock,
      refillTimeRemaining: 0,
      totalRefillTime: refillTime,
      refillProgress: 0,
    };
  }
  return {
    compartments,
    availableIngredients: [...FRIDGE_INGREDIENTS],
  };
}

export type RollStationStateMode = "idle" | "rolling";
export const DEFAULT_ROLL_TIME = 2.0; // Seconds

export interface RollStationState {
  state: RollStationStateMode;
  items: Item[];
  maxItems?: number;
  rollingTimeRemaining: number;
  totalRollingTime: number;
  rollingProgress: number; // 0 to 1
  rollingRecipeId: RecipeId | null;
}

export function createInitialRollStationState(
  rollTime = DEFAULT_ROLL_TIME,
  maxItems = DEFAULT_ROLL_STATION_MAX_ITEMS,
): RollStationState {
  return {
    state: "idle",
    items: [],
    maxItems,
    rollingTimeRemaining: 0,
    totalRollingTime: rollTime,
    rollingProgress: 0,
    rollingRecipeId: null,
  };
}

export interface CounterStationState {
  items: Item[];
  maxItems?: number;
}

export function createInitialCounterState(
  maxItems = DEFAULT_COUNTER_MAX_ITEMS,
): CounterStationState {
  return {
    items: [],
    maxItems,
  };
}
