import { describe, expect, it } from "vitest";

import { isPublic, resolveRoute, type GuardSession } from "@/lib/route-guard";

const guest: GuardSession = { isLoggedIn: false, role: null };
const buyer: GuardSession = { isLoggedIn: true, role: "buyer" };
const seller: GuardSession = { isLoggedIn: true, role: "seller" };
const staff: GuardSession = { isLoggedIn: true, role: "staff" };
const admin: GuardSession = { isLoggedIn: true, role: "admin" };
const roleless: GuardSession = { isLoggedIn: true, role: null };

describe("isPublic", () => {
  it.each([
    "/",
    "/about",
    "/marketplace",
    "/marketplace/l-1",
    "/auctions/a-2",
    "/sellers/s-3",
    "/login",
    "/register",
    "/forgot-password",
    "/set-password",
    "/legal/terms",
    "/account/suspended",
  ])("treats %s as public", (path) => {
    expect(isPublic(path)).toBe(true);
  });

  it.each(["/buyer", "/seller/listings", "/admin/users"])("treats %s as non-public", (path) => {
    expect(isPublic(path)).toBe(false);
  });
});

describe("resolveRoute", () => {
  it("allows any public route regardless of session", () => {
    expect(resolveRoute(guest, "/marketplace")).toEqual({ type: "allow" });
    expect(resolveRoute(buyer, "/auctions/a-1")).toEqual({ type: "allow" });
  });

  it("sends a guest hitting a protected area to /login with ?next=", () => {
    expect(resolveRoute(guest, "/buyer/orders")).toEqual({
      type: "redirect",
      to: "/login?next=%2Fbuyer%2Forders",
    });
  });

  it("lets a role into its own area", () => {
    expect(resolveRoute(buyer, "/buyer")).toEqual({ type: "allow" });
    expect(resolveRoute(seller, "/seller/listings/new")).toEqual({ type: "allow" });
    expect(resolveRoute(staff, "/admin/approvals")).toEqual({ type: "allow" });
    expect(resolveRoute(admin, "/admin/users")).toEqual({ type: "allow" });
  });

  it("redirects a signed-in user out of the wrong area to their own home", () => {
    expect(resolveRoute(seller, "/buyer")).toEqual({ type: "redirect", to: "/seller" });
    expect(resolveRoute(buyer, "/admin")).toEqual({ type: "redirect", to: "/buyer" });
    expect(resolveRoute(staff, "/seller")).toEqual({ type: "redirect", to: "/admin" });
  });

  it("sends a role-less signed-in user to the site root", () => {
    expect(resolveRoute(roleless, "/buyer")).toEqual({ type: "redirect", to: "/" });
  });

  it("does not guard routes outside the protected prefixes", () => {
    expect(resolveRoute(guest, "/some/other/page")).toEqual({ type: "allow" });
  });
});
