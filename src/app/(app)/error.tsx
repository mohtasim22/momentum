"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

// Catches unexpected errors in any signed-in page and keeps the header, so
// the user is never stuck on a blank screen. The real error is logged on the
// server; the browser only gets a short reference (the digest).
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid justify-items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
      <p className="font-mono text-[11px] font-semibold tracking-widest text-status-overdue uppercase">
        Something went wrong
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        That didn&apos;t work, and it&apos;s not something you did. Try again, and if it keeps
        happening, come back in a minute.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/projects" className={buttonVariants({ variant: "outline" })}>
          Your projects
        </Link>
      </div>
    </div>
  );
}
