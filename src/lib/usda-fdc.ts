/**
 * USDA FoodData Central API - nutrition lookup
 * https://fdc.nal.usda.gov/api-guide.html
 * Requires USDA_FDC_API_KEY (free from https://fdc.nal.usda.gov/api-key-signup)
 */

const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1";

// Standard nutrient IDs in FoodData Central
const NUTRIENT_IDS = {
  calories: 1008, // Energy (kcal)
  protein: 1003,
  carbs: 1005,
  fat: 1004,
} as const;

type UsdaMacros = {
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};

type SearchFood = {
  fdcId: number;
  description: string;
  dataType?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: Array<{
    nutrientId: number;
    value: number;
    unitName?: string;
  }>;
};

type FoodDetailsNutrient = {
  nutrient?: { id: number; name: string; unitName?: string };
  amount?: number;
};

type FoodDetails = {
  fdcId: number;
  description: string;
  foodNutrients?: FoodDetailsNutrient[];
};

function extractNutrient(
  nutrients: Array<{ nutrientId?: number; nutrient?: { id: number }; value?: number; amount?: number }>,
  nutrientId: number
): number {
  for (const n of nutrients) {
    const id = n.nutrientId ?? n.nutrient?.id;
    if (id === nutrientId) {
      const val = n.value ?? n.amount;
      return typeof val === "number" ? val : 0;
    }
  }
  return 0;
}

function toPer100g(
  value: number,
  servingSizeG: number | null
): number {
  if (!servingSizeG || servingSizeG <= 0) return value;
  return (value * 100) / servingSizeG;
}

export async function lookupUsdaMacros(
  ingredientName: string,
  apiKey: string
): Promise<{ success: true; data: UsdaMacros } | { success: false; error: string }> {
  const query = ingredientName.trim();
  if (!query) {
    return { success: false, error: "Enter an ingredient name." };
  }

  try {
    // Search - try SR Legacy / Foundation first (per-100g), then fallback to all data types
    const searchBodies = [
      {
        query,
        pageSize: 10,
        dataType: ["Foundation Foods", "SR Legacy", "Survey (FNDDS)"],
      },
      { query, pageSize: 10 },
    ];

    let foods: SearchFood[] = [];
    for (const body of searchBodies) {
      const searchRes = await fetch(
        `${USDA_API_BASE}/foods/search?api_key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          next: { revalidate: 0 },
        }
      );

      if (!searchRes.ok) {
        return {
          success: false,
          error: `USDA API error: ${searchRes.status}`,
        };
      }

      const searchData = (await searchRes.json()) as {
        foods?: SearchFood[];
        totalHits?: number;
      };

      foods = searchData.foods ?? [];
      if (foods.length > 0) break;
    }

    if (foods.length === 0) {
      return { success: false, error: "No foods found." };
    }

    // Prefer SR Legacy / Foundation Foods; otherwise use first result
    const preferred = foods.find(
      (f) =>
        f.dataType === "SR Legacy" || f.dataType === "Foundation Foods"
    );
    const food = preferred ?? foods[0];
    const fdcId = food.fdcId;

    // Fetch food details for accurate per-100g data (SR/Foundation use 100g standard)
    const detailsRes = await fetch(
      `${USDA_API_BASE}/food/${fdcId}?api_key=${encodeURIComponent(apiKey)}`,
      { next: { revalidate: 0 } }
    );

    if (!detailsRes.ok) {
      return { success: false, error: "Could not fetch food details." };
    }

    const details = (await detailsRes.json()) as FoodDetails;
    const nutrients = details.foodNutrients ?? [];

    // Food details use nutrient.id and amount (per 100g for SR Legacy / Foundation)
    const calories = extractNutrient(
      nutrients as FoodDetailsNutrient[],
      NUTRIENT_IDS.calories
    );
    const protein = extractNutrient(
      nutrients as FoodDetailsNutrient[],
      NUTRIENT_IDS.protein
    );
    const carbs = extractNutrient(
      nutrients as FoodDetailsNutrient[],
      NUTRIENT_IDS.carbs
    );
    const fat = extractNutrient(
      nutrients as FoodDetailsNutrient[],
      NUTRIENT_IDS.fat
    );

    // SR Legacy / Foundation Foods are per 100g; Branded may be per serving
    const servingG =
      food.servingSizeUnit === "g" && food.servingSize
        ? food.servingSize
        : null;
    const isLikelyPer100g =
      food.dataType === "SR Legacy" || food.dataType === "Foundation Foods";

    const caloriesPer100g = isLikelyPer100g
      ? calories
      : toPer100g(calories, servingG);
    const proteinPer100g = isLikelyPer100g
      ? protein
      : toPer100g(protein, servingG);
    const carbsPer100g = isLikelyPer100g
      ? carbs
      : toPer100g(carbs, servingG);
    const fatPer100g = isLikelyPer100g ? fat : toPer100g(fat, servingG);

    if (
      caloriesPer100g <= 0 &&
      proteinPer100g <= 0 &&
      carbsPer100g <= 0 &&
      fatPer100g <= 0
    ) {
      return { success: false, error: "No nutrient data found." };
    }

    return {
      success: true,
      data: {
        caloriesPer100g: Math.round(caloriesPer100g * 10) / 10,
        proteinPer100g: Math.round(proteinPer100g * 10) / 10,
        carbsPer100g: Math.round(carbsPer100g * 10) / 10,
        fatPer100g: Math.round(fatPer100g * 10) / 10,
      },
    };
  } catch (err) {
    console.error("USDA lookup failed:", err);
    const msg = err instanceof Error ? err.message : "Lookup failed.";
    return { success: false, error: msg };
  }
}
