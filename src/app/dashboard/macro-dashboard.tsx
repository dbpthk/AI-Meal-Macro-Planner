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

export function MacroDashboard({ data }: { data: DashboardData }) {
  const { target, todayLog, weightData, weeklyLogs } = data;
  const calTarget = target?.calories ?? 0;
  const proteinTarget = target?.proteinG ?? 0;
  const carbsTarget = target?.carbsG ?? 0;
  const fatTarget = target?.fatG ?? 0;

  const progress = (current: number, targetVal: number) =>
    targetVal > 0 ? Math.min(100, (current / targetVal) * 100) : 0;

  const weeklyTotal = weeklyLogs.reduce((s, d) => s + d.calories, 0);
  const weeklyAvg = weeklyLogs.length ? weeklyTotal / weeklyLogs.length : 0;

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
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{label}</span>
                  <span>
                    {current} / {targetVal} {unit}
                  </span>
                </div>
                <Progress value={progress(current, targetVal)} />
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
      {weightData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Weight trend</CardTitle>
            <CardDescription>Your weight over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
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
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Weight trend</CardTitle>
            <CardDescription>Log your weight to see trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No weight data yet. Add weight entries from your profile setup.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Weekly calorie summary */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly calorie summary</CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              <strong>Total:</strong> {Math.round(weeklyTotal)} kcal
            </span>
            <span>
              <strong>Avg/day:</strong> {Math.round(weeklyAvg)} kcal
            </span>
          </div>
          {weeklyLogs.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyLogs}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="loggedAt" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="calories"
                    fill="var(--color-chart-2)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Log your meals to see daily calorie breakdown.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
