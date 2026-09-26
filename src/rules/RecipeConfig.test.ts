import { describe, expect, it } from "vitest";
import {
  ALL_RECIPE_IDS,
  findMatchingRecipe,
  getRecipeDefinition,
  matchIngredientsToRecipe,
  RECIPES,
} from "./RecipeConfig";
import { createIngredientItem, createPlateItem } from "../state/ItemState";

describe("RecipeConfig", () => {
  it("defines valid configurations for all four MVP recipes", () => {
    expect(ALL_RECIPE_IDS).toEqual([
      "cucumber-maki",
      "salmon-nigiri",
      "salmon-maki",
      "avocado-maki",
    ]);

    for (const id of ALL_RECIPE_IDS) {
      const recipe = getRecipeDefinition(id);
      expect(recipe.id).toBe(id);
      expect(recipe.name.length).toBeGreaterThan(0);
      expect(recipe.emoji.length).toBeGreaterThan(0);
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.baseDuration).toBeGreaterThan(0);
      expect(recipe.basePoints).toBeGreaterThan(0);
    }
  });

  it("defines cucumber-maki with nori, rice, and cucumber", () => {
    const cucumberMaki = RECIPES["cucumber-maki"];
    expect(cucumberMaki.name).toBe("Gurken-Maki");
    expect(cucumberMaki.ingredients).toEqual(["nori", "rice", "cucumber"]);
  });

  it("defines salmon-nigiri with rice and salmon", () => {
    const salmonNigiri = RECIPES["salmon-nigiri"];
    expect(salmonNigiri.name).toBe("Lachs-Nigiri");
    expect(salmonNigiri.ingredients).toEqual(["rice", "salmon"]);
  });

  it("throws error when querying an unknown recipe ID", () => {
    // @ts-expect-error Testing invalid runtime input
    expect(() => getRecipeDefinition("unknown-sushi")).toThrow(
      'Unknown recipe ID: "unknown-sushi"',
    );
  });

  describe("matchIngredientsToRecipe", () => {
    it("matches cucumber-maki regardless of ingredient order", () => {
      expect(matchIngredientsToRecipe(["nori", "rice", "cucumber"])?.id).toBe(
        "cucumber-maki",
      );
      expect(matchIngredientsToRecipe(["cucumber", "nori", "rice"])?.id).toBe(
        "cucumber-maki",
      );
      expect(matchIngredientsToRecipe(["rice", "cucumber", "nori"])?.id).toBe(
        "cucumber-maki",
      );
    });

    it("returns null for incomplete ingredients", () => {
      expect(matchIngredientsToRecipe([])).toBeNull();
      expect(matchIngredientsToRecipe(["nori", "rice"])).toBeNull();
      expect(matchIngredientsToRecipe(["cucumber"])).toBeNull();
    });

    it("returns null for extra or conflicting ingredients", () => {
      expect(
        matchIngredientsToRecipe(["nori", "rice", "cucumber", "salmon"]),
      ).toBeNull();
      expect(
        matchIngredientsToRecipe(["nori", "cucumber", "avocado"]),
      ).toBeNull();
    });
  });

  describe("findMatchingRecipe", () => {
    it("matches recipe from list of IngredientItems", () => {
      const items = [
        createIngredientItem("nori"),
        createIngredientItem("rice"),
        createIngredientItem("cucumber"),
      ];
      expect(findMatchingRecipe(items)?.id).toBe("cucumber-maki");
    });

    it("returns null when plate items are in the list", () => {
      const items = [createPlateItem("cucumber-maki")];
      expect(findMatchingRecipe(items)).toBeNull();
    });
  });
});
