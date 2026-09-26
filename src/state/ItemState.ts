import type { Vec2 } from "../math/vec2";
import type { IngredientType } from "../rules/IngredientConfig";
import type { RecipeId } from "../rules/RecipeConfig";

let nextItemId = 1;

export function resetItemIdCounter(): void {
  nextItemId = 1;
}

export function generateItemId(): string {
  return `item-${nextItemId++}`;
}

export interface IngredientItem {
  id: string;
  type: "ingredient";
  ingredient: IngredientType;
}

export interface PlateItem {
  id: string;
  type: "plate";
  recipeId: RecipeId;
}

export type Item = IngredientItem | PlateItem;

export function isIngredientItem(item: Item): item is IngredientItem {
  return item.type === "ingredient";
}

export function isPlateItem(item: Item): item is PlateItem {
  return item.type === "plate";
}

export function createIngredientItem(
  ingredient: IngredientType,
  id?: string,
): IngredientItem {
  return {
    id: id ?? generateItemId(),
    type: "ingredient",
    ingredient,
  };
}

export function createPlateItem(recipeId: RecipeId, id?: string): PlateItem {
  return {
    id: id ?? generateItemId(),
    type: "plate",
    recipeId,
  };
}

export interface DroppedItem {
  id: string;
  item: Item;
  pos: Vec2;
}

export function createDroppedItem(
  item: Item,
  pos: Vec2,
  id?: string,
): DroppedItem {
  return {
    id: id ?? `dropped-${item.id}`,
    item,
    pos: { ...pos },
  };
}
