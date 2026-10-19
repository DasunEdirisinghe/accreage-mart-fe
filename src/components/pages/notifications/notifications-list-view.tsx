"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";

import { markAllNotificationsSeen, markNotificationSeen } from "@/app/actions/notifications";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { resolveNotificationLink } from "@/lib/notification-link";
import type { AppNotification, NotificationsPage, Role } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

function href(page: number): string {
  return page > 1 ? `/notifications?page=${page}` : "/notifications";
}

export function NotificationsListView({ data, role }: { data: NotificationsPage; role: Role }) {
  const [items, setItems] = React.useState<AppNotification[]>(data.items);
  const unreadCount = items.filter((n) => !n.read).length;

  React.useEffect(() => setItems(data.items), [data.items]);

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsSeen();
  }

  function handleRowClick(n: AppNotification) {
    if (n.read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    void markNotificationSeen(n.id);
  }

  return (
    <div className="container py-8">
      <PageHeader title="Notifications" description={`${data.total} total`}>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="You're all caught up." />
      ) : (
        <div className="divide-y rounded-lg border">
          {items.map((n) => {
            const link = resolveNotificationLink(n.documentType, n.documentName, role);
            const row = (
              <div className="flex items-start gap-3 px-4 py-3">
                <span
                  className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-muted" : "bg-accent")}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm leading-snug font-medium", n.read && "text-muted-foreground")}>
                    {n.subject || n.message}
                  </p>
                  {n.message && n.message !== n.subject && (
                    <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{n.message}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
            return link ? (
              <Link
                key={n.id}
                href={link}
                className="block transition-colors hover:bg-secondary"
                onClick={() => handleRowClick(n)}
              >
                {row}
              </Link>
            ) : (
              <div key={n.id} onClick={() => handleRowClick(n)}>
                {row}
              </div>
            );
          })}
        </div>
      )}

      {(data.page > 1 || data.hasMore) && (
        <div className="mt-6 flex items-center justify-between text-sm">
          {data.page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={href(data.page - 1)}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">Page {data.page}</span>
          {data.hasMore ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={href(data.page + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
