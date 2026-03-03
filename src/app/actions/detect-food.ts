"use server";

import { z } from "zod";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

export async function detectFoodFromImage(
  imageUrl: string
): Promise<DetectFoodState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  if (!imageUrl?.startsWith("http")) {
    return { error: "Invalid image URL." };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { error: "OpenAI API is not configured." };
  }

  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are a nutrition assistant that analyzes food images. Identify all visible food items, estimate their weight in grams, and provide typical nutrition per 100g. Return only valid JSON.`;

  const userPrompt = `Analyze this food image and return a JSON object with this exact structure:
{
  "items": [
    {
      "name": "Food item name",
      "estimatedWeightG": 150,
      "caloriesPer100g": 165,
      "proteinPer100g": 31,
      "carbsPer100g": 0,
      "fatPer100g": 3.6,
      "confidence": 0.9
    }
  ]
}

Rules:
- name: descriptive food name (e.g. "Grilled chicken breast", "Mixed salad")
- estimatedWeightG: estimated weight in grams
- caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g: typical nutrition per 100g for this food
- confidence: 0-1 how confident you are (optional)
- Include all visible food items
- If no food is detected, return {"items": []}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1024,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { error: "No response from AI." };
    }

    const parsedJson = JSON.parse(content) as unknown;
    const validated = detectFoodResponseSchema.safeParse(parsedJson);

    if (!validated.success) {
      console.error("Detect food validation failed:", validated.error);
      return { error: "Invalid response format from AI." };
    }

    return {
      success: true,
      items: validated.data.items,
    };
  } catch (err) {
    console.error("Food detection failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to detect food.";
    return { error: message };
  }
}
