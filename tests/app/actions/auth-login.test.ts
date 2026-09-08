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

import { login, type LoginState } from "@/app/actions/auth";
import { frappeFetch, frappeLogin, frappeLogout } from "@/lib/frappe";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const mockLogin = vi.mocked(frappeLogin);
const mockUserInfo = vi.mocked(frappeFetch);
const mockLogout = vi.mocked(frappeLogout);
const mockGetSession = vi.mocked(getSession);
const mockRedirect = vi.mocked(redirect);

interface FakeSession {
  frappeSid?: string;
  user?: unknown;
  isLoggedIn: boolean;
  save: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
}

let session: FakeSession;

beforeEach(() => {
  session = {
    isLoggedIn: false,
    save: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
  };
  mockGetSession.mockResolvedValue(session as never);
  mockLogout.mockResolvedValue(undefined);
});

afterEach(() => vi.clearAllMocks());

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

function infoResponse(info: {
  role: string | null;
  status: string;
  id?: string;
}) {
  return {
    json: async () => ({
      message: {
        user: { id: info.id ?? "buyer@x.lk", email: info.id ?? "buyer@x.lk", fullName: "Buyer X" },
        role: info.role,
        status: info.status,
      },
    }),
  } as Response;
}

const EMPTY: LoginState = {};

describe("login action", () => {
  it("rejects missing fields without calling Frappe", async () => {
    const result = await login(EMPTY, form({ usr: "buyer@x.lk" }));
    expect(result.error).toMatch(/email and password/i);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("returns a generic message on bad credentials (no enumeration)", async () => {
    mockLogin.mockResolvedValue({ ok: false, message: "User disabled" });
    mockUserInfo.mockResolvedValue({ json: async () => ({ message: {} }) } as Response); // account_hint: not invited
    const result = await login(EMPTY, form({ usr: "buyer@x.lk", pwd: "wrong" }));
    expect(result.error).toBe("Invalid email or password.");
    expect(result.inputs?.usr).toBe("buyer@x.lk");
  });

  it("offers to resend activation when a failed login is a pending account", async () => {
    mockLogin.mockResolvedValue({ ok: false });
    mockUserInfo.mockResolvedValue({
      json: async () => ({ message: { invited: true } }),
    } as Response); // account_hint
    const result = await login(EMPTY, form({ usr: "pending@x.lk", pwd: "whatever" }));
    expect(result.error).toMatch(/activated/i);
    expect(result.canResendActivation).toBe(true);
  });

  it("signs an active buyer in and redirects to /buyer", async () => {
    mockLogin.mockResolvedValue({ ok: true, sid: "sid-1" });
    mockUserInfo.mockResolvedValue(infoResponse({ role: "buyer", status: "active" }));

    await expect(login(EMPTY, form({ usr: "buyer@x.lk", pwd: "pw" }))).rejects.toThrow(
      "REDIRECT:/buyer",
    );
    expect(session.frappeSid).toBe("sid-1");
    expect(session.isLoggedIn).toBe(true);
    expect(session.save).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/buyer");
  });

  it("honours a safe ?next= and ignores an unsafe one", async () => {
    mockLogin.mockResolvedValue({ ok: true, sid: "sid-1" });
    mockUserInfo.mockResolvedValue(infoResponse({ role: "buyer", status: "active" }));
    await expect(
      login(EMPTY, form({ usr: "b@x.lk", pwd: "pw", next: "/buyer/orders" })),
    ).rejects.toThrow();
    expect(mockRedirect).toHaveBeenCalledWith("/buyer/orders");

    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(session as never);
    mockLogin.mockResolvedValue({ ok: true, sid: "sid-1" });
    mockUserInfo.mockResolvedValue(infoResponse({ role: "admin", status: "active" }));
    await expect(
      login(EMPTY, form({ usr: "a@x.lk", pwd: "pw", next: "//evil.com" })),
    ).rejects.toThrow();
    expect(mockRedirect).toHaveBeenCalledWith("/admin");
  });

  it("blocks an invited account and offers to resend activation", async () => {
    mockLogin.mockResolvedValue({ ok: true, sid: "sid-2" });
    mockUserInfo.mockResolvedValue(infoResponse({ role: "seller", status: "invited" }));

    const result = await login(EMPTY, form({ usr: "s@x.lk", pwd: "pw" }));
    expect(result.error).toMatch(/activated/i);
    expect(result.canResendActivation).toBe(true);
    expect(mockLogout).toHaveBeenCalledWith("sid-2");
    expect(session.destroy).toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("blocks a suspended account", async () => {
    mockLogin.mockResolvedValue({ ok: true, sid: "sid-3" });
    mockUserInfo.mockResolvedValue(infoResponse({ role: "buyer", status: "suspended" }));

    const result = await login(EMPTY, form({ usr: "b@x.lk", pwd: "pw" }));
    expect(result.error).toMatch(/suspended/i);
    expect(result.canResendActivation).toBeUndefined();
    expect(session.destroy).toHaveBeenCalled();
  });

  it("clears the session if get_user_info fails", async () => {
    mockLogin.mockResolvedValue({ ok: true, sid: "sid-4" });
    mockUserInfo.mockRejectedValue(new Error("boom"));

    const result = await login(EMPTY, form({ usr: "b@x.lk", pwd: "pw" }));
    expect(result.error).toMatch(/could not sign you in/i);
    expect(session.destroy).toHaveBeenCalled();
  });
});
