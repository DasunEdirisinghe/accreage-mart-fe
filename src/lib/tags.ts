/**
 * Next.js cache tags for `next: { tags }` reads and `revalidateTag(...)` after
 * mutations. Every tag is declared here — see docs/frontend-coding-guide.md.
 */

export enum USER_TAGS {
  /** The signed-in user's own info (role, profile, status). */
  CURRENT = "user:current",
}

export enum LISTING_TAGS {
  /** The public marketplace list and listing detail pages. */
  PUBLIC = "listing:public",
  /** The signed-in seller's own listings. */
  MINE = "listing:mine",
}
