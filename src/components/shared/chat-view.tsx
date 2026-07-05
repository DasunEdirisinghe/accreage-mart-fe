"use client";

import * as React from "react";
import { Send, MessageSquare } from "lucide-react";

import { useDB } from "@/hooks/use-db";
import { sendMessage } from "@/lib/services/engagement";
import { cn, formatDateTime, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";

/**
 * Shared buyer/seller chat UI (SRS 2.10).
 * WIRING LATER: swap the store for frappe.realtime (socket.io) events.
 */
export function ChatView({
  perspective,
  profileId,
}: {
  perspective: "buyer" | "seller";
  profileId: string;
}) {
  const db = useDB();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const threads = db.chats.filter((c) =>
    perspective === "buyer" ? c.buyerId === profileId : c.sellerId === profileId
  );
  const active = threads.find((t) => t.id === activeId) ?? threads[0] ?? null;

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length]);

  if (threads.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No conversations yet"
        description={
          perspective === "buyer"
            ? "Start a chat from any listing page to negotiate with sellers."
            : "Buyers will appear here when they message you about your listings."
        }
      />
    );
  }

  const counterpartName = (t: (typeof threads)[number]) => {
    if (perspective === "buyer") {
      const sp = db.sellerProfiles.find((s) => s.id === t.sellerId);
      return sp?.businessName ?? "Seller";
    }
    const bp = db.buyerProfiles.find((b) => b.id === t.buyerId);
    return bp?.businessName ?? "Buyer";
  };

  const send = () => {
    if (!active || !draft.trim()) return;
    sendMessage(active.id, profileId, draft.trim());
    setDraft("");
  };

  return (
    <Card className="grid h-[600px] overflow-hidden md:grid-cols-[260px_1fr]">
      {/* thread list */}
      <div className="hidden border-r md:block">
        <p className="border-b p-3 text-sm font-semibold">Conversations</p>
        <div className="overflow-y-auto">
          {threads.map((t) => {
            const listing = t.listingId ? db.listings.find((l) => l.id === t.listingId) : null;
            const last = t.messages[t.messages.length - 1];
            return (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={cn(
                  "flex w-full items-start gap-2.5 border-b p-3 text-left transition-colors hover:bg-secondary/60",
                  active?.id === t.id && "bg-secondary"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {initials(counterpartName(t))}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{counterpartName(t)}</p>
                  {listing && (
                    <p className="truncate text-xs text-primary">{listing.title}</p>
                  )}
                  {last && (
                    <p className="truncate text-xs text-muted-foreground">{last.text}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* messages */}
      {active ? (
        <div className="flex min-w-0 flex-col">
          <div className="border-b p-3">
            <p className="text-sm font-semibold">{counterpartName(active)}</p>
            {active.listingId && (
              <p className="text-xs text-muted-foreground">
                Re: {db.listings.find((l) => l.id === active.listingId)?.title}
              </p>
            )}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
            {active.messages.map((m) => {
              const mine = m.senderId === profileId;
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                      mine
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm border bg-card"
                    )}
                  >
                    <p>{m.text}</p>
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        mine ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {formatDateTime(m.sentAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <form
            className="flex gap-2 border-t p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <Input
              placeholder="Type a message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit" size="icon" disabled={!draft.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : null}
    </Card>
  );
}
