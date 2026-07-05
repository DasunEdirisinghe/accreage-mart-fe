/**
 * Auction service — mock implementation.
 * WIRING LATER: Frappe endpoints + WebSocket for live bids, e.g.
 *   POST /api/method/accreage.api.place_bid
 *   frappe.realtime (socket.io) channel: auction_<id>
 */

import { mutate, nextId } from "@/lib/store";
import type { DB } from "@/lib/store";
import type { Auction, Bid, Listing } from "@/lib/types";

export interface AuctionDetails {
  auction: Auction;
  listing: Listing;
  bids: Bid[]; // sorted desc by amount
  highestBid: Bid | null;
}

export function getAuctionDetails(db: DB, auctionId: string): AuctionDetails | null {
  const auction = db.auctions.find((a) => a.id === auctionId);
  if (!auction) return null;
  const listing = db.listings.find((l) => l.id === auction.listingId)!;
  const bids = db.bids
    .filter((b) => b.auctionId === auctionId)
    .sort((a, b) => b.amount - a.amount);
  return { auction, listing, bids, highestBid: bids[0] ?? null };
}

export function visibleAuctions(db: DB): AuctionDetails[] {
  return db.auctions
    .filter((a) => ["live", "scheduled", "ended"].includes(a.status))
    .map((a) => getAuctionDetails(db, a.id)!)
    .filter((d) => d.listing.status === "approved");
}

/** REQ 2.4-6: bid must exceed current highest and fall inside the window. */
export function placeBid(
  auctionId: string,
  buyerProfileId: string,
  amount: number
): { ok: boolean; error?: string } {
  let result: { ok: boolean; error?: string } = { ok: true };
  mutate((db) => {
    const auction = db.auctions.find((a) => a.id === auctionId);
    if (!auction || auction.status !== "live") {
      result = { ok: false, error: "Auction is not live." };
      return;
    }
    if (new Date(auction.endTime).getTime() < Date.now()) {
      result = { ok: false, error: "Auction has already ended." };
      return;
    }
    const highest = db.bids
      .filter((b) => b.auctionId === auctionId)
      .sort((a, b) => b.amount - a.amount)[0];
    const floor = highest ? highest.amount : auction.minBid;
    if (amount <= floor) {
      result = {
        ok: false,
        error: `Bid must exceed the current ${highest ? "highest bid" : "minimum bid"} of Rs. ${floor}.`,
      };
      return;
    }
    db.bids.push({
      id: nextId("b"),
      auctionId,
      buyerId: buyerProfileId,
      amount,
      bidTime: new Date().toISOString(),
    });
    // outbid notification (REQ 2.4-7)
    if (highest && highest.buyerId !== buyerProfileId) {
      const outbidBuyer = db.buyerProfiles.find((bp) => bp.id === highest.buyerId);
      const listing = db.listings.find((l) => l.id === auction.listingId);
      if (outbidBuyer && listing) {
        db.notifications.unshift({
          id: nextId("n"),
          userId: outbidBuyer.userId,
          type: "auction",
          message: `You were outbid on ${listing.title}. New highest bid: Rs. ${amount}/${listing.unit}.`,
          channel: "in_app",
          read: false,
          sentAt: new Date().toISOString(),
        });
      }
    }
  });
  return result;
}

/** Staff action — approve or reject a pending auction (REQ 2.4-3). */
export function reviewAuction(auctionId: string, decision: "scheduled" | "rejected"): void {
  mutate((db) => {
    const a = db.auctions.find((x) => x.id === auctionId);
    if (!a) return;
    a.status = decision;
    // if start time already passed, go straight to live
    if (decision === "scheduled" && new Date(a.startTime).getTime() <= Date.now()) {
      a.status = "live";
    }
  });
}

/** Auto-close pass (in production a scheduled Frappe job). */
export function closeExpiredAuctions(): void {
  mutate((db) => {
    db.auctions.forEach((a) => {
      if (a.status === "live" && new Date(a.endTime).getTime() < Date.now()) {
        a.status = "ended";
        const winning = db.bids
          .filter((b) => b.auctionId === a.id)
          .sort((x, y) => y.amount - x.amount)[0];
        a.winnerBidId = winning?.id;
      }
    });
  });
}
