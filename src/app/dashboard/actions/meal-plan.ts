"use server";

import { z } from "zod";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@db/index";
import { macroTargets } from "@db/schema";
import { desc, eq } from "drizzle-orm";

// Zod schema for AI meal plan response validation
const mealItemSchema = z.object({
  name: z.string(),
  serving: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

const mealSchema = z.object({
  type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  name: z.string(),
  items: z.array(mealItemSchema),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

const daySchema = z.object({
  day: z.number().min(1).max(7),
  date: z.string(),
  meals: z.array(mealSchema),
});

export const mealPlanResponseSchema = z.object({
  days: z.array(daySchema).length(7),
});

export type MealPlanResponse = z.infer<typeof mealPlanResponseSchema>;

export type GenerateMealPlanState = {
  success?: boolean;
  error?: string;
  mealPlan?: MealPlanResponse;
};

const DIETARY_PREFERENCES = [
  "none",
  "vegetarian",
  "vegan",
  "pescatarian",
  "keto",
  "paleo",
  "mediterranean",
  "low-carb",
  "gluten-free",
  "dairy-free",
] as const;

const dietaryPreferenceSchema = z.enum(DIETARY_PREFERENCES);

export async function generateMealPlan(
  dietaryPreference: string
): Promise<GenerateMealPlanState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const parsed = dietaryPreferenceSchema.safeParse(dietaryPreference);
  if (!parsed.success) {
    return { error: "Invalid dietary preference." };
  }

  const [target] = await db
    .select()
    .from(macroTargets)
    .where(eq(macroTargets.userId, session.user.id))
    .orderBy(desc(macroTargets.createdAt))
    .limit(1);

  if (!target?.calories || !target?.proteinG || !target?.carbsG || !target?.fatG) {
    return {
      error: "Set up your profile and macro targets first.",
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { error: "OpenAI API is not configured." };
  }

  const openai = new OpenAI({ apiKey });

  const macros = {
    calories: Math.round(target.calories),
    protein: Math.round(target.proteinG),
    carbs: Math.round(target.carbsG),
    fat: Math.round(target.fatG),
  };

  const preferenceLabel =
    parsed.data === "none" ? "no dietary restrictions" : parsed.data;

  const systemPrompt = `You are a nutritionist creating a 7-day meal plan. Output valid JSON only, no markdown or extra text.`;

  const userPrompt = `Create a 7-day meal plan with these daily macro targets:
- Calories: ${macros.calories} kcal
- Protein: ${macros.protein}g
- Carbs: ${macros.carbs}g
- Fat: ${macros.fat}g

Dietary preference: ${preferenceLabel}

Return a JSON object with exactly this structure:
{
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "meals": [
        {
          "type": "breakfast" | "lunch" | "dinner" | "snack",
          "name": "Meal name",
          "items": [
            { "name": "Food item", "serving": "e.g. 1 cup", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
          ],
          "calories": 0,
          "protein": 0,
          "carbs": 0,
          "fat": 0
        }
      ]
    }
  ]
}

Include breakfast, lunch, dinner, and 1-2 snacks per day. Each day must have a "date" in YYYY-MM-DD format starting from tomorrow. Ensure each meal's macros sum correctly. Be specific with portions.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { error: "No response from AI." };
    }

    const parsedJson = JSON.parse(content) as unknown;
    const validated = mealPlanResponseSchema.safeParse(parsedJson);

    if (!validated.success) {
      console.error("Meal plan validation failed:", validated.error);
      return { error: "Invalid meal plan format from AI." };
    }

    return { success: true, mealPlan: validated.data };
  } catch (err) {
    console.error("Meal plan generation failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to generate meal plan.";
    return { error: message };
  }
}

export async function submitMealPlanForm(
  _prevState: GenerateMealPlanState | null,
  formData: FormData
): Promise<GenerateMealPlanState> {
  const preference = formData.get("dietaryPreference") as string;
  return generateMealPlan(preference ?? "none");
}
