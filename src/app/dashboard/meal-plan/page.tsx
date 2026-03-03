import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MealPlanForm } from "./meal-plan-form";

export default async function MealPlanPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold sm:text-xl">AI Meal Plan</h2>
          <p className="text-sm text-muted-foreground">
            Generate a 7-day meal plan based on your macro targets
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">← Dashboard</Link>
        </Button>
      </div>

      <MealPlanForm />
    </div>
  );
}
