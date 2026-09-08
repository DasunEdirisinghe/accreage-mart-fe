import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/auth", () => ({ logout: vi.fn() }));

import { CurrentUserProvider, useCurrentUser } from "@/components/providers/current-user-provider";
import type { CurrentUserInfo } from "@/lib/current-user-info";

function Probe() {
  const { user, sellerProfile, buyerProfile, account } = useCurrentUser();
  return (
    <div>
      <span data-testid="user-id">{user?.id ?? "none"}</span>
      <span data-testid="user-name">{user?.name ?? "none"}</span>
      <span data-testid="seller-profile">{sellerProfile?.id ?? "none"}</span>
      <span data-testid="buyer-profile">{buyerProfile?.id ?? "none"}</span>
      <span data-testid="account-email">{account?.email ?? "none"}</span>
    </div>
  );
}

function renderWith(initialUser: CurrentUserInfo | null) {
  return render(
    <CurrentUserProvider initialUser={initialUser}>
      <Probe />
    </CurrentUserProvider>,
  );
}

const sellerInfo: CurrentUserInfo = {
  id: "seller@demo.accreagemart.lk",
  email: "seller@demo.accreagemart.lk",
  fullName: "Demo Seller",
  phone: "+94 77 000 0000",
  role: "seller",
  status: "active",
  verified: true,
};

describe("CurrentUserProvider", () => {
  it("exposes nulls for a guest", () => {
    renderWith(null);
    expect(screen.getByTestId("user-id")).toHaveTextContent("none");
    expect(screen.getByTestId("seller-profile")).toHaveTextContent("none");
  });

  it("bridges a real seller session to the mock seller identity, keeping real name/email", () => {
    renderWith(sellerInfo);
    expect(screen.getByTestId("user-id")).toHaveTextContent("u-seller-1");
    expect(screen.getByTestId("user-name")).toHaveTextContent("Demo Seller");
    expect(screen.getByTestId("seller-profile")).toHaveTextContent("sp-1");
    expect(screen.getByTestId("buyer-profile")).toHaveTextContent("none");
    expect(screen.getByTestId("account-email")).toHaveTextContent("seller@demo.accreagemart.lk");
  });

  it("bridges a real buyer session to the mock buyer identity", () => {
    renderWith({ ...sellerInfo, role: "buyer", fullName: "Demo Buyer" });
    expect(screen.getByTestId("user-id")).toHaveTextContent("u-buyer-1");
    expect(screen.getByTestId("buyer-profile")).toHaveTextContent("bp-1");
    expect(screen.getByTestId("seller-profile")).toHaveTextContent("none");
  });
});
