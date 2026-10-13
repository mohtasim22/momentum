import "dotenv/config"; // loads .env into process.env, must come first
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env["DATABASE_URL"] }, // used by migrate / studio
});
