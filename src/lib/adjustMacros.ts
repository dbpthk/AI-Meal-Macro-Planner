/**
 * Auto-calorie adjustment based on weight trend and goal.
 * Updates macro_targets. Only call from server (cron or internal actions).
 * Users cannot override - macros are system-calculated only.
 */

import { db } from "@db/index";
import { macroTargets, profiles, weightLogs } from "@db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { calculateMacros, type Goal } from "@/lib/calculateMacros";

const GOALS = ["lose", "maintain", "gain"] as const;

// Weight change thresholds (kg per week)
const LOSE_TOO_FAST = 0.75; // >0.75 kg/week = increase calories
const LOSE_TOO_SLOW = 0.15; // <0.15 kg/week = decrease calories
const GAIN_TOO_FAST = 0.5;
const GAIN_TOO_SLOW = 0.1;
const MAINTAIN_DRIFT = 0.2; // >0.2 kg/week drift = adjust

const CALORIE_ADJUSTMENT = 100;

function getWeightTrendKgPerWeek(
  weights: { loggedAt: string; weightKg: number }[]
): number | null {
  if (weights.length < 2) return null;
  const sorted = [...weights].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const days =
    (new Date(last.loggedAt).getTime() - new Date(first.loggedAt).getTime()) /
    (1000 * 60 * 60 * 24);
  if (days < 7) return null;
  const changeKg = (last.weightKg ?? 0) - (first.weightKg ?? 0);
  return (changeKg / days) * 7;
}

export async function adjustMacrosForUser(userId: string): Promise<{
  updated: boolean;
  error?: string;
}> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!profile) return { updated: false, error: "No profile" };

  const goal = profile.goal as Goal | null;
  if (!goal || !GOALS.includes(goal)) return { updated: false, error: "No goal" };

  const heightCm = profile.heightCm;
  const gender = profile.gender as "male" | "female" | null;
  const activityLevel = profile.activityLevel;
  const birthDate = profile.birthDate;

  if (
    heightCm == null ||
    !gender ||
    !["male", "female"].includes(gender) ||
    !birthDate
  ) {
    return { updated: false, error: "Incomplete profile" };
  }

  const age = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  if (age < 13 || age > 120) return { updated: false, error: "Invalid age" };

  const trainingDays = parseInt(activityLevel ?? "0", 10) || 0;

  const weightData = await db
    .select({ loggedAt: weightLogs.loggedAt, weightKg: weightLogs.weightKg })
    .from(weightLogs)
    .where(eq(weightLogs.userId, userId))
    .orderBy(weightLogs.loggedAt);

  if (weightData.length === 0) return { updated: false, error: "No weight data" };

  const latestWeight = weightData[weightData.length - 1]?.weightKg ?? 0;
  if (!latestWeight) return { updated: false, error: "No latest weight" };

  const baseMacros = calculateMacros({
    weight: latestWeight,
    height: heightCm,
    age,
    goal,
    trainingDays,
    gender,
  });

  let calorieAdjustment = 0;

  if (weightData.length >= 4) {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const recentWeights = weightData.filter(
      (w) => new Date(w.loggedAt) >= twoWeeksAgo
    );

    const trend = getWeightTrendKgPerWeek(
      recentWeights.map((w) => ({ loggedAt: w.loggedAt, weightKg: w.weightKg ?? 0 }))
    );

    if (trend != null) {
      if (goal === "lose") {
        if (trend < -LOSE_TOO_FAST) calorieAdjustment = CALORIE_ADJUSTMENT;
        else if (trend > -LOSE_TOO_SLOW) calorieAdjustment = -CALORIE_ADJUSTMENT;
      } else if (goal === "gain") {
        if (trend > GAIN_TOO_FAST) calorieAdjustment = -CALORIE_ADJUSTMENT;
        else if (trend < GAIN_TOO_SLOW) calorieAdjustment = CALORIE_ADJUSTMENT;
      } else {
        if (trend > MAINTAIN_DRIFT) calorieAdjustment = -CALORIE_ADJUSTMENT;
        else if (trend < -MAINTAIN_DRIFT) calorieAdjustment = CALORIE_ADJUSTMENT;
      }
    }
  }

  const newCalories = Math.max(1200, baseMacros.calories + calorieAdjustment);

  const proteinG = Math.round(latestWeight * (goal === "lose" ? 2.2 : goal === "gain" ? 2.0 : 1.6));
  const proteinCal = proteinG * 4;
  const fatCal = newCalories * 0.25;
  const fatG = Math.round(fatCal / 9);
  const carbsCal = Math.max(0, newCalories - proteinCal - fatCal);
  const carbsG = Math.round(carbsCal / 4);

  await db.insert(macroTargets).values({
    userId,
    calories: newCalories,
    proteinG,
    carbsG,
    fatG,
  });

  return { updated: true };
}

export async function adjustMacrosForAllUsers(): Promise<{
  processed: number;
  updated: number;
  errors: string[];
}> {
  const userIds = await db
    .selectDistinct({ userId: profiles.userId })
    .from(profiles)
    .where(
      and(
        isNotNull(profiles.goal),
        isNotNull(profiles.heightCm),
        isNotNull(profiles.gender),
        isNotNull(profiles.birthDate)
      )
    );

  const errors: string[] = [];
  let updated = 0;

  for (const { userId } of userIds) {
    if (!userId) continue;
    try {
      const result = await adjustMacrosForUser(userId);
      if (result.updated) updated++;
      else if (result.error) errors.push(`${userId}: ${result.error}`);
    } catch (err) {
      errors.push(`${userId}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return {
    processed: userIds.length,
    updated,
    errors,
  };
}
