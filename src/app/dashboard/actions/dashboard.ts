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
  weeklyLogs: { loggedAt: string; dayName: string; calories: number }[];
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

  // Current week: Monday to Sunday
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  const weekStart = monday.toISOString().slice(0, 10);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekEnd = sunday.toISOString().slice(0, 10);

  const weeklyLogsRaw = await db
    .select({ loggedAt: dailyLogs.loggedAt, calories: dailyLogs.calories })
    .from(dailyLogs)
    .where(
      and(
        eq(dailyLogs.userId, userId),
        gte(dailyLogs.loggedAt, weekStart),
        lte(dailyLogs.loggedAt, weekEnd)
      )
    )
    .orderBy(dailyLogs.loggedAt);

  const logsByDate = Object.fromEntries(
    weeklyLogsRaw.map((r) => [r.loggedAt, r.calories ?? 0])
  );

  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyLogs: { loggedAt: string; dayName: string; calories: number }[] =
    [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    weeklyLogs.push({
      loggedAt: dateStr,
      dayName: DAY_NAMES[i],
      calories: logsByDate[dateStr] ?? 0,
    });
  }

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
    weeklyLogs,
  };
}
