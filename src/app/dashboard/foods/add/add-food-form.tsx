"use client";

import { useState, useMemo } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { FoodImageUpload } from "@/components/food-image-upload";
import {
  detectFoodFromImage,
  lookupIngredientMacros,
} from "@/app/actions/detect-food";
import { saveFood } from "../../actions/food";
import type { DetectedFoodItem } from "@/app/actions/detect-food-types";
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
import { Loader2, Plus, Scan, Sparkles, Trash2 } from "lucide-react";

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

const BLANK_INGREDIENT: EditableIngredient = {
  name: "",
  estimatedWeightG: 100,
  caloriesPer100g: 0,
  proteinPer100g: 0,
  carbsPer100g: 0,
  fatPer100g: 0,
  weightG: 100,
};

export function AddFoodForm() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<EditableIngredient[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [lookupIndex, setLookupIndex] = useState<number | null>(null);

  const [state, formAction, isPending] = useActionState(
    async (_prev: { success?: boolean; error?: string } | null, formData: FormData) => {
      return saveFood(formData);
    },
    null
  );

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

  function updateIngredient(
    index: number,
    field: keyof EditableIngredient,
    value: string | number
  ) {
    setIngredients((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, [field]: value };
        if (field === "weightG" || field === "estimatedWeightG") {
          const w = typeof value === "number" ? value : Number(value) || 0;
          next.weightG = Math.max(0, w);
          next.estimatedWeightG = next.weightG;
        }
        return next;
      })
    );
  }

  function addIngredient(ing?: EditableIngredient) {
    setIngredients((prev) => [...prev, ing ?? { ...BLANK_INGREDIENT }]);
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSuggestMacros(index: number) {
    const ing = ingredients[index];
    if (!ing?.name?.trim()) return;
    setLookupIndex(index);
    try {
      const result = await lookupIngredientMacros(ing.name.trim());
      if (result.error) {
        setDetectError(result.error);
      } else if (
        result.caloriesPer100g !== undefined &&
        result.proteinPer100g !== undefined &&
        result.carbsPer100g !== undefined &&
        result.fatPer100g !== undefined
      ) {
        setDetectError(null);
        setIngredients((prev) =>
          prev.map((item, i) =>
            i === index
              ? {
                  ...item,
                  caloriesPer100g: result.caloriesPer100g!,
                  proteinPer100g: result.proteinPer100g!,
                  carbsPer100g: result.carbsPer100g!,
                  fatPer100g: result.fatPer100g!,
                }
              : item
          )
        );
      }
    } finally {
      setLookupIndex(null);
    }
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

  const canSave =
    name.trim().length > 0 &&
    ingredients.length > 0 &&
    ingredients.every(
      (i) =>
        i.name.trim() &&
        i.weightG > 0 &&
        (i.caloriesPer100g > 0 ||
          i.proteinPer100g > 0 ||
          i.carbsPer100g > 0 ||
          i.fatPer100g > 0)
    );

  const ingredientsForSubmit = ingredients.map((i) => ({
    name: i.name.trim(),
    weightG: i.weightG,
    caloriesPer100g: i.caloriesPer100g,
    proteinPer100g: i.proteinPer100g,
    carbsPer100g: i.carbsPer100g,
    fatPer100g: i.fatPer100g,
  }));

  if (state?.success) {
    router.push("/dashboard");
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Food details</CardTitle>
        <CardDescription>
          Add ingredients manually or upload an image to detect. Edit weights
          to recalculate macros.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />
          <input
            type="hidden"
            name="ingredients"
            value={JSON.stringify(ingredientsForSubmit)}
          />

          <div className="space-y-2">
            <Label htmlFor="name">Food name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Chicken salad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Food image (optional)</Label>
            <FoodImageUpload
              value={imageUrl}
              onChange={(url) => {
                setImageUrl(url);
                if (!url) {
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
                    Detect food
                  </>
                ) : (
                  <>
                    <Scan className="mr-2 h-4 w-4" />
                    Detect food from image
                  </>
                )}
              </Button>
            )}
          </div>
          {detectError && (
            <p className="text-sm text-destructive" role="alert">
              {detectError}
            </p>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Ingredients</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addIngredient()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add ingredient
              </Button>
            </div>

            {ingredients.length === 0 ? (
              <p className="rounded-lg border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                Add ingredients manually or detect from image.
              </p>
            ) : (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                {ingredients.map((item, i) => {
                  const m = macrosForWeight(item.weightG, item);
                  return (
                    <div
                      key={i}
                      className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ingredient name"
                            value={item.name}
                            onChange={(e) =>
                              updateIngredient(i, "name", e.target.value)
                            }
                            className="font-medium"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestMacros(i)}
                            disabled={
                              !item.name.trim() || lookupIndex === i
                            }
                            title="AI suggests typical macros for this ingredient"
                          >
                            {lookupIndex === i ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Sparkles className="mr-1.5 h-4 w-4" />
                                Suggest
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <Label className="text-muted-foreground">
                              Cal/100g
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              step={0.1}
                              value={item.caloriesPer100g || ""}
                              onChange={(e) =>
                                updateIngredient(
                                  i,
                                  "caloriesPer100g",
                                  Number(e.target.value) || 0
                                )
                              }
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-muted-foreground">
                              P/100g
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              step={0.1}
                              value={item.proteinPer100g || ""}
                              onChange={(e) =>
                                updateIngredient(
                                  i,
                                  "proteinPer100g",
                                  Number(e.target.value) || 0
                                )
                              }
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-muted-foreground">
                              C/100g
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              step={0.1}
                              value={item.carbsPer100g || ""}
                              onChange={(e) =>
                                updateIngredient(
                                  i,
                                  "carbsPer100g",
                                  Number(e.target.value) || 0
                                )
                              }
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-muted-foreground">
                              F/100g
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              step={0.1}
                              value={item.fatPer100g || ""}
                              onChange={(e) =>
                                updateIngredient(
                                  i,
                                  "fatPer100g",
                                  Number(e.target.value) || 0
                                )
                              }
                              className="h-8"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {m.calories} kcal · P:{m.protein}g C:{m.carbs}g F:
                          {m.fat}g
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs">Weight (g)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={item.weightG}
                            onChange={(e) =>
                              updateWeight(i, Number(e.target.value) || 0)
                            }
                            className="w-20 text-right"
                            aria-label={`Weight in grams for ${item.name}`}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIngredient(i)}
                          aria-label={`Remove ${item.name}`}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {ingredients.length > 0 && (
              <div className="rounded-lg border bg-primary/5 p-3">
                <p className="text-sm font-medium">Total macros</p>
                <p className="text-lg font-semibold">
                  {totals.calories} kcal · P:{totals.protein}g C:{totals.carbs}g
                  F:{totals.fat}g
                </p>
              </div>
            )}
          </div>

          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            disabled={!canSave || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save food"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
