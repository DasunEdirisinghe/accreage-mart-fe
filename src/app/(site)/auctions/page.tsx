import { redirect } from "next/navigation";

/**
 * Auction listings are ordinary listings now, shown in the marketplace. This address (kept for
 * the header link and old bookmarks) forwards there until the auction epic adds live bidding
 * pages. The demo auction detail pages under /auctions/[id] are still reached from the demo
 * buyer and seller dashboards.
 */
export default function AuctionsPage() {
  redirect("/marketplace?type=Auction");
}
