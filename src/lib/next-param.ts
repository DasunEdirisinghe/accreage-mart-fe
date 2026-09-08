/**
 * Sanitise a `?next=` redirect target. Only same-origin absolute paths are allowed —
 * anything that could send the user off-site (`//evil.com`, `https://…`, `/\evil`,
 * backslash tricks) is rejected.
 */
export function sanitizeNext(next: string | null | undefined): string | null {
  if (!next || typeof next !== "string") return null;

  const value = next.trim();
  if (!value.startsWith("/")) return null; // must be a path
  if (value.startsWith("//") || value.startsWith("/\\")) return null; // protocol-relative
  if (value.includes("\\")) return null; // backslash trickery
  if (/^\/%2f/i.test(value) || /^\/%5c/i.test(value)) return null; // encoded slashes

  return value;
}
