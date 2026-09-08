/**
 * Pull a human-readable message out of a Frappe error response body.
 *
 * Frappe reports errors in a few shapes:
 *  - `_server_messages`: a JSON string holding an array of JSON strings, each
 *    `{ "message": "...", "title": "..." }` (validation errors, `frappe.throw`).
 *  - `message`: a plain string (some API errors).
 *  - `exception`: "ExcType: message" (unhandled server errors in dev).
 */

const FALLBACK = "Something went wrong. Please try again.";

export function parseFrappeError(raw: string): string {
  if (!raw) return FALLBACK;

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Not JSON — a bare string or an HTML error page.
    const text = stripHtml(raw);
    return text.length > 0 && text.length <= 300 ? text : FALLBACK;
  }

  const serverMessages = payload._server_messages;
  if (typeof serverMessages === "string") {
    const messages = parseServerMessages(serverMessages);
    if (messages.length > 0) return messages.join(" ");
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return stripHtml(payload.message);
  }

  if (typeof payload.exception === "string" && payload.exception.trim()) {
    // "frappe.exceptions.ValidationError: Email already exists" -> "Email already exists"
    const separator = payload.exception.indexOf(": ");
    const message = separator >= 0 ? payload.exception.slice(separator + 2) : payload.exception;
    return stripHtml(message);
  }

  return FALLBACK;
}

function parseServerMessages(serverMessages: string): string[] {
  try {
    const entries = JSON.parse(serverMessages) as string[];
    return entries
      .map((entry) => {
        try {
          const parsed = JSON.parse(entry) as { message?: string };
          return typeof parsed.message === "string" ? parsed.message : entry;
        } catch {
          return entry;
        }
      })
      .map(stripHtml)
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Turn a thrown `frappeFetch` error ("Frappe request failed: <status> <body>")
 * into a message safe to show a user.
 */
export function frappeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const match = error.message.match(/Frappe request failed: \d+ ([\s\S]*)/);
    if (match?.[1]) return parseFrappeError(match[1]);
  }
  return FALLBACK;
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
