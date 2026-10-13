import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { getSession } from "@/lib/session";

const statuses = [
  { label: "Todo", className: "bg-status-todo-bg text-status-todo" },
  { label: "In progress", className: "bg-status-progress-bg text-status-progress" },
  { label: "In review", className: "bg-status-review-bg text-status-review" },
  { label: "Done", className: "bg-status-done-bg text-status-done" },
  { label: "Overdue", className: "bg-status-overdue-bg text-status-overdue" },
];

// Temporary home page. The real landing page comes in step 8.1.
export default async function Home() {
  // Reads the session cookie from this request, so Next.js renders this page
  // per request instead of at build time.
  const session = await getSession();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2">
        <p className="font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Momentum · dev home
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">A task board for small teams.</h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4">
        {session ? (
          <>
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-semibold tracking-widest text-status-done uppercase">
                Signed in
              </p>
              <p className="truncate">
                {session.user.name}{" "}
                <span className="text-muted-foreground">· {session.user.email}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/projects" className={buttonVariants({ size: "sm" })}>
                Open projects
              </Link>
              <SignOutButton />
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">You&apos;re not signed in.</p>
            <div className="flex gap-2">
              <Link href="/sign-in" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Sign in
              </Link>
              <Link href="/sign-up" className={buttonVariants({ size: "sm" })}>
                Sign up
              </Link>
            </div>
          </>
        )}
      </div>

      <ul className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <li
            key={status.label}
            className={`rounded-sm px-2 py-0.5 font-mono text-xs font-semibold ${status.className}`}
          >
            {status.label}
          </li>
        ))}
      </ul>
    </main>
  );
}
