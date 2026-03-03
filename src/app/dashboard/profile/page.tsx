import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold sm:text-xl">Profile setup</h2>
      <Card>
        <CardHeader>
          <CardTitle>Set your stats</CardTitle>
          <CardDescription>
            Enter weight, height, goal, and training days to calculate your
            daily macros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Profile setup form coming soon. Use the dashboard to view your macro
            targets once set.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
