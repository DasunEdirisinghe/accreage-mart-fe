"use server";

import { frappeFetch } from "@/lib/frappe";
import { NOTIFICATION_METHODS } from "@/lib/methods";
import type { AppNotification } from "@/lib/types";

/** Raw `Notification Log` row shape as returned by get_notification_logs (fields=["*"]). */
interface RawNotificationLog {
  name: string;
  subject?: string | null;
  email_content?: string | null;
  custom_event_type?: string | null;
  document_type?: string | null;
  document_name?: string | null;
  read?: number | boolean;
  creation?: string;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function toAppNotification(raw: RawNotificationLog): AppNotification {
  return {
    id: raw.name,
    subject: raw.subject ?? "",
    message: stripHtml(raw.email_content ?? ""),
    eventType: raw.custom_event_type ?? "",
    documentType: raw.document_type ?? null,
    documentName: raw.document_name ?? null,
    read: Boolean(raw.read),
    createdAt: raw.creation ?? new Date().toISOString(),
  };
}

/** Empty list on any failure — the bell renders with nothing rather than throwing. */
export async function getNotifications(limit = 20): Promise<AppNotification[]> {
  try {
    const res = await frappeFetch(NOTIFICATION_METHODS.LIST, {
      method: "POST",
      body: { limit },
      cache: "no-store",
    });
    const rows = ((await res.json()) as { message: RawNotificationLog[] }).message ?? [];
    return rows.map(toAppNotification);
  } catch {
    return [];
  }
}

export async function markNotificationSeen(name: string): Promise<{ ok: boolean }> {
  try {
    await frappeFetch(NOTIFICATION_METHODS.MARK_SEEN, {
      method: "POST",
      body: { name },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function markAllNotificationsSeen(): Promise<{ ok: boolean }> {
  try {
    await frappeFetch(NOTIFICATION_METHODS.MARK_ALL_SEEN, { method: "POST" });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
