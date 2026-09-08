import { cache } from "react";

import { frappeFetch } from "@/lib/frappe";
import { AUTH_METHODS } from "@/lib/methods";
import { getSession, type PrimaryRole } from "@/lib/session";
import { USER_TAGS } from "@/lib/tags";
import type { UserStatus } from "@/lib/types";

export interface CurrentUserInfo {
  /** Frappe user id — the email address. */
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: PrimaryRole | null;
  status: UserStatus;
  /** Whether the buyer/seller profile is staff-verified. */
  verified: boolean;
}

interface RawUserInfo {
  user: { id: string; email: string; fullName: string; phone: string };
  role: PrimaryRole | null;
  status: UserStatus;
  verified: boolean;
}

/**
 * The signed-in user, read once per request (`React.cache`). Returns null for a
 * guest or if the backend can't be reached — callers render the logged-out view,
 * they never throw.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUserInfo | null> => {
  const session = await getSession();
  if (!session.isLoggedIn || !session.frappeSid) return null;

  try {
    const res = await frappeFetch(AUTH_METHODS.GET_USER_INFO, {
      next: { tags: [USER_TAGS.CURRENT] },
    });
    const info = ((await res.json()) as { message: RawUserInfo }).message;

    // Keep the session's routing flags in step with the backend (e.g. a seller
    // that staff has just verified) so middleware sees the change next request.
    const pending = info.role === "seller" && !info.verified;
    if (session.user && (session.user.sellerPending ?? false) !== pending) {
      session.user.sellerPending = pending;
      session.user.role = info.role;
      await session.save();
    }

    return {
      id: info.user.id,
      email: info.user.email,
      fullName: info.user.fullName,
      phone: info.user.phone,
      role: info.role,
      status: info.status,
      verified: info.verified,
    };
  } catch {
    return null;
  }
});
