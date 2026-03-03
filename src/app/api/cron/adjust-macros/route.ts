import { NextResponse } from "next/server";
import { adjustMacrosForAllUsers } from "@/lib/adjustMacros";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await adjustMacrosForAllUsers();
    return NextResponse.json({
      success: true,
      processed: result.processed,
      updated: result.updated,
      errors: result.errors,
    });
  } catch (err) {
    console.error("Cron adjust-macros failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
