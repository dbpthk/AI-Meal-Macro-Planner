import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 w-full max-w-md text-center sm:mb-8">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
        >
          AI Meal Macro Planner
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
