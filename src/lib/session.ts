/**
 * Frontend session: an encrypted, httpOnly `accreage_session` cookie (iron-session).
 *
 * The browser never sees the raw Frappe `sid`. Login happens in a server action,
 * the Frappe `sid` is copied into this encrypted cookie, and every authenticated
 * backend call attaches it from server code via `frappeFetch`.
 *
 * Server-only: this module reads the cookie store. Never import it into a client
 * component — pass a `ClientSession` (which omits `frappeSid`) down as props instead.
 */

import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

import type { Role } from "@/lib/types";

export type PrimaryRole = Exclude<Role, "public">;

export interface SessionUser {
  /** Frappe user id — the email address. */
  id: string;
  email: string;
  fullName: string;
  /** Primary role for routing, derived server-side. Null = no persona role. */
  role: PrimaryRole | null;
}

export interface SessionData {
  frappeSid?: string;
  user?: SessionUser;
  isLoggedIn: boolean;
}

/** Everything a client component may see — never the Frappe sid. */
export type ClientSession = Omit<SessionData, "frappeSid">;

const SECRET = process.env.SECRET_COOKIE_PASSWORD;

export const sessionOptions: SessionOptions = {
  // iron-session validates length (>= 32) when a session is actually read/written.
  password: SECRET ?? "",
  cookieName: "accreage_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};

export async function getSession() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (session.isLoggedIn === undefined) {
    session.isLoggedIn = false;
  }
  return session;
}

export function toClientSession(session: SessionData): ClientSession {
  const { frappeSid: _frappeSid, ...clientSafe } = session;
  return clientSafe;
}
