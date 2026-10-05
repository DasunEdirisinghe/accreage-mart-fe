import type {
  MarketplaceCard,
  MarketplaceResponse,
  PublicListing,
  PublicListingResponse,
  PublicSeller,
} from "@/types/marketplace.type";

export function makeCard(over: Partial<MarketplaceCard> = {}): MarketplaceCard {
  return {
    name: "LST-00001",
    title: "Fresh Carrots",
    selling_type: "Direct",
    category: "cat-1",
    category_title: "Carrot",
    unit: "kg",
    price_per_unit: 150,
    quantity_available: 400,
    in_stock: true,
    district: "Nuwara Eliya",
    location: "Nuwara Eliya market",
    organic: false,
    cover_image: null,
    created: "2026-10-05 09:00:00.000000",
    seller: { public_id: "abc123", business_name: "Test Farms", trust_score: 4.5 },
    auction: null,
    ...over,
  };
}

export function makeAuctionCard(status = "scheduled", over: Partial<MarketplaceCard> = {}): MarketplaceCard {
  return makeCard({
    name: "LST-00002",
    title: "Embul Kesel lot",
    selling_type: "Auction",
    price_per_unit: null,
    quantity_available: 900,
    auction: {
      min_bid: 180,
      start_time: "2099-01-01 10:00:00.000000",
      end_time: "2099-01-01 22:00:00.000000",
      duration_hours: 12,
      status,
      bidding_enabled: false,
    },
    ...over,
  });
}

export function makeMarketplace(
  items: MarketplaceCard[] = [makeCard()],
  over: Partial<MarketplaceResponse> = {},
): MarketplaceResponse {
  return { items, total: items.length, page: 1, page_size: 12, has_more: false, ...over };
}

export function makePublicListing(over: Partial<PublicListing> = {}): PublicListing {
  return {
    name: "LST-00001",
    title: "Fresh Carrots",
    description: "Grade A carrots.\nHarvested this week.",
    selling_type: "Direct",
    category: { name: "cat-1", title: "Carrot", area: "Vegetables" },
    unit: "kg",
    price_per_unit: 150,
    min_order_qty: 25,
    quantity_available: 400,
    in_stock: true,
    district: "Nuwara Eliya",
    location: "Nuwara Eliya market",
    latitude: 6.97,
    longitude: 80.77,
    map_url: "https://www.google.com/maps?q=6.97,80.77",
    organic: true,
    certification: "SLS organic 1234",
    images: [
      { url: "/files/lst-a.png", is_cover: true },
      { url: "/files/lst-b.png", is_cover: false },
    ],
    cover_image: "/files/lst-a.png",
    seller: { public_id: "abc123", business_name: "Test Farms", trust_score: 4.5, district: "Kandy", verified: true },
    created: "2026-10-05 09:00:00.000000",
    auction: null,
    ...over,
  };
}

export function makeResponse(over: Partial<PublicListingResponse> = {}): PublicListingResponse {
  return {
    availability: "available",
    accepting_orders: true,
    viewer: "public",
    message: null,
    listing: makePublicListing(),
    ...over,
  };
}

export function makeSeller(over: Partial<PublicSeller> = {}): PublicSeller {
  return {
    public_id: "abc123",
    business_name: "Test Farms",
    district: "Kandy",
    description: "Family farm growing upcountry vegetables.",
    trust_score: 4.5,
    verified: true,
    member_since: "2026-01-10 10:00:00.000000",
    live_listing_count: 3,
    ...over,
  };
}
