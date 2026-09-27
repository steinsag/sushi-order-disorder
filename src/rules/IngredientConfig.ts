export type IngredientType =
  "nori" | "rice" | "salmon" | "cucumber" | "avocado";

export const ALL_INGREDIENTS: readonly IngredientType[] = [
  "nori",
  "rice",
  "salmon",
  "cucumber",
  "avocado",
] as const;

export const FRIDGE_INGREDIENTS: readonly IngredientType[] = [
  "nori",
  "salmon",
  "cucumber",
  "avocado",
] as const;

export interface IngredientMetadata {
  id: IngredientType;
  label: string;
  emoji: string;
  color: string;
  textColor: string;
}

export const INGREDIENT_METADATA: Record<IngredientType, IngredientMetadata> = {
  nori: {
    id: "nori",
    label: "Nori",
    emoji: "🌿",
    color: "#1e293b",
    textColor: "#f8fafc",
  },
  rice: {
    id: "rice",
    label: "Reis",
    emoji: "🍙",
    color: "#f8fafc",
    textColor: "#0f172a",
  },
  salmon: {
    id: "salmon",
    label: "Lachs",
    emoji: "🐟",
    color: "#fb923c",
    textColor: "#0f172a",
  },
  cucumber: {
    id: "cucumber",
    label: "Gurke",
    emoji: "🥒",
    color: "#22c55e",
    textColor: "#0f172a",
  },
  avocado: {
    id: "avocado",
    label: "Avocado",
    emoji: "🥑",
    color: "#84cc16",
    textColor: "#0f172a",
  },
};

export const DEFAULT_RICE_COOK_TIME = 5.0; // Seconds
export const DEFAULT_RICE_MAX_PORTIONS = 4; // Portions per full batch

export const DEFAULT_FRIDGE_COMPARTMENT_CAPACITY = 3; // Portions per ingredient compartment
export const DEFAULT_FRIDGE_REFILL_TIME = 4.0; // Seconds to refill 1 portion
