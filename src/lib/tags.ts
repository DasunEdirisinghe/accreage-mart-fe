/**
 * Next.js cache tags for `next: { tags }` reads and `revalidateTag(...)` after
 * mutations. Every tag is declared here — see docs/frontend-coding-guide.md.
 */

export enum USER_TAGS {
  /** The signed-in user's own info (role, profile, status). */
  CURRENT = "user:current",
}
