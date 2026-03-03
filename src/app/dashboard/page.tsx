import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "./sign-out-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold sm:text-xl">Overview</h2>
        <SignOutButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Account
            </CardTitle>
            <CardDescription>
              Manage your profile and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="min-w-0 truncate text-sm">
              Signed in as{" "}
              <span className="font-medium">{session.user.email}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick actions
            </CardTitle>
            <CardDescription>
              Get started with your meal planning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link href="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Meal Macro Planner
            </CardTitle>
            <CardDescription>
              Your personalized nutrition dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              More features coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
