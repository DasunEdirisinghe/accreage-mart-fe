import { describe, expect, it } from "vitest";

import { toPriceSuggestionView, unitsMatch, type RawPriceSuggestion } from "@/lib/price-suggestion";
import type { HorizonSuggestion } from "@/types/listing.type";

const day = (horizon: number, predicted = 120, lower = 100, upper = 140) => ({
  forecast_date: "2026-10-06",
  horizon_days_ahead: horizon,
  predicted_price: predicted,
  lower_bound: lower,
  upper_bound: upper,
});

type Tier = "direct" | "range" | "unavailable";

const raw = (
  tiers: { near?: Tier; mid?: Tier; long?: Tier } = {},
  days = [day(1)],
): RawPriceSuggestion => ({
  available: true,
  commodity_name: "Carrot",
  tiers: { near: "unavailable", mid: "unavailable", long: "unavailable", ...tiers },
  forecast_days: days,
});

function horizonsOf(view: ReturnType<typeof toPriceSuggestionView>): HorizonSuggestion[] {
  return view.state === "available" ? view.horizons : [];
}

describe("toPriceSuggestionView", () => {
  it("says there is no reference when the category has no commodity", () => {
    expect(toPriceSuggestionView({ available: false, reason: "no_commodity_linked" })).toEqual({
      state: "none",
      reason: "no_commodity",
    });
  });

  it("says suggestions are off when the commodity has been disabled", () => {
    expect(toPriceSuggestionView({ available: false, reason: "disabled" })).toEqual({
      state: "none",
      reason: "disabled",
    });
  });

  it("says the reference is unreliable when every horizon fails its own gate", () => {
    expect(toPriceSuggestionView(raw())).toEqual({
      state: "none",
      reason: "unreliable",
      commodityName: "Carrot",
    });
  });

  it("says unreliable when there are no forecast days at all", () => {
    expect(toPriceSuggestionView(raw({ near: "direct" }, [])).state).toBe("none");
  });

  it("gives a price and a range for the near horizon's direct tier, from its first forecast day", () => {
    const view = toPriceSuggestionView(raw({ near: "direct" }, [day(3, 130, 110, 150), day(1, 120, 100, 140)]));
    const near = horizonsOf(view).find((h) => h.horizon === "near");
    expect(near).toEqual({ horizon: "near", available: true, tier: "direct", price: 120, min: 100, max: 140 });
  });

  it("gives only a range for the range tier", () => {
    const view = toPriceSuggestionView(raw({ near: "range" }));
    const near = horizonsOf(view).find((h) => h.horizon === "near");
    expect(near).toEqual({ horizon: "near", available: true, tier: "range", min: 100, max: 140 });
  });

  it("shows each horizon independently — one available, others gated off", () => {
    const view = toPriceSuggestionView(
      raw({ near: "direct", mid: "unavailable", long: "direct" }, [day(2, 120, 100, 140), day(10, 200, 180, 220), day(20, 300, 280, 320)]),
    );
    expect(view.state).toBe("available");
    const horizons = horizonsOf(view);
    expect(horizons.find((h) => h.horizon === "near")).toMatchObject({ available: true, price: 120 });
    expect(horizons.find((h) => h.horizon === "mid")).toEqual({ horizon: "mid", available: false });
    expect(horizons.find((h) => h.horizon === "long")).toMatchObject({ available: true, price: 300 });
  });

  it("uses the first day inside each horizon's own window, not the nearest overall", () => {
    const view = toPriceSuggestionView(
      raw({ mid: "direct" }, [day(8, 150, 140, 160), day(12, 170, 160, 180)]),
    );
    const mid = horizonsOf(view).find((h) => h.horizon === "mid");
    expect(mid).toMatchObject({ available: true, price: 150 }); // day 8, not day 12
  });

  it("a horizon with a passing tier but no day in its window is still gated off", () => {
    const view = toPriceSuggestionView(raw({ near: "direct", long: "direct" }, [day(1, 120, 100, 140)]));
    const long = horizonsOf(view).find((h) => h.horizon === "long");
    expect(long).toEqual({ horizon: "long", available: false });
  });
});

describe("price unit", () => {
  it("carries the unit the backend reports", () => {
    const view = toPriceSuggestionView({ ...raw({ near: "range" }), price_unit: "egg" });
    expect(view.state === "available" && view.priceUnit).toBe("egg");
  });
});

describe("unitsMatch", () => {
  it("matches the same unit", () => {
    expect(unitsMatch("kg", "kg")).toBe(true);
    expect(unitsMatch("nut", "nut")).toBe(true);
  });

  it("treats a piece as an egg or a fruit", () => {
    expect(unitsMatch("piece", "egg")).toBe(true);
    expect(unitsMatch("piece", "fruit")).toBe(true);
  });

  it("does not match different units", () => {
    expect(unitsMatch("dozen", "egg")).toBe(false);
    expect(unitsMatch("kg", "egg")).toBe(false);
    expect(unitsMatch("nut", "kg")).toBe(false);
    expect(unitsMatch("bag", "fruit")).toBe(false);
  });
});
