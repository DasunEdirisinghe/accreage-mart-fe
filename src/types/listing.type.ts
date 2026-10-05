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
