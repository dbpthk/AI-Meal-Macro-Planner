/**
 * Mifflin-St Jeor BMR + activity multiplier + goal logic
 * Returns daily calorie target and macro breakdown (protein, carbs, fat in grams)
 *
 * @param weight - Body weight in kg
 * @param height - Height in cm
 * @param age - Age in years
 * @param goal - 'lose' | 'maintain' | 'gain'
 * @param trainingDays - Days per week of exercise (0-7), maps to activity multiplier
 * @param gender - Required for Mifflin-St Jeor BMR formula
 */

export type Goal = "lose" | "maintain" | "gain";
export type Gender = "male" | "female";

export interface CalculateMacrosInput {
  weight: number; // kg
  height: number; // cm
  age: number;
  goal: Goal;
  trainingDays: number; // 0-7 days per week
  gender: Gender;
}

export interface CalculateMacrosOutput {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const ACTIVITY_MULTIPLIERS: Record<number, number> = {
  0: 1.2, // Sedentary
  1: 1.375,
  2: 1.375, // Lightly active
  3: 1.55,
  4: 1.55, // Moderately active
  5: 1.725,
  6: 1.725, // Active
  7: 1.9, // Very active
};

const GOAL_CALORIE_ADJUSTMENT: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 500,
};

const PROTEIN_PER_KG: Record<Goal, number> = {
  lose: 2.2, // Higher to preserve muscle during deficit
  maintain: 1.6,
  gain: 2.0,
};

const FAT_PERCENT = 0.25; // 25% of calories from fat
const CAL_PER_G_PROTEIN = 4;
const CAL_PER_G_CARBS = 4;
const CAL_PER_G_FAT = 9;

function getActivityMultiplier(trainingDays: number): number {
  const clamped = Math.max(0, Math.min(7, Math.round(trainingDays)));
  return ACTIVITY_MULTIPLIERS[clamped] ?? 1.2;
}

/**
 * Mifflin-St Jeor equation for BMR (kcal/day)
 * Men: (10 × weight kg) + (6.25 × height cm) − (5 × age) + 5
 * Women: (10 × weight kg) + (6.25 × height cm) − (5 × age) − 161
 */
function mifflinStJeorBMR(
  weight: number,
  height: number,
  age: number,
  gender: Gender
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

export function calculateMacros(input: CalculateMacrosInput): CalculateMacrosOutput {
  const { weight, height, age, goal, trainingDays, gender } = input;

  const bmr = mifflinStJeorBMR(weight, height, age, gender);
  const activityMultiplier = getActivityMultiplier(trainingDays);
  const tdee = bmr * activityMultiplier;
  const calories = Math.max(1200, Math.round(tdee + GOAL_CALORIE_ADJUSTMENT[goal]));

  const proteinG = Math.round(weight * PROTEIN_PER_KG[goal]);
  const proteinCal = proteinG * CAL_PER_G_PROTEIN;

  const fatCal = calories * FAT_PERCENT;
  const fatG = Math.round(fatCal / CAL_PER_G_FAT);

  const carbsCal = Math.max(0, calories - proteinCal - fatCal);
  const carbsG = Math.round(carbsCal / CAL_PER_G_CARBS);

  return {
    calories,
    protein: proteinG,
    carbs: carbsG,
    fat: fatG,
  };
}
