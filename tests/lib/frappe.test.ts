import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

import { FrappeSessionError, frappeFetch, frappeUrl } from "@/lib/frappe";
import { getSession } from "@/lib/session";

const mockGetSession = vi.mocked(getSession);
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://accreage-mart.localhost:8000");
  mockGetSession.mockResolvedValue({ isLoggedIn: true, frappeSid: "sid-abc" } as never);
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: "ok" }), { status: 200 }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("frappeUrl", () => {
  it("prefixes bare method paths with the base URL + /api/method/", () => {
    expect(frappeUrl("accreage_mart.api.auth.get_user_info")).toBe(
      "http://accreage-mart.localhost:8000/api/method/accreage_mart.api.auth.get_user_info",
    );
  });

  it("passes absolute URLs through untouched", () => {
    expect(frappeUrl("https://example.com/x")).toBe("https://example.com/x");
  });
});

describe("frappeFetch", () => {
  it("attaches the session sid as a Cookie header by default", async () => {
    await frappeFetch("accreage_mart.api.auth.get_user_info");

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Cookie).toBe("sid=sid-abc");
  });

  it("omits the Cookie header for guest calls (auth: false)", async () => {
    await frappeFetch("login", { method: "POST", body: { usr: "a", pwd: "b" }, auth: false });

    expect(mockGetSession).not.toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Cookie).toBeUndefined();
    expect(init.body).toBe(JSON.stringify({ usr: "a", pwd: "b" }));
  });

  it("throws FrappeSessionError on 401/403", async () => {
    fetchMock.mockResolvedValueOnce(new Response("no", { status: 401 }));
    await expect(frappeFetch("x")).rejects.toBeInstanceOf(FrappeSessionError);

    fetchMock.mockResolvedValueOnce(new Response("no", { status: 403 }));
    await expect(frappeFetch("x")).rejects.toBeInstanceOf(FrappeSessionError);
  });

  it("throws a descriptive error on other non-2xx responses", async () => {
    fetchMock.mockResolvedValueOnce(new Response("boom", { status: 500 }));
    await expect(frappeFetch("x")).rejects.toThrow("Frappe request failed: 500 boom");
  });

  it("returns the Response on success", async () => {
    const res = await frappeFetch("x");
    expect(res.ok).toBe(true);
    await expect(res.json()).resolves.toEqual({ message: "ok" });
  });
});
