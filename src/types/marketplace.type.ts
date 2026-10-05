/** Backend response shapes for the public marketplace endpoints (api/marketplace.py). */

import type { SellingType } from "@/types/listing.type";

export interface MarketplaceSeller {
  /** Opaque id: the seller's real id is their email and is never exposed. */
  public_id: string;
  business_name: string;
  trust_score: number;
}

export interface MarketplaceAuction {
  min_bid: number;
  start_time: string;
  end_time: string;
  duration_hours?: number;
  /** pending | rejected | scheduled | live | ended | hidden | suspended | archived */
  status: string;
  /** False until the auction epic adds bidding. */
  bidding_enabled: boolean;
}

/** One card in api.marketplace.list_marketplace. */
export interface MarketplaceCard {
  name: string;
  title: string;
  selling_type: SellingType;
  category: string;
  category_title: string | null;
  unit: string;
  price_per_unit: number | null;
  quantity_available: number;
  in_stock: boolean;
  district: string;
  location: string;
  organic: boolean;
  cover_image: string | null;
  created: string;
  seller: MarketplaceSeller;
  auction: MarketplaceAuction | null;
}

export interface MarketplaceResponse {
  items: MarketplaceCard[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/** The listing as the public sees it (api.marketplace.get_listing -> listing). */
export interface PublicListing {
  name: string;
  title: string;
  description: string;
  selling_type: SellingType;
  category: { name: string; title: string; area: string };
  unit: string;
  price_per_unit: number | null;
  min_order_qty: number | null;
  quantity_available: number;
  in_stock: boolean;
  district: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  map_url: string | null;
  organic: boolean;
  certification: string | null;
  images: { url: string; is_cover: boolean }[];
  cover_image: string | null;
  seller: MarketplaceSeller & { district: string; verified: boolean };
  created: string;
  auction: MarketplaceAuction | null;
  /** Owner / staff views also carry these. */
  status?: string;
}

export type Availability =
  | "available"
  | "pending"
  | "rejected"
  | "hidden"
  | "suspended"
  | "archived"
  | "seller_unavailable";

export interface PublicListingResponse {
  availability: Availability;
  accepting_orders: boolean;
  viewer: "public" | "owner" | "staff" | "order_holder";
  /** Set when the listing is not simply available: why, in words for that viewer. */
  message: string | null;
  /** Null when this viewer only gets the message. */
  listing: PublicListing | null;
}

export interface PublicSeller {
  public_id: string;
  business_name: string;
  district: string;
  description: string | null;
  trust_score: number;
  verified: boolean;
  member_since: string;
  live_listing_count: number;
}
