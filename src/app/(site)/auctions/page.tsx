import { redirect } from "next/navigation";

/**
 * Auction listings are shown in the marketplace grid, not a separate browse page. This address
 * (kept for the header link and old bookmarks) forwards there. The real bidding page lives at
 * /auctions/[id] (keyed by the Auction doc name), reached from marketplace/landing cards.
 */
export default function AuctionsPage() {
  redirect("/marketplace?type=Auction");
}
