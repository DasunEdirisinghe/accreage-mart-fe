import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/frappe", () => ({ frappeFetch: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  deleteCategory,
  getCategories,
  getCommodities,
  getCommodity,
  getCommoditiesOverview,
  upsertCategory,
} from "@/app/actions/pricing";
import { frappeFetch } from "@/lib/frappe";

const mockFetch = vi.mocked(frappeFetch);

afterEach(() => vi.clearAllMocks());

describe("getCategories", () => {
  it("returns the rows from the backend", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        message: [{ name: "abc123", title: "Carrot — Up Country", area: "Vegetables", commodity: "Up Country Vegetable - Carrot" }],
      }),
    } as Response);
    const rows = await getCategories();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Carrot — Up Country");
  });

  it("returns an empty list on error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Frappe request failed: 403 nope"));
    expect(await getCategories()).toEqual([]);
  });
});

describe("getCommodities", () => {
  it("returns the rows from the backend", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ message: [{ name: "Rice - Nadu 1" }] }),
    } as Response);
    const rows = await getCommodities("Nadu");
    expect(rows).toEqual([{ name: "Rice - Nadu 1" }]);
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.pricing.list_commodities");
    expect((init as { body: Record<string, unknown> }).body).toEqual({ search: "Nadu" });
  });

  it("returns an empty list on error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Frappe request failed: 403 nope"));
    expect(await getCommodities()).toEqual([]);
  });
});

describe("upsertCategory", () => {
  it("creates (no name) and reports ok", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ message: { name: "abc123", title: "Tools", area: "Tools", commodity: null } }),
    } as Response);
    const res = await upsertCategory({ title: "Tools", area: "Tools", commodity: null });
    expect(res.ok).toBe(true);
    expect(res.category?.name).toBe("abc123");
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.pricing.upsert_category");
    expect((init as { body: Record<string, unknown> }).body).toEqual({
      name: undefined,
      title: "Tools",
      area: "Tools",
      commodity: undefined,
    });
  });

  it("updates (name given)", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ message: { name: "abc123", title: "Fruits", area: "Fruits", commodity: null } }),
    } as Response);
    const res = await upsertCategory({ name: "abc123", title: "Fruits", area: "Fruits", commodity: null });
    expect(res.ok).toBe(true);
    const [, init] = mockFetch.mock.calls[0];
    expect((init as { body: Record<string, unknown> }).body).toMatchObject({ name: "abc123" });
  });

  it("returns the error message on failure", async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('Frappe request failed: 417 {"message":"Title is required."}'),
    );
    const res = await upsertCategory({ title: "", area: "Other", commodity: null });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/title is required/i);
  });
});

describe("deleteCategory", () => {
  it("posts the name and reports ok", async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ message: { ok: true } }) } as Response);
    const res = await deleteCategory("abc123");
    expect(res.ok).toBe(true);
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.pricing.delete_category");
    expect((init as { body: Record<string, unknown> }).body).toEqual({ name: "abc123" });
  });

  it("returns the error message on failure", async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('Frappe request failed: 417 {"message":"Category not found: abc123"}'),
    );
    const res = await deleteCategory("abc123");
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/category not found/i);
  });
});

describe("getCommoditiesOverview", () => {
  it("returns the rows from the backend", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        message: [
          {
            name: "Rice - Nadu 1",
            harti_category: "Rice",
            market: "Pettah",
            is_active: true,
            last_evaluated_on: "2026-09-01",
            mape_1_7d: 4.5,
          },
        ],
      }),
    } as Response);
    const rows = await getCommoditiesOverview();
    expect(rows).toHaveLength(1);
    expect(rows[0].market).toBe("Pettah");
    const [method] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.pricing.list_commodities_overview");
  });

  it("returns an empty list on error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Frappe request failed: 403 nope"));
    expect(await getCommoditiesOverview()).toEqual([]);
  });
});

describe("getCommodity", () => {
  it("returns the commodity from the backend", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        message: {
          name: "Rice - Nadu 1",
          harti_category: "Rice",
          market: "Pettah",
          unit: "kg",
          is_active: true,
          mape_1_7d: 4.5,
          mape_8_14d: 6.2,
          mape_15_30d: 9.1,
          sample_size_1_7d: 12,
          sample_size_8_14d: 12,
          sample_size_15_30d: 12,
          last_evaluated_on: "2026-09-01",
          forecast_days: [],
        },
      }),
    } as Response);
    const commodity = await getCommodity("Rice - Nadu 1");
    expect(commodity?.name).toBe("Rice - Nadu 1");
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.pricing.get_commodity");
    expect((init as { body: Record<string, unknown> }).body).toEqual({ name: "Rice - Nadu 1" });
  });

  it("returns null on error (e.g. an unknown commodity)", async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('Frappe request failed: 417 {"message":"Unknown commodity: Nope"}'),
    );
    expect(await getCommodity("Nope")).toBeNull();
  });
});
