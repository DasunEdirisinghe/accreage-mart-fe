import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/frappe", () => ({
  frappeFetch: vi.fn(),
  frappeLogin: vi.fn(),
  frappeLogout: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import {
  requestPasswordReset,
  resendActivation,
  setPassword,
  type ResetRequestState,
  type SetPasswordState,
} from "@/app/actions/auth";
import { frappeFetch, frappeLogin } from "@/lib/frappe";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const mockFetch = vi.mocked(frappeFetch);
const mockLogin = vi.mocked(frappeLogin);
const mockGetSession = vi.mocked(getSession);
const mockRedirect = vi.mocked(redirect);

const EMPTY_SET: SetPasswordState = {};
const EMPTY_RESET: ResetRequestState = {};

function json(message: unknown) {
  return { json: async () => ({ message }) } as Response;
}

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  mockGetSession.mockResolvedValue({
    save: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
  } as never);
});

afterEach(() => vi.clearAllMocks());

describe("setPassword", () => {
  it("rejects a weak password before calling the backend", async () => {
    const result = await setPassword(EMPTY_SET, form({ key: "k", password: "short", confirm: "short" }));
    expect(result.error).toMatch(/8 characters/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects a mismatched confirmation", async () => {
    const result = await setPassword(
      EMPTY_SET,
      form({ key: "k", password: "Harvest2026", confirm: "Harvest2027" }),
    );
    expect(result.error).toMatch(/don't match/i);
  });

  it("surfaces a backend error (bad / used key)", async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('Frappe request failed: 417 {"message":"This link is invalid or has already been used."}'),
    );
    const result = await setPassword(
      EMPTY_SET,
      form({ key: "bad", password: "Harvest2026", confirm: "Harvest2026" }),
    );
    expect(result.error).toBe("This link is invalid or has already been used.");
  });

  it("sets the password, signs in, and redirects to the role home", async () => {
    mockFetch
      .mockResolvedValueOnce(json({ email: "buyer@x.lk" })) // set_password
      .mockResolvedValueOnce(
        json({ user: { id: "buyer@x.lk", email: "buyer@x.lk", fullName: "B" }, role: "buyer", status: "active" }),
      ); // get_user_info
    mockLogin.mockResolvedValue({ ok: true, sid: "sid-1" });

    await expect(
      setPassword(EMPTY_SET, form({ key: "ok", password: "Harvest2026", confirm: "Harvest2026" })),
    ).rejects.toThrow("REDIRECT:/buyer");
    expect(mockRedirect).toHaveBeenCalledWith("/buyer");
  });

  it("falls back to /login?set=1 if the auto sign-in fails", async () => {
    mockFetch.mockResolvedValueOnce(json({ email: "buyer@x.lk" }));
    mockLogin.mockResolvedValue({ ok: false });

    await expect(
      setPassword(EMPTY_SET, form({ key: "ok", password: "Harvest2026", confirm: "Harvest2026" })),
    ).rejects.toThrow("REDIRECT:/login?set=1");
  });
});

describe("requestPasswordReset", () => {
  it("rejects an invalid email", async () => {
    const result = await requestPasswordReset(EMPTY_RESET, form({ email: "not-an-email" }));
    expect(result.error).toMatch(/valid email/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns a generic sent state, with the dev link when present", async () => {
    mockFetch.mockResolvedValueOnce(json({ ok: true, dev_link: "http://localhost:3000/set-password?key=abc" }));
    const result = await requestPasswordReset(EMPTY_RESET, form({ email: "someone@x.lk" }));
    expect(result).toEqual({ sent: true, devLink: "http://localhost:3000/set-password?key=abc" });
  });

  it("still reports sent if the backend call throws (no enumeration)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Frappe request failed: 500 boom"));
    const result = await requestPasswordReset(EMPTY_RESET, form({ email: "someone@x.lk" }));
    expect(result).toEqual({ sent: true });
  });
});

describe("resendActivation", () => {
  it("returns sent + dev link", async () => {
    mockFetch.mockResolvedValueOnce(json({ ok: true, dev_link: "http://localhost:3000/set-password?key=xyz" }));
    const result = await resendActivation("invited@x.lk");
    expect(result).toEqual({ sent: true, devLink: "http://localhost:3000/set-password?key=xyz" });
  });
});
