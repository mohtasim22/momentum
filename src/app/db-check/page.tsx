import type { Metadata } from "next";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Database check" };

type DbInfo = { version: string; database: string; now: Date };

// Data work lives outside the component: components should only turn data
// into UI. Timing with performance.now() inside one breaks React's purity rule.
async function checkDatabase() {
  const started = performance.now();
  const [info] = await prisma.$queryRaw<DbInfo[]>`
    SELECT version() AS version, current_database() AS database, now() AS now
  `;
  return { ...info, ms: Math.round(performance.now() - started) };
}

export default async function DbCheckPage() {
  // Without this, `next build` would run the query once at build time
  // and bake the result into static HTML. We want a live answer per request.
  await connection();

  const db = await checkDatabase();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-6 py-16">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-status-done">
        Database connected
      </p>
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 rounded-lg border bg-card p-4 font-mono text-sm">
        <dt className="text-muted-foreground">database</dt>
        <dd>{db.database}</dd>
        <dt className="text-muted-foreground">server time</dt>
        <dd>{db.now.toISOString()}</dd>
        <dt className="text-muted-foreground">round trip</dt>
        <dd>{db.ms} ms</dd>
        <dt className="text-muted-foreground">version</dt>
        <dd className="text-ink-2">{db.version}</dd>
      </dl>
    </main>
  );
}
