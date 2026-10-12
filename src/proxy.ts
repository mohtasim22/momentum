import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Runs before matching requests render. It only checks that a session cookie
// EXISTS. It can't tell if the session is still valid without asking the
// database, which would be too slow to do on every request. So this is a
// fast first filter for the UX; requireUser() in each page is the real check.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/projects/:path*", "/my-work/:path*"],
};
