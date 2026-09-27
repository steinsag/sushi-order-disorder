import type { IngredientType } from "./IngredientConfig";
import type { Item } from "../state/ItemState";

export type RecipeId =
  "cucumber-maki" | "salmon-nigiri" | "salmon-maki" | "avocado-maki";

export interface RecipeDefinition {
  readonly id: RecipeId;
  readonly name: string;
  readonly emoji: string;
  readonly ingredients: readonly IngredientType[];
  readonly baseDuration: number; // Duration in seconds
  readonly basePoints: number; // Points awarded for on-time delivery
}

export const RECIPES: Record<RecipeId, RecipeDefinition> = {
  "cucumber-maki": {
    id: "cucumber-maki",
    name: "Cucumber Maki",
    emoji: "🥒",
    ingredients: ["nori", "rice", "cucumber"],
    baseDuration: 45,
    basePoints: 100,
  },
  "salmon-nigiri": {
    id: "salmon-nigiri",
    name: "Salmon Nigiri",
    emoji: "🍣",
    ingredients: ["rice", "salmon"],
    baseDuration: 40,
    basePoints: 100,
  },
  "salmon-maki": {
    id: "salmon-maki",
    name: "Salmon Maki",
    emoji: "🐟",
    ingredients: ["nori", "rice", "salmon"],
    baseDuration: 45,
    basePoints: 120,
  },
  "avocado-maki": {
    id: "avocado-maki",
    name: "Avocado-Maki",
    emoji: "🥑",
    ingredients: ["nori", "rice", "avocado"],
    baseDuration: 45,
    basePoints: 110,
  },
};

export const ALL_RECIPE_IDS: readonly RecipeId[] = [
  "cucumber-maki",
  "salmon-nigiri",
  "salmon-maki",
  "avocado-maki",
] as const;

export const DEFAULT_RECIPE_ID: RecipeId = "cucumber-maki";
export const DEFAULT_ORDER_DURATION = 45; // Seconds
export const DEFAULT_ORDER_SPAWN_DELAY = 4; // Seconds until next order arrives if counter is empty

export function getRecipeDefinition(id: RecipeId): RecipeDefinition {
  const recipe = RECIPES[id];
  if (!recipe) {
    throw new Error(`Unknown recipe ID: "${id}"`);
  }
  return recipe;
}

/**
 * Checks if a collection of ingredient types matches any recipe definition exactly.
 */
export function matchIngredientsToRecipe(
  ingredients: readonly IngredientType[],
): RecipeDefinition | null {
  if (ingredients.length === 0) return null;
  const sorted = [...ingredients].sort();

  for (const recipe of Object.values(RECIPES)) {
    const sortedRecipe = [...recipe.ingredients].sort();
    if (sorted.length !== sortedRecipe.length) {
      continue;
    }
    if (sorted.every((ing, idx) => ing === sortedRecipe[idx])) {
      return recipe;
    }
  }

  return null;
}

/**
 * Checks if a list of Items (e.g. from the roll station) matches any recipe definition.
 * Returns null if any item is not an ingredient or if ingredients do not match a recipe.
 */
export function findMatchingRecipe(
  items: readonly Item[],
): RecipeDefinition | null {
  if (items.length === 0) return null;
  const ingredients: IngredientType[] = [];

  for (const item of items) {
    if (item.type !== "ingredient") {
      return null;
    }
    ingredients.push(item.ingredient);
  }

  return matchIngredientsToRecipe(ingredients);
}
