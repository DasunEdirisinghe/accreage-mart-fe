import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/frappe", () => ({ frappeFetch: vi.fn() }));

import { createStaff, register } from "@/app/actions/auth";
import { frappeFetch } from "@/lib/frappe";

const mockFetch = vi.mocked(frappeFetch);

function json(message: unknown) {
  return { json: async () => ({ message }) } as Response;
}

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const BUYER_FIELDS = {
  role: "buyer",
  fullName: "A B Perera",
  businessName: "Perera Hotels",
  email: "perera@x.lk",
  mobile: "+94 77 123 4567",
  district: "Colombo",
  buyerType: "Hotel",
  terms: "on",
};

afterEach(() => vi.clearAllMocks());

describe("register", () => {
  it("blocks submission without accepting the terms", async () => {
    const result = await register({}, form({ ...BUYER_FIELDS, terms: "" }));
    expect(result.error).toMatch(/terms/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("requires a buyer type for a buyer", async () => {
    const result = await register({}, form({ ...BUYER_FIELDS, buyerType: "" }));
    expect(result.error).toMatch(/buyer type/i);
  });

  it("posts a buyer registration and reports sent + dev link", async () => {
    mockFetch.mockResolvedValueOnce(json({ ok: true, dev_link: "http://localhost:3000/set-password?key=k" }));
    const result = await register({}, form(BUYER_FIELDS));
    expect(result).toEqual({ sent: true, devLink: "http://localhost:3000/set-password?key=k" });

    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.auth.register_buyer");
    expect((init as { body: Record<string, unknown> }).body).toMatchObject({
      full_name: "A B Perera",
      buyer_type: "Hotel",
      district: "Colombo",
    });
  });

  it("posts a seller registration (no buyer type)", async () => {
    mockFetch.mockResolvedValueOnce(json({ ok: true }));
    await register(
      {},
      form({
        role: "seller",
        fullName: "S Farms",
        businessName: "Green Farms",
        email: "green@x.lk",
        mobile: "0771234567",
        district: "Kandy",
        terms: "on",
      }),
    );
    const [method] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.auth.register_seller");
  });

  it("surfaces a backend duplicate-email error", async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('Frappe request failed: 409 {"message":"An account with this email already exists — try signing in instead."}'),
    );
    const result = await register({}, form(BUYER_FIELDS));
    expect(result.error).toMatch(/already exists/i);
  });
});

describe("createStaff", () => {
  it("validates the form", async () => {
    const result = await createStaff({}, form({ fullName: "X", email: "bad", role: "Staff" }));
    expect(result.error).toBeTruthy();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("creates a staff account and returns the invite details", async () => {
    mockFetch.mockResolvedValueOnce(
      json({ ok: true, email: "new@accreagemart.lk", dev_link: "http://localhost:3000/set-password?key=s" }),
    );
    const result = await createStaff(
      {},
      form({ fullName: "New Staff", email: "new@accreagemart.lk", role: "Staff" }),
    );
    expect(result.created).toEqual({
      email: "new@accreagemart.lk",
      devLink: "http://localhost:3000/set-password?key=s",
    });
  });
});
