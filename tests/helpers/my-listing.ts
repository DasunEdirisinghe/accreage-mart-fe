import type { MyListingCard } from "@/types/listing.type";

/** A seller's listing as api.marketplace.list_my_listings returns it. */
export function makeMyListing(over: Partial<MyListingCard> = {}): MyListingCard {
  return {
    name: "LST-00001",
    title: "Fresh Carrots",
    status: "Approved",
    selling_type: "Direct",
    category: "cat-1",
    category_title: "Carrot",
    unit: "kg",
    price_per_unit: 120,
    quantity_available: 500,
    low_stock_level: 0,
    stock_state: "in_stock",
    district: "Kandy",
    cover_image: null,
    status_reason: null,
    resubmission_note: null,
    created: "2026-10-01 09:00:00.000000",
    modified: "2026-10-02 09:00:00.000000",
    auction: null,
    ...over,
  };
}

export function makeAuctionListing(
  status: string,
  over: Partial<MyListingCard> = {},
): MyListingCard {
  return makeMyListing({
    name: "LST-00002",
    title: "Banana lot",
    selling_type: "Auction",
    price_per_unit: null,
    stock_state: null,
    auction: {
      min_bid: 300,
      start_time: "2026-10-07 10:00:00.000000",
      end_time: "2026-10-07 22:00:00.000000",
      duration_hours: 12,
      status,
      bidding_enabled: false,
    },
    ...over,
  });
}
