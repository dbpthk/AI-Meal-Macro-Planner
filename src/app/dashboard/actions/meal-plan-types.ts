import { z } from "zod";

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
