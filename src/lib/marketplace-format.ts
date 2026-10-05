import type { ListingCategoryOption } from "@/types/listing.type";
import type { MarketplaceAuction } from "@/types/marketplace.type";

const AREA_EMOJI: Record<string, string> = {
  Fruits: "🍌",
  Vegetables: "🥕",
  Rice: "🌾",
  Fertilizer: "🧪",
  Tools: "🛠️",
  Other: "📦",
};

export function areaEmoji(area: string): string {
  return AREA_EMOJI[area] ?? "📦";
}

/** What an auction is doing, in a few words. Bidding doesn't exist yet, so it says so. */
export function auctionPhaseText(auction: MarketplaceAuction): string {
  if (auction.status === "live") return "Live now";
  if (auction.status === "ended") return "Ended";
  return "Scheduled";
}

export function biddingNote(auction: MarketplaceAuction): string | null {
  return auction.bidding_enabled ? null : "Bidding opens soon";
}

/** Categories shown on the landing page: a familiar set first, then whatever else exists. */
const LANDING_FIRST = [
  "Carrot",
  "Tomato",
  "Beans",
  "Embul Kesel",
  "Pineapple",
  "Nadu Rice",
  "Samba Rice",
  "Potato",
  "Big Onion",
  "Eggs",
  "Coconut",
  "Organic Fertilizer",
];

export function pickLandingCategories(
  categories: ListingCategoryOption[],
  limit = 12,
): ListingCategoryOption[] {
  const byTitle = new Map(categories.map((category) => [category.title, category]));
  const preferred = LANDING_FIRST.map((title) => byTitle.get(title)).filter(
    (category): category is ListingCategoryOption => Boolean(category),
  );
  const rest = categories.filter((category) => !preferred.includes(category));
  return [...preferred, ...rest].slice(0, limit);
}
