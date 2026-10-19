import { execSync } from "node:child_process";
import "dotenv/config";

// Runs once before all integration tests: point everything at the test
// database and bring its schema up to date with the real migrations.
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Integration tests need their own database: they wipe it.",
    );
  }
  if (url === process.env.DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL must not be the same database as DATABASE_URL.");
  }

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
