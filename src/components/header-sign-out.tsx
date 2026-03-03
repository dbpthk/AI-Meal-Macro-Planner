"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function HeaderSignOut() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}
