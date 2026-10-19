import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Integration tests: real Postgres, real Prisma, real server actions.
// Only the Next.js request layer (session, headers, redirects) is stubbed.
// They run against TEST_DATABASE_URL, which is wiped at the start of a run.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // Next.js handles this import itself; outside Next it must be a no-op
      "server-only": fileURLToPath(new URL("./test/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["test/integration/**/*.int.test.ts"],
    globalSetup: ["./test/integration/global-setup.ts"],
    setupFiles: ["./test/integration/setup.ts"],
    // One database, shared: run files one after another
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
