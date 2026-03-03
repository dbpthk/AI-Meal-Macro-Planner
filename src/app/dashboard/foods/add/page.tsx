import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { AddFoodForm } from "./add-food-form";

export default async function AddFoodPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add food" backHref="/dashboard" />
      <AddFoodForm />
    </div>
  );
}
