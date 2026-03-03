"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@db/index";
import { profiles, weightLogs } from "@db/schema";
import { eq } from "drizzle-orm";
import { adjustMacrosForUser } from "@/lib/adjustMacros";

const profileSchema = z.object({
  weight: z.coerce.number().min(30).max(300),
  height: z.coerce.number().min(100).max(250),
  age: z.coerce.number().min(13).max(120),
  gender: z.enum(["male", "female"]),
  goal: z.enum(["lose", "maintain", "gain"]),
  trainingDays: z.coerce.number().min(0).max(7).int(),
});

export type SubmitProfileState = {
  success?: boolean;
  error?: string;
};

export async function submitProfileSetup(
  _prevState: SubmitProfileState | null,
  formData: FormData
): Promise<SubmitProfileState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = profileSchema.safeParse(raw);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Invalid input" };
  }

  const { weight, height, age, gender, goal, trainingDays } = parsed.data;

  const birthDate = new Date();
  birthDate.setFullYear(birthDate.getFullYear() - age);
  const birthDateStr = birthDate.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  try {
    const [existing] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .limit(1);

    if (existing) {
      await db
        .update(profiles)
        .set({
          heightCm: height,
          gender,
          birthDate: birthDateStr,
          goal,
          activityLevel: String(trainingDays),
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, session.user.id));
    } else {
      await db.insert(profiles).values({
        userId: session.user.id,
        heightCm: height,
        gender,
        birthDate: birthDateStr,
        goal,
        activityLevel: String(trainingDays),
      });
    }

    await db
      .insert(weightLogs)
      .values({
        userId: session.user.id,
        weightKg: weight,
        loggedAt: today,
      })
      .onConflictDoUpdate({
        target: [weightLogs.userId, weightLogs.loggedAt],
        set: { weightKg: weight },
      });

    await adjustMacrosForUser(session.user.id);
    return { success: true };
  } catch (err) {
    console.error("Profile setup failed:", err);
    return { error: "Failed to save profile." };
  }
}
