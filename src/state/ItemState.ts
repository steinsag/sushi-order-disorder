import type { Vec2 } from "../math/vec2";
import type { IngredientType } from "../rules/IngredientConfig";

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

export type Item = IngredientItem;

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
