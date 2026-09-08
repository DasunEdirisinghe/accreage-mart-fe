import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/frappe", () => ({ frappeFetch: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { listAccounts, setAccountStatus } from "@/app/actions/admin-accounts";
import { frappeFetch } from "@/lib/frappe";

const mockFetch = vi.mocked(frappeFetch);

afterEach(() => vi.clearAllMocks());

describe("listAccounts", () => {
  it("requests the given kind and returns the rows", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ message: [{ email: "s@x.lk", role: "staff", status: "active" }] }),
    } as Response);

    const rows = await listAccounts("staff");
    expect(rows[0].email).toBe("s@x.lk");
    expect(mockFetch.mock.calls[0][0]).toBe("accreage_mart.api.auth.list_accounts?kind=staff");
  });

  it("returns [] on error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Frappe request failed: 403 no"));
    expect(await listAccounts("members")).toEqual([]);
  });
});

describe("setAccountStatus", () => {
  it("posts email + status", async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ message: { ok: true } }) } as Response);
    const res = await setAccountStatus("b@x.lk", "suspended");
    expect(res.ok).toBe(true);
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.auth.set_account_status");
    expect((init as { body: Record<string, unknown> }).body).toEqual({
      email: "b@x.lk",
      status: "suspended",
    });
  });

  it("surfaces a permission error", async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('Frappe request failed: 403 {"message":"You can\'t change this account\'s status."}'),
    );
    const res = await setAccountStatus("Administrator", "suspended");
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/can't change this account/i);
  });
});
