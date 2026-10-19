import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { DemoSignInButton } from "@/features/auth/components/demo-sign-in-button";
import { demoAvailable } from "@/features/auth/demo";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "Momentum · A task board for small teams" },
  description:
    "A shared board for small teams: drag tasks through four columns, invite teammates, and see everything assigned to you across projects.",
};

const PREVIEW = [
  {
    label: "Todo",
    badge: "bg-status-todo-bg text-status-todo",
    cards: [
      { title: "Write launch announcement", meta: "Due 24 Oct" },
      { title: "Pick a pricing page layout", meta: "MR" },
    ],
  },
  {
    label: "In progress",
    badge: "bg-status-progress-bg text-status-progress",
    cards: [{ title: "Onboarding emails", meta: "Urgent · Due 21 Oct", urgent: true }],
  },
  {
    label: "In review",
    badge: "bg-status-review-bg text-status-review",
    cards: [{ title: "New sign-up flow", meta: "High · AK" }],
  },
  {
    label: "Done",
    badge: "bg-status-done-bg text-status-done",
    cards: [
      { title: "Set up analytics", meta: "SR" },
      { title: "Domain and DNS", meta: "MR" },
    ],
  },
];

const FEATURES = [
  {
    title: "Drag, drop, done",
    body: "Moves save instantly. If the server says no, the card slides back and you're told why.",
  },
  {
    title: "Works without a mouse",
    body: "Pick up a card with Space, move it with the arrow keys. Screen readers hear every step.",
  },
  {
    title: "Built for teams",
    body: "Invite people by email as Owners, Admins or Members. A project always keeps an owner.",
  },
  {
    title: "My work",
    body: "Everything assigned to you across every project, overdue first, in your own time zone.",
  },
  {
    title: "Private by default",
    body: "Projects exist only for their members. Everyone else gets a plain 404, not a hint.",
  },
  {
    title: "Due dates that stay put",
    body: "A task due on the 20th is due on the 20th, wherever your teammates are.",
  },
];

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <span className="font-mono text-xs font-semibold tracking-widest uppercase">
            Momentum
          </span>
          <nav aria-label="Account" className="flex items-center gap-2">
            {session ? (
              <Link href="/projects" className={buttonVariants({ size: "sm" })}>
                Open your projects
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  Sign in
                </Link>
                <Link href="/sign-up" className={buttonVariants({ size: "sm" })}>
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-20 px-4 py-16 sm:py-24">
        <section className="grid max-w-2xl gap-6">
          <p className="font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            A task board for small teams
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Move work forward, together.
          </h1>
          <p className="max-w-xl text-lg text-ink-2">
            One shared board per project. Drag tasks from Todo to Done, invite your team, and keep
            an eye on everything that&apos;s yours.
          </p>
          <div className="flex flex-wrap gap-3">
            {session ? (
              <Link href="/projects" className={buttonVariants({ size: "lg" })}>
                Open your projects
              </Link>
            ) : (
              <>
                <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
                  Create a free account
                </Link>
                {demoAvailable() && <DemoSignInButton size="lg" variant="outline" />}
              </>
            )}
          </div>
        </section>

        {/* A static picture of a board, made of the same colours as the real one */}
        <section aria-label="What a board looks like" className="-mx-4 overflow-x-auto px-4">
          <div className="grid min-w-176 grid-cols-4 gap-3 rounded-xl border bg-card/40 p-3">
            {PREVIEW.map((column) => (
              <div key={column.label} className="grid content-start gap-2 rounded-lg border p-3">
                <span
                  className={`w-fit rounded-sm px-2 py-0.5 font-mono text-[11px] font-semibold tracking-widest uppercase ${column.badge}`}
                >
                  {column.label}
                </span>
                {column.cards.map((card) => (
                  <div
                    key={card.title}
                    className="grid gap-2 rounded-md border bg-card p-3 text-sm"
                  >
                    <span>{card.title}</span>
                    <span
                      className={`font-mono text-[11px] ${"urgent" in card ? "text-status-overdue" : "text-muted-foreground"}`}
                    >
                      {card.meta}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8">
          <h2 className="text-2xl font-semibold tracking-tight">What it does well</h2>
          <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="grid gap-1 border-t pt-4">
                <h3 className="font-medium">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 font-mono text-xs text-muted-foreground">
          <span>Momentum · built with Next.js, Prisma and Postgres</span>
          <a
            href="https://github.com/mohtasim22/momentum"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
