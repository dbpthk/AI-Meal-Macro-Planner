"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@db/index";
import { weightLogs } from "@db/schema";
import { adjustMacrosForUser } from "@/lib/adjustMacros";

const logWeightSchema = z.object({
  weightKg: z.coerce.number().min(20).max(300),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function logWeightAndAdjust(
  weightKg: number,
  date?: string
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const d = date ?? new Date().toISOString().slice(0, 10);
  const parsed = logWeightSchema.safeParse({ weightKg, date: d });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await db
      .insert(weightLogs)
      .values({
        userId: session.user.id,
        weightKg: parsed.data.weightKg,
        loggedAt: parsed.data.date,
      })
      .onConflictDoUpdate({
        target: [weightLogs.userId, weightLogs.loggedAt],
        set: { weightKg: parsed.data.weightKg },
      });

    await adjustMacrosForUser(session.user.id);
    return { success: true };
  } catch (err) {
    console.error("Log weight failed:", err);
    return { error: "Failed to log weight." };
  }
}
