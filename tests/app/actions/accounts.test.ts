import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/frappe", () => ({ frappeFetch: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { approveAccount, getAccountApplications, rejectAccount } from "@/app/actions/accounts";
import { frappeFetch } from "@/lib/frappe";

const mockFetch = vi.mocked(frappeFetch);

afterEach(() => vi.clearAllMocks());

describe("getAccountApplications", () => {
  it("returns the rows from the backend", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        message: [{ email: "s@x.lk", role: "seller", verificationStatus: "pending" }],
      }),
    } as Response);
    const rows = await getAccountApplications();
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("s@x.lk");
    expect(rows[0].verificationStatus).toBe("pending");
  });

  it("returns an empty list on error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Frappe request failed: 403 nope"));
    expect(await getAccountApplications()).toEqual([]);
  });
});

describe("approveAccount", () => {
  it("posts the email and reports ok", async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ message: { ok: true } }) } as Response);
    const res = await approveAccount("s@x.lk");
    expect(res.ok).toBe(true);
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.auth.verify_account");
    expect((init as { body: Record<string, unknown> }).body).toEqual({ email: "s@x.lk" });
  });

  it("returns the error message on failure", async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('Frappe request failed: 417 {"message":"No application found for this account."}'),
    );
    const res = await approveAccount("x@x.lk");
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/no application found/i);
  });
});

describe("rejectAccount", () => {
  it("posts the email and reason and reports ok", async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ message: { ok: true } }) } as Response);
    const res = await rejectAccount("s@x.lk", "Missing documents");
    expect(res.ok).toBe(true);
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.auth.reject_account");
    expect((init as { body: Record<string, unknown> }).body).toEqual({
      email: "s@x.lk",
      reason: "Missing documents",
    });
  });

  it("returns the error message on failure", async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('Frappe request failed: 417 {"message":"A reason is required."}'),
    );
    const res = await rejectAccount("x@x.lk", "");
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/reason is required/i);
  });
});
