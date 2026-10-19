# Security

Momentum is a multi-tenant app: every team's projects must be invisible and
untouchable to everyone else. This document is the audit: the rule, where
it's enforced, what was tested, and what was found.

## The rule

> Every read and write of project data goes through
> `requireMembership(projectId)` on the server. It loads the session user and
> their `Membership` row for that project, or calls `notFound()`.

- **404, not 403.** A stranger can't tell "exists but not yours" from "doesn't exist".
- **Child records are found through the project.** Tasks, invites and memberships are always looked up with the project id in the `WHERE` clause, never by id alone, so an id from another team finds nothing (no IDOR).
- **Server Actions are public POST endpoints.** Each one re-validates its input with Zod and re-checks membership and role, whatever the UI showed.
- **Checks live in the data layer, not in layouts or `proxy.ts`.** Layouts don't re-run on client navigation, and the proxy only checks that a session cookie exists.
- **Role rules are pure functions** (`src/lib/permissions.ts`) shared by the pages (to hide buttons) and the actions (to enforce).

## Inventory

### Pages

| Route                       | Who                            | Enforced by                                                                                                                    |
| --------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `/`, `/sign-in`, `/sign-up` | Anyone                         | `?next=` only followed if it's a same-site path (`safeNextPath`)                                                               |
| `/invite/[token]`           | Anyone with the link           | Token looked up by SHA-256 hash; shows only project name, inviter and invited email; `noindex`, `Referrer-Policy: no-referrer` |
| `/projects`                 | Signed in                      | `requireUser()`; list filtered by membership                                                                                   |
| `/projects/[id]` (board)    | Members                        | `requireMembership` (also in `generateMetadata`, so the tab title can't leak the name)                                         |
| `/projects/[id]/settings`   | Members (actions: Owner/Admin) | `requireMembership` + `can()`                                                                                                  |
| `/projects/[id]/members`    | Members                        | `requireMembership`; allowed actions computed on the server                                                                    |
| `/my-work`                  | Signed in                      | `requireUser()`; tasks filtered by assignee **and** current membership                                                         |
| `/api/auth/*`               | Anyone                         | Better Auth (origin check, its own rate limits)                                                                                |

### Server Actions

| Action                            | Checks, in order                                                                                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `signUp`, `signIn`                | Rate limit (per IP; sign-in also per email) → Zod → Better Auth. One message for wrong password and unknown email                                                           |
| `signOut`                         | POST only (Server Action) → `next` validated                                                                                                                                |
| `createProject`                   | `requireUser` → Zod → project + owner membership in one nested write                                                                                                        |
| `renameProject` / `deleteProject` | Membership → `can()` → Zod → (delete) typed name must match the database                                                                                                    |
| `createTask`                      | Membership → Zod (status is an enum) → position computed on the server                                                                                                      |
| `updateTask`                      | Membership → task found **in this project** → Zod → assignee must be a member of this project                                                                               |
| `deleteTask`                      | Membership → task in this project → `canDeleteTask` (owner/admin, or the task's creator)                                                                                    |
| `moveTask`                        | Membership → task in this project → neighbours must be in this project **and** the target column → position computed from their real positions (the client never sends one) |
| `inviteMember`                    | Membership → `can()` → role must be one the inviter may grant → rate limit → token stored only as a hash                                                                    |
| `revokeInvite`                    | Membership → `can()` → delete scoped to this project                                                                                                                        |
| `acceptInvite`                    | Signed in → token hash → unused and unexpired → email matches the session → claimed atomically (`UPDATE … WHERE acceptedAt IS NULL`)                                        |
| `changeRole` / `removeMember`     | Membership → target found in this project → role rules → **last-owner rule counted under a row lock** (`SELECT … FOR UPDATE`) in the same transaction                       |

## Tests

`npm run test:integration` runs the real server actions and queries against a
real Postgres database (only the Next.js request layer is stubbed):

- **`cross-tenant.int.test.ts`**: Bob tries to read and change Alice's project by URL and by calling every action with forged arguments, including IDOR attempts that pass his own project id with her task, invite and membership ids. All refused, and the database is checked unchanged afterwards.
- **`roles.int.test.ts`**: what Members and Admins can't do, plus two **race** tests: two owners demoting each other, and two owners leaving, at the same moment.
- **`rate-limit.int.test.ts`**: limits hold under 20 parallel requests; sign-in locks an email after 5 failures.

The tests were checked against deliberately broken code:

| Mutation                                  | Result                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| Look tasks up by `id` only (classic IDOR) | `can't edit, delete or move her task through his own project` **fails** |
| Remove `FOR UPDATE` from the owner count  | Both race tests **fail**: the project ends up with **zero owners**      |

## Findings

| #   | Finding                                                                                                                                                                                                      | Status                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Sign-in had no rate limit.** Better Auth rate-limits its HTTP router, but sign-in and sign-up are Server Actions calling `auth.api` directly, which bypasses it. Passwords could be guessed without limit. | **Fixed.** Database-backed fixed-window limiter (`src/lib/rate-limit.ts`): one atomic `INSERT … ON CONFLICT` per attempt, shared by all serverless instances. Also caps invite emails. |
| 2   | **Last-owner rule was a check-then-act race.** Two owners demoting each other at once would both see "2 owners".                                                                                             | **Fixed** before release with a row lock; proven by the race tests.                                                                                                                    |
| 3   | **Invite accepted twice at once** could create duplicate work.                                                                                                                                               | **Fixed:** atomic claim plus `upsert` on the unique `(userId, projectId)`.                                                                                                             |
| 4   | **Project name in the tab title of a 404.** `generateMetadata` is a second entry point to the same page.                                                                                                     | **Fixed:** it calls `requireMembership` too.                                                                                                                                           |

## Known limits

- **Email addresses are not verified.** Anyone can register any address. Accepting an invite needs the secret token **and** a matching email, so a stolen address alone isn't enough, but email ownership isn't proven. Next step: Better Auth email verification once a sending domain is set up.
- **Per-IP limits trust `x-forwarded-for`.** That's correct behind Vercel, which sets it; elsewhere it could be spoofed (the per-email limit still applies).
- **No cleanup job for `rate_limit`.** Rows are tiny and reused per key; a periodic delete of old windows would be the fix at scale.
