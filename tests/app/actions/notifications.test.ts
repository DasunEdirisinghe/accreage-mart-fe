import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/frappe", () => ({ frappeFetch: vi.fn() }));

import {
  getNotifications,
  getNotificationsPage,
  markAllNotificationsSeen,
  markNotificationSeen,
} from "@/app/actions/notifications";
import { frappeFetch } from "@/lib/frappe";

const mockFetch = vi.mocked(frappeFetch);

afterEach(() => vi.clearAllMocks());

describe("getNotifications", () => {
  it("reshapes raw Notification Log rows into AppNotification", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        message: [
          {
            name: "notif-1",
            subject: "Listing rejected",
            email_content: "<p>Your listing was rejected.</p>",
            custom_event_type: "listing_rejected",
            document_type: "Listing",
            document_name: "lst-1",
            read: 0,
            creation: "2026-10-18 10:00:00",
          },
        ],
      }),
    } as Response);

    const rows = await getNotifications();
    expect(rows).toEqual([
      {
        id: "notif-1",
        subject: "Listing rejected",
        message: "Your listing was rejected.",
        eventType: "listing_rejected",
        documentType: "Listing",
        documentName: "lst-1",
        read: false,
        createdAt: "2026-10-18 10:00:00",
      },
    ]);
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.notifications.list_notifications");
    expect((init as { body: Record<string, unknown> }).body).toEqual({ limit: 20 });
  });

  it("treats a truthy read flag as read", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        message: [
          {
            name: "notif-2",
            subject: "s",
            email_content: "m",
            custom_event_type: "e",
            document_type: null,
            document_name: null,
            read: 1,
            creation: "2026-10-18 10:00:00",
          },
        ],
      }),
    } as Response);
    const rows = await getNotifications();
    expect(rows[0].read).toBe(true);
    expect(rows[0].documentType).toBeNull();
  });

  it("returns an empty list on error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Frappe request failed: 403 nope"));
    expect(await getNotifications()).toEqual([]);
  });
});

describe("getNotificationsPage", () => {
  it("reshapes a paginated page into NotificationsPage", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        message: {
          notification_logs: [
            {
              name: "notif-1",
              subject: "Listing rejected",
              email_content: "<p>Your listing was rejected.</p>",
              custom_event_type: "listing_rejected",
              document_type: "Listing",
              document_name: "lst-1",
              read: 0,
              creation: "2026-10-18 10:00:00",
            },
          ],
          page: 2,
          page_size: 20,
          total: 25,
          has_more: false,
        },
      }),
    } as Response);

    const result = await getNotificationsPage(2, 20);
    expect(result).toEqual({
      items: [
        {
          id: "notif-1",
          subject: "Listing rejected",
          message: "Your listing was rejected.",
          eventType: "listing_rejected",
          documentType: "Listing",
          documentName: "lst-1",
          read: false,
          createdAt: "2026-10-18 10:00:00",
        },
      ],
      page: 2,
      pageSize: 20,
      total: 25,
      hasMore: false,
    });
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.notifications.list_notifications_page");
    expect((init as { body: Record<string, unknown> }).body).toEqual({ page: 2, page_size: 20 });
  });

  it("returns an empty page on error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Frappe request failed: 403 nope"));
    expect(await getNotificationsPage()).toEqual({ items: [], page: 1, pageSize: 20, total: 0, hasMore: false });
  });
});

describe("markNotificationSeen", () => {
  it("posts the notification name and reports ok", async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ message: { ok: true } }) } as Response);
    const res = await markNotificationSeen("notif-1");
    expect(res.ok).toBe(true);
    const [method, init] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.notifications.mark_notification_seen");
    expect((init as { body: Record<string, unknown> }).body).toEqual({ name: "notif-1" });
  });

  it("reports failure without throwing", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Frappe request failed: 403 nope"));
    expect(await markNotificationSeen("notif-1")).toEqual({ ok: false });
  });
});

describe("markAllNotificationsSeen", () => {
  it("calls the mark-all-seen endpoint and reports ok", async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ message: { ok: true } }) } as Response);
    const res = await markAllNotificationsSeen();
    expect(res.ok).toBe(true);
    const [method] = mockFetch.mock.calls[0];
    expect(method).toBe("accreage_mart.api.notifications.mark_all_seen");
  });

  it("reports failure without throwing", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Frappe request failed: 403 nope"));
    expect(await markAllNotificationsSeen()).toEqual({ ok: false });
  });
});
