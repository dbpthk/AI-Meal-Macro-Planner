import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.55_0.14_165/0.15),transparent)]" />
        <div className="mx-auto w-full max-w-2xl space-y-6 text-center sm:space-y-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            AI Meal Macro Planner
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg md:text-xl">
            Plan meals, hit your macros, and reach your goals with AI-powered
            nutrition guidance.
          </p>
          {session ? (
            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:gap-4">
              <Button asChild size="lg" className="h-11 w-full px-6 sm:w-auto sm:px-8">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
              <Button asChild size="lg" className="h-11 w-full px-6 sm:w-auto sm:px-8">
                <Link href="/signup">Get started</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 w-full px-6 sm:w-auto sm:px-8">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
