/** Backend response shapes for the listing endpoints (see accreage_mart/api/*.py). */

export type SellingType = "Direct" | "Auction";

export type ListingStatusLabel =
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Hidden"
  | "Suspended"
  | "Archived";

export interface ListingCategoryOption {
  name: string;
  title: string;
  area: string;
}

export interface ListingImageValue {
  /** The file URL, e.g. /files/lst-<id>.png */
  image: string;
  is_cover: boolean;
}

/** What the create/update server actions accept, as strings straight from the form. */
export interface ListingFormValues {
  selling_type: SellingType;
  category: string;
  title: string;
  description: string;
  unit: string;
  quantity_available: string;
  price_per_unit: string;
  min_order_qty: string;
  low_stock_level: string;
  district: string;
  location: string;
  latitude: string;
  longitude: string;
  organic: boolean;
  certification: string;
  images: ListingImageValue[];
  min_bid: string;
  /** datetime-local value, "YYYY-MM-DDTHH:mm", Sri Lanka wall-clock time */
  start_time: string;
  end_time: string;
  auction_terms_acknowledged: boolean;
}

export interface ListingFormState {
  success?: boolean;
  message?: string;
  errors?: Partial<Record<keyof ListingFormValues, string[]>>;
}

export type PriceSuggestionView =
  | { state: "none"; reason: "no_commodity" | "unreliable" | "error"; commodityName?: string }
  | {
      state: "available";
      commodityName: string;
      /** What the prices are per, from the commodity: "kg", "egg", "fruit"... */
      priceUnit: string;
      tier: "direct" | "range";
      /** Only for the "direct" tier. */
      price?: number;
      min: number;
      max: number;
    };

/** The owner's view of one listing (api.marketplace.get_listing -> listing). */
export interface OwnListingDetail {
  name: string;
  title: string;
  description: string;
  selling_type: SellingType;
  category: { name: string; title: string; area: string };
  unit: string;
  price_per_unit: number | null;
  min_order_qty: number | null;
  quantity_available: number;
  low_stock_level: number;
  district: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  organic: boolean;
  certification: string | null;
  images: { url: string; is_cover: boolean }[];
  auction: {
    min_bid: number;
    start_time: string;
    end_time: string;
    duration_hours?: number;
    status: string;
    bidding_enabled: boolean;
  } | null;
  status: ListingStatusLabel;
  status_reason: string | null;
  resubmission_note: string | null;
}

export interface GetListingResponse {
  availability: string;
  accepting_orders: boolean;
  viewer: "public" | "owner" | "staff" | "order_holder";
  message: string | null;
  listing: OwnListingDetail | null;
}

export type StockState = "in_stock" | "low_stock" | "out_of_stock";

/** One row of api.marketplace.list_my_listings. */
export interface MyListingCard {
  name: string;
  title: string;
  status: ListingStatusLabel;
  selling_type: SellingType;
  category: string;
  category_title: string | null;
  unit: string;
  price_per_unit: number | null;
  quantity_available: number;
  low_stock_level: number;
  /** null for auctions (the lot is fixed) */
  stock_state: StockState | null;
  district: string;
  cover_image: string | null;
  status_reason: string | null;
  resubmission_note: string | null;
  created: string;
  modified: string;
  auction: {
    min_bid: number;
    start_time: string;
    end_time: string;
    duration_hours: number;
    /** pending | rejected | scheduled | live | ended | hidden | suspended | archived */
    status: string;
    bidding_enabled: boolean;
  } | null;
}

export type MyListingsTab = "pending" | "live" | "hidden" | "rejected" | "suspended" | "archived";

export interface MyListingsResponse {
  items: MyListingCard[];
  counts: Record<MyListingsTab, number>;
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface MyListingsQuery {
  tab?: MyListingsTab;
  search?: string;
  selling_type?: SellingType;
  exclude_archived?: boolean;
  page?: number;
  page_size?: number;
}

export interface ListingActionInfo {
  hide: { blocked_reason: string | null };
  archive: { blocked_reason: string | null };
  unhide: { blocked_reason: string | null };
  warning: string;
  active_order_count: number;
}

export interface ListingHistoryEntry {
  action: "Approved" | "Rejected" | "Suspended" | "Resubmitted";
  reason: string | null;
  seller_note: string | null;
  reviewed_on: string;
  by: "staff" | "you";
}

export type ActionResult = { ok: true; name?: string } | { ok: false; error: string };
