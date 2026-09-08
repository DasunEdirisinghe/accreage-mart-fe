import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/frappe", () => ({
  frappeLogin: vi.fn(),
  frappeLogout: vi.fn(),
  frappeFetch: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { logout } from "@/app/actions/auth";
import { frappeLogout } from "@/lib/frappe";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const mockLogout = vi.mocked(frappeLogout);
const mockGetSession = vi.mocked(getSession);
const mockRedirect = vi.mocked(redirect);

afterEach(() => vi.clearAllMocks());

beforeEach(() => {
  mockLogout.mockResolvedValue(undefined);
});

describe("logout action", () => {
  it("calls Frappe logout with the sid, destroys the session, redirects to /login", async () => {
    const destroy = vi.fn();
    mockGetSession.mockResolvedValue({ frappeSid: "sid-9", destroy } as never);

    await expect(logout()).rejects.toThrow("REDIRECT:/login");
    expect(mockLogout).toHaveBeenCalledWith("sid-9");
    expect(destroy).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("still clears and redirects when there is no active Frappe session", async () => {
    const destroy = vi.fn();
    mockGetSession.mockResolvedValue({ destroy } as never);

    await expect(logout()).rejects.toThrow("REDIRECT:/login");
    expect(mockLogout).not.toHaveBeenCalled();
    expect(destroy).toHaveBeenCalled();
  });
});
