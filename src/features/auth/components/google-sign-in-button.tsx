"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

// Sends the browser to Google, which sends it back to /api/auth/callback/google;
// Better Auth then creates the session and redirects to `next`.
export function GoogleSignInButton({ next }: { next?: string }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: next ?? "/projects",
    });
    if (error) {
      setPending(false);
      toast.error(error.message ?? "Couldn't reach Google. Try again.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? "Redirecting to Google…" : "Continue with Google"}
    </Button>
  );
}
