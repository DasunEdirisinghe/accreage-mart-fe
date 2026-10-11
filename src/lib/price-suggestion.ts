import type { HorizonSuggestion, PriceHorizon, PriceSuggestionView } from "@/types/listing.type";

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

const HORIZON_KEYS: PriceHorizon[] = ["near", "mid", "long"];

/** Each horizon's own forecast-day window (days ahead, inclusive), matching the backend's
 * 1-7d / 8-14d / 15-30d buckets. */
const HORIZON_WINDOWS: Record<PriceHorizon, [number, number]> = {
  near: [1, 7],
  mid: [8, 14],
  long: [15, 30],
};

/**
 * Turn the backend's tiered response into what the listing form shows:
 *  - none / no_commodity: this category has no price reference set up
 *  - none / disabled: a commodity is linked but staff have turned its suggestions off
 *  - none / unreliable: a commodity is linked, but every horizon failed its own gate
 *  - available: one entry per horizon (near/mid/long) — each independently either a price
 *    (tier "direct"), a range only (tier "range"), or gated off, from the first forecast day
 *    inside that horizon's own window.
 */
export function toPriceSuggestionView(raw: RawPriceSuggestion): PriceSuggestionView {
  if (!raw.available) {
    return { state: "none", reason: raw.reason === "disabled" ? "disabled" : "no_commodity" };
  }

  const commodityName = raw.commodity_name ?? "";
  const priceUnit = raw.price_unit ?? "kg";
  const days = raw.forecast_days ?? [];
  const tiers = raw.tiers ?? { near: "unavailable", mid: "unavailable", long: "unavailable" };

  const horizons: HorizonSuggestion[] = HORIZON_KEYS.map((horizon) => {
    const tier = tiers[horizon];
    const [start, end] = HORIZON_WINDOWS[horizon];
    const day = days
      .filter((d) => d.horizon_days_ahead >= start && d.horizon_days_ahead <= end)
      .sort((a, b) => a.horizon_days_ahead - b.horizon_days_ahead)[0];

    if (tier === "unavailable" || !day) return { horizon, available: false };
    return tier === "direct"
      ? { horizon, available: true, tier: "direct", price: day.predicted_price, min: day.lower_bound, max: day.upper_bound }
      : { horizon, available: true, tier: "range", min: day.lower_bound, max: day.upper_bound };
  });

  if (horizons.every((h) => !h.available)) {
    return { state: "none", reason: "unreliable", commodityName };
  }
  return { state: "available", commodityName, priceUnit, horizons };
}

/** A single egg or fruit is sold as a "piece"; otherwise the units must be the same word. */
const PIECE_LIKE = new Set(["piece", "egg", "fruit"]);

/** Whether a price quoted per `priceUnit` can be used as-is for a listing sold per `sellerUnit`. */
export function unitsMatch(sellerUnit: string, priceUnit: string): boolean {
  if (sellerUnit === priceUnit) return true;
  return PIECE_LIKE.has(sellerUnit) && PIECE_LIKE.has(priceUnit);
}
