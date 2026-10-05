import { describe, expect, it } from "vitest";

import { toPriceSuggestionView, unitsMatch, type RawPriceSuggestion } from "@/lib/price-suggestion";

const day = (horizon: number, predicted = 120, lower = 100, upper = 140) => ({
  forecast_date: "2026-10-06",
  horizon_days_ahead: horizon,
  predicted_price: predicted,
  lower_bound: lower,
  upper_bound: upper,
});

const raw = (near: "direct" | "range" | "unavailable", days = [day(1)]): RawPriceSuggestion => ({
  available: true,
  commodity_name: "Carrot",
  tiers: { near, mid: "range", long: "range" },
  forecast_days: days,
});

describe("toPriceSuggestionView", () => {
  it("says there is no reference when the category has no commodity", () => {
    expect(toPriceSuggestionView({ available: false, reason: "no_commodity_linked" })).toEqual({
      state: "none",
      reason: "no_commodity",
    });
  });

  it("says the reference is unreliable when the near-term tier is unavailable", () => {
    expect(toPriceSuggestionView(raw("unavailable"))).toEqual({
      state: "none",
      reason: "unreliable",
      commodityName: "Carrot",
    });
  });

  it("says unreliable when there are no forecast days at all", () => {
    expect(toPriceSuggestionView(raw("direct", [])).state).toBe("none");
  });

  it("gives a price and a range for the direct tier, from the nearest day", () => {
    const view = toPriceSuggestionView(raw("direct", [day(3, 130, 110, 150), day(1, 120, 100, 140)]));
    expect(view).toEqual({
      state: "available",
      commodityName: "Carrot",
      priceUnit: "kg",
      tier: "direct",
      price: 120,
      min: 100,
      max: 140,
    });
  });

  it("gives only a range for the range tier", () => {
    const view = toPriceSuggestionView(raw("range"));
    expect(view).toEqual({
      state: "available",
      commodityName: "Carrot",
      priceUnit: "kg",
      tier: "range",
      min: 100,
      max: 140,
    });
    expect("price" in view).toBe(false);
  });
});

describe("price unit", () => {
  it("carries the unit the backend reports", () => {
    const view = toPriceSuggestionView({ ...raw("range"), price_unit: "egg" });
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
