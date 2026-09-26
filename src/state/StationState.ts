import type { IngredientType } from "../rules/IngredientConfig";
import {
  DEFAULT_RICE_COOK_TIME,
  DEFAULT_RICE_MAX_PORTIONS,
  FRIDGE_INGREDIENTS,
} from "../rules/IngredientConfig";
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

export interface RollStationState {
  items: Item[];
}

export function createInitialRollStationState(): RollStationState {
  return {
    items: [],
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
