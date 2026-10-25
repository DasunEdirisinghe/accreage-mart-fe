/** Backend response shapes for the auction/bid endpoints (api/auctions.py, Epic 07). */

import type { Auction, Bid } from "@/lib/types";

export interface AuctionListingSummary {
  name: string;
  title: string;
  unit: string;
}

/** The listing as returned alongside an auction in get_auction_detail. */
export interface AuctionDetailListing extends AuctionListingSummary {
  quantity_available: number;
  seller_business_name: string | null;
  /** Opaque public id — the seller's real id (email) is never exposed. */
  seller: string;
}

/** api.auctions.get_auction_detail's response. */
export interface AuctionDetailResponse {
  auction: Auction;
  listing: AuctionDetailListing;
  /** Newest first. */
  bids: Bid[];
  highest_bid: Bid | null;
}

/** One row of api.auctions.list_seller_auctions. */
export interface SellerAuctionItem {
  name: string;
  listing: AuctionListingSummary;
  min_bid: number;
  start_time: string;
  end_time: string;
  status: Auction["status"];
  cancel_reason: string | null;
  bid_count: number;
  highest_bid: Bid | null;
}

export interface SellerAuctionsResponse {
  items: SellerAuctionItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/** One row of api.auctions.list_buyer_bids — one auction the caller has bid on. */
export interface BuyerBidItem {
  name: string;
  listing: AuctionListingSummary;
  status: Auction["status"];
  cancel_reason: string | null;
  end_time: string;
  my_highest_bid: Bid | null;
  highest_bid: Bid | null;
  /** Whether the caller's own bid is currently the highest. */
  leading: boolean;
}

export interface BuyerBidsResponse {
  items: BuyerBidItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}
