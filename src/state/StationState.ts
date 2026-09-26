import type { IngredientType } from "../rules/IngredientConfig";
import {
  DEFAULT_RICE_COOK_TIME,
  DEFAULT_RICE_MAX_PORTIONS,
  FRIDGE_INGREDIENTS,
} from "../rules/IngredientConfig";
import type { RecipeId } from "../rules/RecipeConfig";
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

export interface FridgeStationState {
  availableIngredients: readonly IngredientType[];
}

export function createInitialFridgeState(): FridgeStationState {
  return {
    availableIngredients: [...FRIDGE_INGREDIENTS],
  };
}

export type RollStationStateMode = "idle" | "rolling";
export const DEFAULT_ROLL_TIME = 2.0; // Seconds

export interface RollStationState {
  state: RollStationStateMode;
  items: Item[];
  rollingTimeRemaining: number;
  totalRollingTime: number;
  rollingProgress: number; // 0 to 1
  rollingRecipeId: RecipeId | null;
}

export function createInitialRollStationState(
  rollTime = DEFAULT_ROLL_TIME,
): RollStationState {
  return {
    state: "idle",
    items: [],
    rollingTimeRemaining: 0,
    totalRollingTime: rollTime,
    rollingProgress: 0,
    rollingRecipeId: null,
  };
}

export interface CounterStationState {
  items: Item[];
}

export function createInitialCounterState(): CounterStationState {
  return {
    items: [],
  };
}
