import { roleHome } from "@/lib/auth-routes";
import type { PrimaryRole } from "@/lib/session";

/**
 * Pure route-guard logic. `src/middleware.ts` is a thin shell over this so the
 * decision table is unit-testable without the edge runtime.
 */

export interface GuardSession {
  isLoggedIn: boolean;
  role: PrimaryRole | null;
}

export type GuardResult = { type: "allow" } | { type: "redirect"; to: string };

interface ProtectedArea {
  prefix: string;
  roles: PrimaryRole[];
}

const PROTECTED_AREAS: ProtectedArea[] = [
  { prefix: "/buyer", roles: ["buyer"] },
  { prefix: "/seller", roles: ["seller"] },
  { prefix: "/admin", roles: ["staff", "admin"] },
];

const PUBLIC_EXACT = new Set([
  "/",
  "/about",
  "/contact",
  "/login",
  "/register",
  "/forgot-password",
  "/set-password",
]);

const PUBLIC_PREFIXES = [
  "/marketplace",
  "/auctions",
  "/sellers",
  "/legal",
  "/account",
  "/api",
  "/_next",
];

export function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function areaFor(pathname: string): ProtectedArea | undefined {
  return PROTECTED_AREAS.find(
    (area) => pathname === area.prefix || pathname.startsWith(`${area.prefix}/`),
  );
}

export function resolveRoute(session: GuardSession, pathname: string): GuardResult {
  if (isPublic(pathname)) return { type: "allow" };

  const area = areaFor(pathname);
  if (!area) return { type: "allow" };

  if (!session.isLoggedIn) {
    return { type: "redirect", to: `/login?next=${encodeURIComponent(pathname)}` };
  }

  if (!session.role || !area.roles.includes(session.role)) {
    // Signed in but wrong area — send them to their own home ("/" if role-less).
    return { type: "redirect", to: roleHome(session.role) };
  }

  return { type: "allow" };
}
