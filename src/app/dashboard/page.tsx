import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            Welcome, {session.user.name ?? session.user.email}
          </h1>
          <SignOutButton />
        </div>
        <p className="text-muted-foreground">
          You&apos;re signed in. This is your protected dashboard.
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
