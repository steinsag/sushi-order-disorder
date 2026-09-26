import type { IngredientType } from "./IngredientConfig";

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
    name: "Gurken-Maki",
    emoji: "🥒",
    ingredients: ["nori", "rice", "cucumber"],
    baseDuration: 45,
    basePoints: 100,
  },
  "salmon-nigiri": {
    id: "salmon-nigiri",
    name: "Lachs-Nigiri",
    emoji: "🍣",
    ingredients: ["rice", "salmon"],
    baseDuration: 40,
    basePoints: 100,
  },
  "salmon-maki": {
    id: "salmon-maki",
    name: "Lachs-Maki",
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
