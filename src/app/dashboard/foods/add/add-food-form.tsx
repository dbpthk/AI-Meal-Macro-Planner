"use client";

import { useState, useMemo } from "react";
import { FoodImageUpload } from "@/components/food-image-upload";
import { detectFoodFromImage } from "@/app/actions/detect-food";
import type { DetectedFoodItem } from "@/app/actions/detect-food";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Scan } from "lucide-react";

type EditableIngredient = DetectedFoodItem & { weightG: number };

function macrosForWeight(
  weightG: number,
  item: DetectedFoodItem
): { calories: number; protein: number; carbs: number; fat: number } {
  const factor = weightG / 100;
  return {
    calories: Math.round(item.caloriesPer100g * factor),
    protein: Math.round(item.proteinPer100g * factor),
    carbs: Math.round(item.carbsPer100g * factor),
    fat: Math.round(item.fatPer100g * factor),
  };
}

export function AddFoodForm() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<EditableIngredient[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  const totals = useMemo(() => {
    return ingredients.reduce(
      (acc, item) => {
        const m = macrosForWeight(item.weightG, item);
        acc.calories += m.calories;
        acc.protein += m.protein;
        acc.carbs += m.carbs;
        acc.fat += m.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [ingredients]);

  function updateWeight(index: number, weightG: number) {
    const val = Math.max(0, weightG);
    setIngredients((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, weightG: val } : item
      )
    );
  }

  async function handleDetect() {
    if (!imageUrl) return;
    setDetecting(true);
    setDetectError(null);
    setIngredients([]);
    try {
      const result = await detectFoodFromImage(imageUrl);
      if (result.error) {
        setDetectError(result.error);
      } else if (result.items) {
        setIngredients(
          result.items.map((item) => ({
            ...item,
            weightG: item.estimatedWeightG,
          }))
        );
      }
    } finally {
      setDetecting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Food details</CardTitle>
        <CardDescription>
          Upload an image to detect food items. Edit weights to recalculate
          macros in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image">Food image</Label>
          <FoodImageUpload
            value={imageUrl}
            onChange={(url) => {
              setImageUrl(url);
              if (!url) {
                setIngredients([]);
                setDetectError(null);
              }
            }}
          />
          {imageUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDetect}
              disabled={detecting}
            >
              {detecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <Scan className="mr-2 h-4 w-4" />
                  Detect food
                </>
              )}
            </Button>
          )}
        </div>
        {detectError && (
          <p className="text-sm text-destructive">{detectError}</p>
        )}
        {ingredients.length > 0 && (
          <div className="space-y-3">
            <Label>Ingredients</Label>
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              {ingredients.map((item, i) => {
                const m = macrosForWeight(item.weightG, item);
                return (
                  <div
                    key={i}
                    className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.calories} kcal · P:{m.protein}g C:{m.carbs}g F:
                        {m.fat}g
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={item.weightG}
                        onChange={(e) =>
                          updateWeight(i, Number(e.target.value) || 0)
                        }
                        className="w-20 text-right"
                      />
                      <span className="text-sm text-muted-foreground">g</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-lg border bg-primary/5 p-3">
              <p className="text-sm font-medium">Total macros</p>
              <p className="text-lg font-semibold">
                {totals.calories} kcal · P:{totals.protein}g C:{totals.carbs}g
                F:{totals.fat}g
              </p>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="e.g. Chicken breast" />
        </div>
        <p className="text-sm text-muted-foreground">
          Full food form (name, macros, etc.) coming soon.
        </p>
        <Button type="button" disabled>
          Save food (coming soon)
        </Button>
      </CardContent>
    </Card>
  );
}
