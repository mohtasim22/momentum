import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Understand the "@/..." imports from tsconfig.json
    tsconfigPaths: true,
  },
  test: {
    // Pure logic only for now: no browser, no database
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
