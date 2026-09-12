import { getIronSession } from "iron-session";
import { NextResponse, type NextRequest } from "next/server";

import { resolveRoute } from "@/lib/route-guard";
import { sessionOptions, type SessionData } from "@/lib/session";

/**
 * Central route guard for the authenticated areas. All decision logic lives in
 * `src/lib/route-guard.ts`; this only reads the session cookie and
 * turns the outcome into a response.
 *
 * The session is only ever persisted for an *active* account (see the login
 * action), so middleware needs nothing more than "logged in?" + "which role?".
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  const outcome = resolveRoute(
    {
      isLoggedIn: Boolean(session.isLoggedIn),
      role: session.user?.role ?? null,
      sellerPending: session.user?.sellerPending,
    },
    request.nextUrl.pathname,
  );

  if (outcome.type === "redirect") {
    return NextResponse.redirect(new URL(outcome.to, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/buyer/:path*", "/seller/:path*", "/admin/:path*"],
};
