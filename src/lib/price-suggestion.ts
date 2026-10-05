import type { PriceSuggestionView } from "@/types/listing.type";

/** The raw response of api.pricing.get_price_suggestion (see accreage_mart/api/pricing.py). */
export interface RawPriceSuggestion {
  available: boolean;
  reason?: string;
  commodity_name?: string;
  /** What the forecast prices are per: "kg", "egg", "fruit"... (default kg). */
  price_unit?: string;
  tiers?: { near: Tier; mid: Tier; long: Tier };
  forecast_days?: {
    forecast_date: string;
    horizon_days_ahead: number;
    predicted_price: number;
    lower_bound: number;
    upper_bound: number;
  }[];
}

type Tier = "direct" | "range" | "unavailable";

/**
 * Turn the backend's tiered response into what the listing form shows:
 *  - none / no_commodity: this category has no price reference set up
 *  - none / unreliable: a commodity is linked but its forecast isn't accurate enough yet
 *  - available: a single price (tier "direct") or just a range (tier "range")
 * The nearest forecast day is used, gated by the near-term accuracy tier.
 */
export function toPriceSuggestionView(raw: RawPriceSuggestion): PriceSuggestionView {
  if (!raw.available) return { state: "none", reason: "no_commodity" };

  const commodityName = raw.commodity_name ?? "";
  const priceUnit = raw.price_unit ?? "kg";
  const days = [...(raw.forecast_days ?? [])].sort((a, b) => a.horizon_days_ahead - b.horizon_days_ahead);
  const near = days[0];
  const tier = raw.tiers?.near ?? "unavailable";

  if (!near || tier === "unavailable") {
    return { state: "none", reason: "unreliable", commodityName };
  }
  if (tier === "direct") {
    return {
      state: "available",
      commodityName,
      priceUnit,
      tier: "direct",
      price: near.predicted_price,
      min: near.lower_bound,
      max: near.upper_bound,
    };
  }
  return {
    state: "available",
    commodityName,
    priceUnit,
    tier: "range",
    min: near.lower_bound,
    max: near.upper_bound,
  };
}

/** A single egg or fruit is sold as a "piece"; otherwise the units must be the same word. */
const PIECE_LIKE = new Set(["piece", "egg", "fruit"]);

/** Whether a price quoted per `priceUnit` can be used as-is for a listing sold per `sellerUnit`. */
export function unitsMatch(sellerUnit: string, priceUnit: string): boolean {
  if (sellerUnit === priceUnit) return true;
  return PIECE_LIKE.has(sellerUnit) && PIECE_LIKE.has(priceUnit);
}
