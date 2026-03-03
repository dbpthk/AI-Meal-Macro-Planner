import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        title="AI Meal Plan"
        description="Generate a 7-day meal plan based on your macro targets"
        backHref="/dashboard"
      />
      <MealPlanForm />
    </div>
  );
}
