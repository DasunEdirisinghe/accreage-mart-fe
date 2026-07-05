"use client";

import Link from "next/link";
import { Gavel, CalendarClock, CheckCircle2 } from "lucide-react";

import { useDB } from "@/hooks/use-db";
import { visibleAuctions } from "@/lib/services/auctions";
import { cn, formatLKR, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { TimeLeft } from "@/components/shared/time-left";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";

const STATUS_META = {
  live: { label: "Live now", variant: "accent" as const },
  scheduled: { label: "Upcoming", variant: "info" as const },
  ended: { label: "Ended", variant: "muted" as const },
};

export default function AuctionsPage() {
  const db = useDB();
  const auctions = visibleAuctions(db);

  const renderList = (statuses: string[]) => {
    const filtered = auctions.filter((a) => statuses.includes(a.auction.status));
    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={Gavel}
          title="No auctions here right now"
          description="Check back soon, sellers schedule new auctions regularly."
        />
      );
    }
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map(({ auction, listing, bids, highestBid }) => {
          const meta = STATUS_META[auction.status as keyof typeof STATUS_META];
          return (
            <Link key={auction.id} href={`/auctions/${auction.id}`} className="block">
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex gap-4 p-5">
                  <span
                    className={cn(
                      "flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-4xl",
                      listing.imageGradient
                    )}
                  >
                    {listing.image}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {bids.length} bid{bids.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <h3 className="truncate font-semibold">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Lot: {listing.quantityAvailable.toLocaleString()} {listing.unit} ·{" "}
                      {listing.location}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {highestBid ? "Highest bid" : "Starting bid"}
                        </p>
                        <p className="font-bold text-primary">
                          {formatLKR(highestBid ? highestBid.amount : auction.minBid)}
                          <span className="text-xs font-normal">/{listing.unit}</span>
                        </p>
                      </div>
                      <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        {auction.status === "live" && (
                          <>
                            <Gavel className="h-3.5 w-3.5 text-accent" />
                            <TimeLeft endTime={auction.endTime} />
                          </>
                        )}
                        {auction.status === "scheduled" && (
                          <>
                            <CalendarClock className="h-3.5 w-3.5" />
                            {formatDateTime(auction.startTime)}
                          </>
                        )}
                        {auction.status === "ended" && (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Closed {formatDateTime(auction.endTime)}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container py-8">
      <PageHeader
        title="Auctions"
        description="Competitive bidding for fair price discovery. All lots are staff-approved before going live."
      />
      <Tabs defaultValue="live">
        <TabsList>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="scheduled">Upcoming</TabsTrigger>
          <TabsTrigger value="ended">Past auctions</TabsTrigger>
        </TabsList>
        <TabsContent value="live" className="mt-4">{renderList(["live"])}</TabsContent>
        <TabsContent value="scheduled" className="mt-4">{renderList(["scheduled"])}</TabsContent>
        <TabsContent value="ended" className="mt-4">{renderList(["ended"])}</TabsContent>
      </Tabs>
    </div>
  );
}
