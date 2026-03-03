"use client";

import { useActionState } from "react";
import { submitProfileSetup } from "../actions/profile";
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

const GOAL_OPTIONS = [
  { value: "lose", label: "Lose weight" },
  { value: "maintain", label: "Maintain" },
  { value: "gain", label: "Gain weight" },
];

type ProfileFormProps = {
  initialWeight?: number | null;
  initialHeight?: number | null;
  initialAge?: number | null;
  initialGender?: string | null;
  initialGoal?: string | null;
  initialTrainingDays?: string | null;
};

export function ProfileForm({
  initialWeight,
  initialHeight,
  initialAge,
  initialGender,
  initialGoal,
  initialTrainingDays,
}: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitProfileSetup,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set your stats</CardTitle>
        <CardDescription>
          Enter your details to calculate your daily macros. Targets are
          auto-updated based on your weight trend.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          {state?.success && (
            <p className="text-sm text-primary" role="status">
              Profile saved. Your macro targets have been updated.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                step="0.1"
                min={30}
                max={300}
                placeholder="70"
                defaultValue={initialWeight ?? ""}
                required
                aria-required="true"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                name="height"
                type="number"
                min={100}
                max={250}
                placeholder="170"
                defaultValue={initialHeight ?? ""}
                required
                aria-required="true"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                min={13}
                max={120}
                placeholder="30"
                defaultValue={initialAge ?? ""}
                required
                aria-required="true"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                name="gender"
                required
                aria-required="true"
                defaultValue={initialGender ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              >
                <option value="" disabled>
                  Select
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">Goal</Label>
            <select
              id="goal"
              name="goal"
              required
              aria-required="true"
              defaultValue={initialGoal ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            >
              <option value="" disabled>
                Select goal
              </option>
              {GOAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="trainingDays">Training days per week</Label>
            <Input
              id="trainingDays"
              name="trainingDays"
              type="number"
              min={0}
              max={7}
              placeholder="4"
              defaultValue={initialTrainingDays ?? ""}
              required
              aria-required="true"
              aria-describedby="training-days-hint"
            />
            <p id="training-days-hint" className="text-xs text-muted-foreground">
              Days you exercise (0–7). Affects your calorie target.
            </p>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save & calculate macros"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
