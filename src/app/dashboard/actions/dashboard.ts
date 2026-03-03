import { db } from "@db/index";
import {
  dailyLogs,
  macroTargets,
  weightLogs,
} from "@db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";

export type DashboardData = {
  target: {
    calories: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
  } | undefined;
  todayLog: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  weightData: { loggedAt: string; weightKg: number }[];
  weeklyLogs: { loggedAt: string; calories: number }[];
};

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const today = new Date().toISOString().slice(0, 10);

  const [target] = await db
    .select()
    .from(macroTargets)
    .where(eq(macroTargets.userId, userId))
    .orderBy(desc(macroTargets.createdAt))
    .limit(1);

  const [todayLog] = await db
    .select()
    .from(dailyLogs)
    .where(
      and(
        eq(dailyLogs.userId, userId),
        eq(dailyLogs.loggedAt, today)
      )
    );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const weightData = await db
    .select({ loggedAt: weightLogs.loggedAt, weightKg: weightLogs.weightKg })
    .from(weightLogs)
    .where(
      and(
        eq(weightLogs.userId, userId),
        gte(weightLogs.loggedAt, thirtyDaysAgo.toISOString().slice(0, 10))
      )
    )
    .orderBy(weightLogs.loggedAt);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekStart = weekAgo.toISOString().slice(0, 10);
  const weeklyLogs = await db
    .select({ loggedAt: dailyLogs.loggedAt, calories: dailyLogs.calories })
    .from(dailyLogs)
    .where(
      and(
        eq(dailyLogs.userId, userId),
        gte(dailyLogs.loggedAt, weekStart),
        lte(dailyLogs.loggedAt, today)
      )
    )
    .orderBy(dailyLogs.loggedAt);

  return {
    target,
    todayLog: todayLog ?? {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
    },
    weightData: weightData.map((r) => ({
      loggedAt: r.loggedAt,
      weightKg: r.weightKg ?? 0,
    })),
    weeklyLogs: weeklyLogs.map((r) => ({
      loggedAt: r.loggedAt,
      calories: r.calories ?? 0,
    })),
  };
}
