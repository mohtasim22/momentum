import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Every request to /api/auth/* (sign-in, sign-out, get-session, OAuth
// callbacks later) is handed to Better Auth.
export const { GET, POST } = toNextJsHandler(auth);
