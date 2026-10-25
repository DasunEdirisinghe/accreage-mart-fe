import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: "a-1" }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: redirectMock,
}));
vi.mock("@/app/actions/auth", () => ({ logout: vi.fn() }));
vi.mock("@/app/actions/listings", () => ({
  getMyListings: vi.fn(async () => ({
    items: [],
    counts: { pending: 1, live: 4, hidden: 0, rejected: 0, suspended: 0, archived: 2 },
    total: 0,
    page: 1,
    page_size: 5,
    has_more: false,
  })),
}));
vi.mock("@/app/actions/listing-review", () => ({
  getReviewQueue: vi.fn(async () => ({
    items: [],
    counts: { "Pending Approval": 3, Approved: 7, Rejected: 0, Hidden: 0, Suspended: 0, Archived: 0 },
    total: 0,
    page: 1,
    page_size: 12,
    has_more: false,
  })),
}));
vi.mock("@/app/actions/marketplace", () => ({
  getMarketplace: vi.fn(async () => ({ items: [], total: 0, page: 1, page_size: 4, has_more: false })),
}));
vi.mock("@/app/actions/auctions", () => ({
  getAuctionDetail: vi.fn(async () => ({
    auction: {
      name: "a-1",
      min_bid: 300,
      start_time: "2020-01-01 10:00:00",
      end_time: "2099-01-01 10:00:00",
      status: "live",
      cancel_reason: null,
    },
    listing: {
      name: "l-1",
      title: "Demo Auction Lot",
      unit: "kg",
      quantity_available: 500,
      seller_business_name: "Demo Seller",
      seller: "pub-1",
    },
    bids: [],
    highest_bid: null,
  })),
  placeBid: vi.fn(async () => ({ ok: true })),
  reviewAuction: vi.fn(async () => ({ ok: true })),
  cancelAuction: vi.fn(async () => ({ ok: true })),
  getSellerAuctions: vi.fn(async () => ({ items: [], total: 0, page: 1, page_size: 12, has_more: false })),
  getBuyerBids: vi.fn(async () => ({ items: [], total: 0, page: 1, page_size: 12, has_more: false })),
}));

import AuctionsRedirectPage from "@/app/(site)/auctions/page";
import AuctionDetailPage from "@/app/(site)/auctions/[id]/page";
import AdminAuctionApprovalsPage from "@/app/admin/auctions/page";
import BuyerBidsPage from "@/app/buyer/bids/page";
import BuyerDashboard from "@/app/buyer/page";
import BuyerOrdersPage from "@/app/buyer/orders/page";
import SellerAuctionsPage from "@/app/seller/auctions/page";
import SellerDashboard from "@/app/seller/page";
import SellerOrdersPage from "@/app/seller/orders/page";
import SellerReportsPage from "@/app/seller/reports/page";
import { CurrentUserProvider } from "@/components/providers/current-user-provider";
import { AdminOverview } from "@/components/shared/admin-overview";
import { AdminReportsView } from "@/components/shared/admin-reports-view";
import { ChatView } from "@/components/shared/chat-view";
import { OrderDetailView } from "@/components/shared/order-detail-view";
import type { CurrentUserInfo } from "@/lib/current-user-info";

/**
 * The demo (mock-store) pages. Their epics are not built yet, so they keep running on mock
 * orders and chats, which point at mock listings. These tests make sure those pages still
 * render, and that none of them links into the real marketplace with a mock listing id (which
 * would now be a dead link). Auctions/bids are real as of Epic 07 (mocked here via
 * @/app/actions/auctions, same as marketplace/listing-review above).
 */

const info = (role: "seller" | "buyer" | "staff" | "admin"): CurrentUserInfo => ({
  id: `${role}@demo.accreagemart.lk`,
  email: `${role}@demo.accreagemart.lk`,
  fullName: `Demo ${role}`,
  phone: "+94 77 000 0000",
  role,
  status: "active",
  verified: true,
});

function renderAs(role: "seller" | "buyer" | "staff" | "admin", ui: React.ReactElement) {
  return render(<CurrentUserProvider initialUser={info(role)}>{ui}</CurrentUserProvider>);
}

const marketplaceLinks = (container: HTMLElement) =>
  [...container.querySelectorAll('a[href^="/marketplace/"]')].map((a) => a.getAttribute("href"));

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom has no scrollIntoView; the demo chat scrolls to the latest message.
  Element.prototype.scrollIntoView = vi.fn();
});

describe("demo seller pages", () => {
  it("dashboard: real listing numbers beside demo orders and forecast", async () => {
    const { container } = renderAs("seller", <SellerDashboard />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Welcome/);
    // Active listings come from the real backend (mocked here), not the mock store.
    await waitFor(() => expect(screen.getByText("Active listings").parentElement).toHaveTextContent("4"));
    expect(screen.getByText("Incoming orders")).toBeInTheDocument();
    expect(marketplaceLinks(container)).toEqual([]);
  });

  it("orders", () => {
    const { container } = renderAs("seller", <SellerOrdersPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(container.querySelectorAll('a[href^="/seller/orders/"]').length).toBeGreaterThan(0);
    expect(marketplaceLinks(container)).toEqual([]);
  });

  it("auctions", async () => {
    const { getSellerAuctions } = await import("@/app/actions/auctions");
    const { container } = renderAs("seller", <SellerAuctionsPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    await waitFor(() => expect(getSellerAuctions).toHaveBeenCalled());
    expect(marketplaceLinks(container)).toEqual([]);
  });

  it("reports", () => {
    const { container } = renderAs("seller", <SellerReportsPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(marketplaceLinks(container)).toEqual([]);
  });

  it("chat", () => {
    const { container } = renderAs("seller", <ChatView perspective="seller" profileId="sp-1" />);
    expect(container.textContent).toBeTruthy();
    expect(marketplaceLinks(container)).toEqual([]);
  });
});

describe("demo buyer pages", () => {
  it("dashboard: shows the newest real listings, not mock ones", async () => {
    const { getMarketplace } = await import("@/app/actions/marketplace");
    const { container } = renderAs("buyer", <BuyerDashboard />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Welcome/);
    expect(screen.getByText("New on the marketplace")).toBeInTheDocument();
    await waitFor(() => expect(getMarketplace).toHaveBeenCalled());
    expect(marketplaceLinks(container)).toEqual([]);
  });

  it("orders", () => {
    const { container } = renderAs("buyer", <BuyerOrdersPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(marketplaceLinks(container)).toEqual([]);
  });

  it("bids", async () => {
    const { getBuyerBids } = await import("@/app/actions/auctions");
    const { container } = renderAs("buyer", <BuyerBidsPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    await waitFor(() => expect(getBuyerBids).toHaveBeenCalled());
    expect(marketplaceLinks(container)).toEqual([]);
  });

  it("chat", () => {
    const { container } = renderAs("buyer", <ChatView perspective="buyer" profileId="bp-1" />);
    expect(container.textContent).toBeTruthy();
    expect(marketplaceLinks(container)).toEqual([]);
  });
});

describe("demo order and auction detail pages", () => {
  it("an order, from both sides, without a link to a real listing page", () => {
    for (const perspective of ["buyer", "seller"] as const) {
      const { container, unmount } = renderAs(
        perspective,
        <OrderDetailView orderId="o-1001" perspective={perspective} backHref="/x" />,
      );
      expect(screen.getByText("Order summary")).toBeInTheDocument();
      expect(marketplaceLinks(container)).toEqual([]);
      unmount();
    }
  });

  it("an unknown order says so instead of crashing", () => {
    renderAs("buyer", <OrderDetailView orderId="o-nope" perspective="buyer" backHref="/x" />);
    expect(screen.getByText("Order not found")).toBeInTheDocument();
  });

  it("the auction detail page", async () => {
    const { container } = renderAs("buyer", <AuctionDetailPage />);
    await waitFor(() => expect(container.textContent).toBeTruthy());
    expect(screen.getByText("Demo Auction Lot")).toBeInTheDocument();
    expect(marketplaceLinks(container)).toEqual([]);
  });
});

describe("demo admin pages", () => {
  it("overview: real listing queue numbers beside demo stats", async () => {
    renderAs("admin", <AdminOverview registeredUsers={12} sellerCount={5} buyerCount={6} />);
    await waitFor(() => expect(screen.getByText("Active listings").parentElement).toHaveTextContent("7"));
    expect(screen.getByText("Active listings").parentElement).toHaveTextContent("3 pending review");
    expect(screen.getByText(/Listings awaiting approval/)).toBeInTheDocument();
    // Auctions are approved in the shared listing queue now: no separate queue row.
    expect(screen.queryByText("Auctions awaiting approval")).not.toBeInTheDocument();
  });

  it("reports", () => {
    const { container } = renderAs("admin", <AdminReportsView totalUsers={12} activeUsers={9} />);
    expect(container.textContent).toContain("12");
    expect(marketplaceLinks(container)).toEqual([]);
  });

  it("auction approvals", async () => {
    const { getReviewQueue } = await import("@/app/actions/listing-review");
    const { container } = renderAs("staff", <AdminAuctionApprovalsPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    await waitFor(() => expect(getReviewQueue).toHaveBeenCalled());
    expect(marketplaceLinks(container)).toEqual([]);
  });
});

describe("the public auctions address", () => {
  it("forwards to the marketplace filtered to auction listings", () => {
    expect(() => AuctionsRedirectPage()).toThrow("NEXT_REDIRECT:/marketplace?type=Auction");
    expect(redirectMock).toHaveBeenCalledWith("/marketplace?type=Auction");
  });
});
