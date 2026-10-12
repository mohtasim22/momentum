import Link from "next/link";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireUser } from "@/lib/session";

// Shell for every signed-in page. It reads the user to show their name; the
// page underneath still calls requireUser() itself, because a layout doesn't
// re-run when you navigate between the pages it wraps.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/projects" className="font-mono text-xs font-semibold uppercase tracking-widest">
            Momentum
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-sm text-muted-foreground">{user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
