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

  it("defines all four recipes with their correct ingredients from README.md", () => {
    expect(RECIPES["cucumber-maki"].name).toBe("Cucumber Maki");
    expect(RECIPES["cucumber-maki"].ingredients).toEqual([
      "nori",
      "rice",
      "cucumber",
    ]);

    expect(RECIPES["salmon-nigiri"].name).toBe("Salmon Nigiri");
    expect(RECIPES["salmon-nigiri"].ingredients).toEqual(["rice", "salmon"]);

    expect(RECIPES["salmon-maki"].name).toBe("Salmon Maki");
    expect(RECIPES["salmon-maki"].ingredients).toEqual([
      "nori",
      "rice",
      "salmon",
    ]);

    expect(RECIPES["avocado-maki"].name).toBe("Avocado-Maki");
    expect(RECIPES["avocado-maki"].ingredients).toEqual([
      "nori",
      "rice",
      "avocado",
    ]);
  });

  it("throws error when querying an unknown recipe ID", () => {
    // @ts-expect-error Testing invalid runtime input
    expect(() => getRecipeDefinition("unknown-sushi")).toThrow(
      'Unknown recipe ID: "unknown-sushi"',
    );
  });

  describe("matchIngredientsToRecipe", () => {
    it("matches all four recipes regardless of ingredient order", () => {
      // Gurken-Maki: nori + rice + cucumber
      expect(matchIngredientsToRecipe(["nori", "rice", "cucumber"])?.id).toBe(
        "cucumber-maki",
      );
      expect(matchIngredientsToRecipe(["cucumber", "nori", "rice"])?.id).toBe(
        "cucumber-maki",
      );

      // Lachs-Nigiri: rice + salmon
      expect(matchIngredientsToRecipe(["rice", "salmon"])?.id).toBe(
        "salmon-nigiri",
      );
      expect(matchIngredientsToRecipe(["salmon", "rice"])?.id).toBe(
        "salmon-nigiri",
      );

      // Lachs-Maki: nori + rice + salmon
      expect(matchIngredientsToRecipe(["nori", "rice", "salmon"])?.id).toBe(
        "salmon-maki",
      );
      expect(matchIngredientsToRecipe(["salmon", "nori", "rice"])?.id).toBe(
        "salmon-maki",
      );

      // Avocado-Maki: nori + rice + avocado
      expect(matchIngredientsToRecipe(["nori", "rice", "avocado"])?.id).toBe(
        "avocado-maki",
      );
      expect(matchIngredientsToRecipe(["avocado", "rice", "nori"])?.id).toBe(
        "avocado-maki",
      );
    });

    it("clearly distinguishes between salmon-nigiri and salmon-maki", () => {
      // Without nori -> Nigiri
      expect(matchIngredientsToRecipe(["rice", "salmon"])?.id).toBe(
        "salmon-nigiri",
      );
      // With nori -> Maki
      expect(matchIngredientsToRecipe(["nori", "rice", "salmon"])?.id).toBe(
        "salmon-maki",
      );
    });

    it("clearly distinguishes between different maki variations", () => {
      expect(matchIngredientsToRecipe(["nori", "rice", "cucumber"])?.id).toBe(
        "cucumber-maki",
      );
      expect(matchIngredientsToRecipe(["nori", "rice", "salmon"])?.id).toBe(
        "salmon-maki",
      );
      expect(matchIngredientsToRecipe(["nori", "rice", "avocado"])?.id).toBe(
        "avocado-maki",
      );
    });

    it("returns null for incomplete ingredients", () => {
      expect(matchIngredientsToRecipe([])).toBeNull();
      expect(matchIngredientsToRecipe(["nori", "rice"])).toBeNull();
      expect(matchIngredientsToRecipe(["cucumber"])).toBeNull();
      expect(matchIngredientsToRecipe(["salmon"])).toBeNull();
      expect(matchIngredientsToRecipe(["avocado"])).toBeNull();
    });

    it("returns null for extra or conflicting ingredients", () => {
      expect(
        matchIngredientsToRecipe(["nori", "rice", "cucumber", "salmon"]),
      ).toBeNull();
      expect(
        matchIngredientsToRecipe(["nori", "cucumber", "avocado"]),
      ).toBeNull();
      expect(
        matchIngredientsToRecipe(["nori", "rice", "cucumber", "avocado"]),
      ).toBeNull();
    });
  });

  describe("findMatchingRecipe", () => {
    it("matches recipe from list of IngredientItems for each recipe", () => {
      expect(
        findMatchingRecipe([
          createIngredientItem("nori"),
          createIngredientItem("rice"),
          createIngredientItem("cucumber"),
        ])?.id,
      ).toBe("cucumber-maki");

      expect(
        findMatchingRecipe([
          createIngredientItem("rice"),
          createIngredientItem("salmon"),
        ])?.id,
      ).toBe("salmon-nigiri");

      expect(
        findMatchingRecipe([
          createIngredientItem("nori"),
          createIngredientItem("rice"),
          createIngredientItem("salmon"),
        ])?.id,
      ).toBe("salmon-maki");

      expect(
        findMatchingRecipe([
          createIngredientItem("nori"),
          createIngredientItem("rice"),
          createIngredientItem("avocado"),
        ])?.id,
      ).toBe("avocado-maki");
    });

    it("returns null when plate items are in the list", () => {
      const items = [createPlateItem("cucumber-maki")];
      expect(findMatchingRecipe(items)).toBeNull();
    });
  });
});
