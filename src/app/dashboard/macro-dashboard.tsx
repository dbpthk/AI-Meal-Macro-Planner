"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import type { DashboardData } from "./actions/dashboard";
import { WeightLogForm } from "./weight-log-form";

function formatWeightDate(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MacroDashboard({ data }: { data: DashboardData }) {
  const { target, todayLog, weightData, weeklyLogs } = data;
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = weightData.find((w) => w.loggedAt === today);
  const calTarget = target?.calories ?? 0;
  const proteinTarget = target?.proteinG ?? 0;
  const carbsTarget = target?.carbsG ?? 0;
  const fatTarget = target?.fatG ?? 0;

  const progress = (current: number, targetVal: number) =>
    targetVal > 0 ? Math.min(100, (current / targetVal) * 100) : 0;

  const weeklyTotal = weeklyLogs.reduce((s, d) => s + d.calories, 0);

  const hasTargets = calTarget > 0 || proteinTarget > 0;

  return (
    <div className="space-y-6">
      {/* Daily macros + progress */}
      <Card>
        <CardHeader>
          <CardTitle>Daily macros</CardTitle>
          <CardDescription>
            Your progress toward today&apos;s macro targets. Targets are
            auto-calculated from your profile and weight trend—not editable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasTargets ? (
            [
              {
                label: "Calories",
                current: todayLog.calories,
                target: calTarget,
                unit: "kcal",
              },
              {
                label: "Protein",
                current: todayLog.proteinG,
                target: proteinTarget,
                unit: "g",
              },
              {
                label: "Carbs",
                current: todayLog.carbsG,
                target: carbsTarget,
                unit: "g",
              },
              {
                label: "Fat",
                current: todayLog.fatG,
                target: fatTarget,
                unit: "g",
              },
            ].map(({ label, current, target: targetVal, unit }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span>{label}</span>
                  <span>
                    {current} / {targetVal} {unit}
                  </span>
                </div>
                <Progress
                  value={progress(current, targetVal)}
                  aria-label={`${label}: ${current} of ${targetVal} ${unit}`}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Set up your profile to see macro targets and track progress.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Weight trend */}
      <Card>
        <CardHeader>
          <CardTitle>Weight trend</CardTitle>
          <CardDescription>
            Your weight over the last 30 days. Add or update entries below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <WeightLogForm
            initialWeight={todayEntry?.weightKg}
            initialDate={today}
          />
          {weightData.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Saved entries (last 30 days)
              </p>
              <ul className="max-h-32 overflow-y-auto rounded-md border bg-muted/30 p-2 text-sm">
                {[...weightData]
                  .reverse()
                  .map(({ loggedAt, weightKg }) => (
                    <li
                      key={loggedAt}
                      className="flex justify-between py-1.5 odd:bg-background/50 rounded px-2 -mx-2"
                    >
                      <span>{formatWeightDate(loggedAt)}</span>
                      <span className="font-medium">{weightKg} kg</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
          {weightData.length > 0 ? (
            <div className="min-h-48 w-full overflow-x-auto sm:min-h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={280}>
                <LineChart data={weightData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="loggedAt" />
                  <YAxis domain={["auto", "auto"]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="weightKg"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Log your weight above to see trends over time.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Weekly calorie summary */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly calorie summary</CardTitle>
          <CardDescription>
            Mon–Sun · {formatWeightDate(weeklyLogs[0]?.loggedAt ?? "")} –{" "}
            {formatWeightDate(weeklyLogs[6]?.loggedAt ?? "")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="rounded-md border bg-muted/30 p-2 text-sm">
            {weeklyLogs.map(({ loggedAt, dayName, calories }) => (
              <li
                key={loggedAt}
                className="flex justify-between items-center py-2 odd:bg-background/50 rounded px-2 -mx-2"
              >
                <span className="flex gap-3">
                  <span className="w-9 font-medium">{dayName}</span>
                  <span className="text-muted-foreground">
                    {formatWeightDate(loggedAt)}
                  </span>
                </span>
                <span className="font-medium">{Math.round(calories)} kcal</span>
              </li>
            ))}
            <li
              key="total"
              className="flex justify-between items-center py-2 mt-2 pt-2 border-t font-semibold rounded px-2 -mx-2 bg-primary/5"
            >
              <span>Total</span>
              <span>{Math.round(weeklyTotal)} kcal</span>
            </li>
          </ul>
          {weeklyLogs.some((d) => d.calories > 0) && (
            <div className="min-h-40 w-full overflow-x-auto sm:min-h-48">
              <ResponsiveContainer width="100%" height="100%" minWidth={280}>
                <BarChart data={weeklyLogs}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="dayName" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number | undefined) => [`${Math.round(value ?? 0)} kcal`, "Calories"]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.loggedAt
                        ? formatWeightDate(payload[0].payload.loggedAt)
                        : ""
                    }
                  />
                  <Bar
                    dataKey="calories"
                    fill="var(--color-chart-2)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {!weeklyLogs.some((d) => d.calories > 0) && (
            <p className="text-sm text-muted-foreground">
              Log your meals to see daily calorie breakdown.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
