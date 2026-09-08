/**
 * The single Frappe fetch wrapper. Nothing else calls `fetch` to the backend.
 *
 * Server-only: reads the session cookie for the `sid`. Never import into a client
 * component. See docs/frontend-backend-connection.md and docs/frontend-coding-guide.md.
 */

import { getSession } from "@/lib/session";

export function frappeBaseUrl(): string {
  return process.env.NEXT_PUBLIC_FRAPPE_URL ?? "";
}

export function frappeUrl(pathOrMethod: string): string {
  if (pathOrMethod.startsWith("http")) return pathOrMethod;
  const path = pathOrMethod.startsWith("/") ? pathOrMethod : `/api/method/${pathOrMethod}`;
  return `${frappeBaseUrl()}${path}`;
}

/**
 * Frappe rejected the request as unauthenticated / forbidden. The caller should
 * clear the local session and send the user to /login rather than showing a raw error.
 */
export class FrappeSessionError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Frappe session invalid (${status})`);
    this.name = "FrappeSessionError";
    this.status = status;
  }
}

type FrappeFetchInit = Omit<RequestInit, "body"> & {
  body?: Record<string, unknown>;
  next?: { tags?: string[]; revalidate?: number | false };
  /** Attach the session `sid`. Default true. Set false for guest calls (login, register). */
  auth?: boolean;
};

export async function frappeFetch(
  pathOrMethod: string,
  init: FrappeFetchInit = {},
): Promise<Response> {
  const { body, headers, next, auth = true, ...rest } = init;

  let cookieHeader = "";
  if (auth) {
    const session = await getSession();
    if (session.frappeSid) cookieHeader = `sid=${session.frappeSid}`;
  }

  const res = await fetch(frappeUrl(pathOrMethod), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    next,
  });

  if (res.status === 401 || res.status === 403) {
    throw new FrappeSessionError(res.status);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Frappe request failed: ${res.status} ${text}`);
  }

  return res;
}

export interface FrappeLoginResult {
  ok: boolean;
  /** The Frappe session id, on success. */
  sid?: string;
  fullName?: string;
  /** Frappe's message on failure (not shown to the user verbatim). */
  message?: string;
}

/**
 * Frappe native session login. Kept separate from `frappeFetch` because a 401 here
 * means "wrong credentials" (a normal outcome), not "session dead", and because the
 * caller needs the raw `Set-Cookie` to lift the `sid`.
 */
export async function frappeLogin(usr: string, pwd: string): Promise<FrappeLoginResult> {
  const res = await fetch(frappeUrl("login"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ usr, pwd }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as { message?: string; full_name?: string };

  if (!res.ok) {
    return { ok: false, message: data.message };
  }

  return { ok: true, sid: extractSid(res.headers), fullName: data.full_name };
}

/** Best-effort Frappe logout for a given sid — failures are swallowed. */
export async function frappeLogout(sid: string): Promise<void> {
  try {
    await fetch(frappeUrl("logout"), {
      method: "POST",
      headers: { Cookie: `sid=${sid}`, Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    /* the local session is cleared regardless */
  }
}

function extractSid(headers: Headers): string | undefined {
  const cookies =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [headers.get("set-cookie")].filter((value): value is string => Boolean(value));

  for (const cookie of cookies) {
    const match = /(?:^|;\s*)sid=([^;]+)/.exec(cookie);
    if (match?.[1] && match[1] !== "Guest") return match[1];
  }
  return undefined;
}
