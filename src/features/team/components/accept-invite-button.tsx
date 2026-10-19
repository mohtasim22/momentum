"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "../actions";

export function AcceptInviteButton({ token, projectName }: { token: string; projectName: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function handleAccept() {
    startTransition(async () => {
      // On success the action redirects to the board, so only errors come back
      const result = await acceptInvite(token);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="grid gap-3">
      <Button type="button" onClick={handleAccept} disabled={pending} className="w-full">
        {pending ? "Joining…" : `Join ${projectName}`}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
