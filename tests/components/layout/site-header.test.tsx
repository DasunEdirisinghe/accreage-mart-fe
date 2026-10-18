import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/marketplace",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/app/actions/auth", () => ({ demoLogin: vi.fn() }));

const getNotifications = vi.fn();
const markAllNotificationsSeen = vi.fn();
const markNotificationSeen = vi.fn();
vi.mock("@/app/actions/notifications", () => ({
  getNotifications: (...args: unknown[]) => getNotifications(...args),
  markAllNotificationsSeen: (...args: unknown[]) => markAllNotificationsSeen(...args),
  markNotificationSeen: (...args: unknown[]) => markNotificationSeen(...args),
}));

let mockUser: { id: string; name: string; email: string; role: string; avatarColor: string } | null = null;
vi.mock("@/components/providers/current-user-provider", () => ({
  useCurrentUser: () => ({ user: mockUser, logout: vi.fn() }),
}));

import { SiteHeader } from "@/components/layout/site-header";
import type { AppNotification } from "@/lib/types";

const seller = { id: "u-seller-1", name: "Demo Seller", email: "seller@demo.lk", role: "seller", avatarColor: "bg-emerald-600" };

const notif = (overrides: Partial<AppNotification>): AppNotification => ({
  id: "n-1",
  subject: "Listing rejected",
  message: "Your listing was rejected.",
  eventType: "listing_rejected",
  documentType: "Listing",
  documentName: "lst-1",
  read: false,
  createdAt: "2026-10-18 10:00:00",
  ...overrides,
});

describe("SiteHeader notifications bell", () => {
  it("renders no unread badge for a guest (no fetch)", () => {
    mockUser = null;
    render(<SiteHeader />);
    expect(getNotifications).not.toHaveBeenCalled();
    expect(screen.queryByText(/sign in/i)).toBeInTheDocument();
  });

  it("fetches notifications for a logged-in user and shows the unread count", async () => {
    mockUser = seller;
    getNotifications.mockResolvedValueOnce([notif({ id: "n-1", read: false }), notif({ id: "n-2", read: true })]);

    render(<SiteHeader />);

    await waitFor(() => expect(getNotifications).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());
  });

  it("shows no badge when every notification is already read", async () => {
    mockUser = seller;
    getNotifications.mockResolvedValueOnce([notif({ id: "n-1", read: true })]);

    render(<SiteHeader />);

    await waitFor(() => expect(getNotifications).toHaveBeenCalled());
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });
});
