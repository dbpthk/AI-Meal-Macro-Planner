import { z } from "zod";

const detectedFoodItemSchema = z.object({
  name: z.string(),
  estimatedWeightG: z.number().min(0),
  caloriesPer100g: z.number().min(0),
  proteinPer100g: z.number().min(0),
  carbsPer100g: z.number().min(0),
  fatPer100g: z.number().min(0),
  confidence: z.number().min(0).max(1).optional(),
});

export const detectFoodResponseSchema = z.object({
  items: z.array(detectedFoodItemSchema),
});

export type DetectedFoodItem = z.infer<typeof detectedFoodItemSchema>;
export type DetectFoodResponse = z.infer<typeof detectFoodResponseSchema>;

export type DetectFoodState = {
  success?: boolean;
  error?: string;
  items?: DetectedFoodItem[];
};
