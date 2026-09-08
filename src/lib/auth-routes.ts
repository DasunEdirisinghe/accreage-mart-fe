import type { PrimaryRole } from "@/lib/session";

/** Where each role lands after signing in. Single source of truth — the login
 *  action, middleware, and the site header all read this. */
export const ROLE_HOME: Record<PrimaryRole, string> = {
  buyer: "/buyer",
  seller: "/seller",
  staff: "/admin",
  admin: "/admin",
};

export function roleHome(role: PrimaryRole | null | undefined): string {
  return role ? ROLE_HOME[role] : "/";
}
