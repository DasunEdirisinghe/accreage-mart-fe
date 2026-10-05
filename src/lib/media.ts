/** Absolute URL of an uploaded file (Frappe serves /files/... from its own host). */
export function mediaUrl(path: string): string {
  if (!path || path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_FRAPPE_URL ?? ""}${path}`;
}
