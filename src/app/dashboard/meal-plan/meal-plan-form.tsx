"use client";

import { useActionState } from "react";
import { submitMealPlanForm } from "../actions/meal-plan";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const DIETARY_OPTIONS = [
  { value: "none", label: "No restrictions" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "low-carb", label: "Low-carb" },
  { value: "gluten-free", label: "Gluten-free" },
  { value: "dairy-free", label: "Dairy-free" },
];

export function MealPlanForm() {
  const [state, formAction, isPending] = useActionState(
    submitMealPlanForm,
    null
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate meal plan</CardTitle>
          <CardDescription>
            Select your dietary preference. AI will create a 7-day plan matching
            your macro targets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dietaryPreference">Dietary preference</Label>
              <select
                id="dietaryPreference"
                name="dietaryPreference"
                defaultValue="none"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              >
                {DIETARY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Generating..." : "Generate meal plan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {state?.mealPlan && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Your 7-day meal plan</h3>
          {state.mealPlan.days.map((day) => (
            <Card key={day.day}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Day {day.day} {day.date && `(${day.date})`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {day.meals.map((meal) => (
                  <div key={meal.type} className="space-y-2">
                    <div className="flex flex-wrap items-baseline gap-2 text-sm font-medium">
                      <span className="capitalize">{meal.type}</span>
                      <span className="text-muted-foreground">
                        — {meal.name}
                      </span>
                      <span className="text-muted-foreground">
                        {meal.calories} kcal · P:{meal.protein}g C:{meal.carbs}g
                        F:{meal.fat}g
                      </span>
                    </div>
                    <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                      {meal.items.map((item, i) => (
                        <li key={i}>
                          {item.name} ({item.serving}) — {item.calories} kcal
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
