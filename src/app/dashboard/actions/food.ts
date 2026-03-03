"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@db/index";
import { dailyLogs, foods } from "@db/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";

const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required").max(255),
  weightG: z.coerce.number().min(0),
  caloriesPer100g: z.coerce.number().min(0),
  proteinPer100g: z.coerce.number().min(0),
  carbsPer100g: z.coerce.number().min(0),
  fatPer100g: z.coerce.number().min(0),
});

const saveFoodSchema = z.object({
  name: z.string().min(1, "Food name is required").max(255),
  imageUrl: z.string().url().optional(),
  ingredients: z.array(ingredientSchema).min(1, "Add at least one ingredient"),
});

export async function saveFood(formData: FormData): Promise<{
  success?: boolean;
  error?: string;
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const name = formData.get("name") as string;
  const imageUrl = formData.get("imageUrl") as string | null;
  const ingredientsJson = formData.get("ingredients") as string;

  let rawIngredients: unknown[];
  try {
    rawIngredients = JSON.parse(ingredientsJson || "[]");
  } catch {
    return { error: "Invalid ingredients data." };
  }

  if (!Array.isArray(rawIngredients)) {
    return { error: "Invalid ingredients data." };
  }

  // Filter and coerce ingredients - ensure name is string, numbers are valid
  const ingredients = rawIngredients
    .map((raw) => {
      const r = raw as Record<string, unknown>;
      const name = typeof r?.name === "string" ? r.name.trim() : "";
      if (!name) return null;
      return {
        name,
        weightG: Number(r?.weightG) || 0,
        caloriesPer100g: Number(r?.caloriesPer100g) || 0,
        proteinPer100g: Number(r?.proteinPer100g) || 0,
        carbsPer100g: Number(r?.carbsPer100g) || 0,
        fatPer100g: Number(r?.fatPer100g) || 0,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null && i.name.length > 0);

  const parsed = saveFoodSchema.safeParse({
    name: name?.trim() ?? "",
    imageUrl: imageUrl && imageUrl.startsWith("http") ? imageUrl : undefined,
    ingredients,
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { error: msg };
  }

  const { name: foodName, imageUrl: imgUrl, ingredients: ing } = parsed.data;
  const imageUrlValue =
    imgUrl && imgUrl.startsWith("http") ? imgUrl : null;

  const totalWeight = ing.reduce((sum, i) => sum + i.weightG, 0);
  const totals = ing.reduce(
    (acc, i) => {
      const factor = i.weightG / 100;
      acc.calories += i.caloriesPer100g * factor;
      acc.protein += i.proteinPer100g * factor;
      acc.carbs += i.carbsPer100g * factor;
      acc.fat += i.fatPer100g * factor;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const today = new Date().toISOString().slice(0, 10);
  const calories = Math.round(totals.calories * 10) / 10;
  const proteinG = Math.round(totals.protein * 10) / 10;
  const carbsG = Math.round(totals.carbs * 10) / 10;
  const fatG = Math.round(totals.fat * 10) / 10;

  try {
    await db.insert(foods).values({
      userId: session.user.id,
      name: foodName,
      brand: null,
      imageUrl: imageUrlValue,
      servingSize: totalWeight,
      servingUnit: "g",
      caloriesPerServing: calories,
      proteinPerServing: proteinG,
      carbsPerServing: carbsG,
      fatPerServing: fatG,
    });

    // Add to today's daily intake (progress bars on dashboard)
    await db
      .insert(dailyLogs)
      .values({
        userId: session.user.id,
        loggedAt: today,
        calories,
        proteinG,
        carbsG,
        fatG,
      })
      .onConflictDoUpdate({
        target: [dailyLogs.userId, dailyLogs.loggedAt],
        set: {
          calories: sql`${dailyLogs.calories} + ${calories}`,
          proteinG: sql`${dailyLogs.proteinG} + ${proteinG}`,
          carbsG: sql`${dailyLogs.carbsG} + ${carbsG}`,
          fatG: sql`${dailyLogs.fatG} + ${fatG}`,
          updatedAt: new Date(),
        },
      });

    return { success: true };
  } catch (err) {
    console.error("Save food failed:", err);
    return { error: "Failed to save food." };
  }
}
