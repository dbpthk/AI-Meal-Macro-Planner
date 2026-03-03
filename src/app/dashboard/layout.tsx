import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b border-border/40 bg-muted/30 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-base font-semibold sm:text-lg">Dashboard</h1>
            <p className="truncate text-sm text-muted-foreground">
              Welcome back, {session.user.name ?? session.user.email}
            </p>
          </div>
          <Link
            href="/"
            className="self-start text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:self-auto"
          >
            ← Home
          </Link>
        </div>
      </div>
      <div className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </div>
  );
}
