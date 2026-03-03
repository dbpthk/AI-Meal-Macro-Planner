import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@db/index";
import { profiles, weightLogs } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  const [latestWeight] = await db
    .select({ weightKg: weightLogs.weightKg })
    .from(weightLogs)
    .where(eq(weightLogs.userId, session.user.id))
    .orderBy(desc(weightLogs.loggedAt))
    .limit(1);

  let initialAge: number | null = null;
  if (profile?.birthDate) {
    const birth = new Date(profile.birthDate);
    initialAge = Math.floor(
      (Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile setup"
        description="Enter weight, height, goal, and training days"
        backHref="/dashboard"
      />
      <ProfileForm
        initialWeight={latestWeight?.weightKg}
        initialHeight={profile?.heightCm}
        initialAge={initialAge}
        initialGender={profile?.gender}
        initialGoal={profile?.goal}
        initialTrainingDays={profile?.activityLevel}
      />
    </div>
  );
}
