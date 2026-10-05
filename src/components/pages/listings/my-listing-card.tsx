"use client";

import Link from "next/link";
import { History, ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listingActions, statusLabel, statusTone, stockLabel, type ListingAction } from "@/lib/listing-status";
import { mediaUrl } from "@/lib/media";
import { formatDate, formatDateTime, formatLKR } from "@/lib/utils";
import type { MyListingCard } from "@/types/listing.type";

interface MyListingCardProps {
  listing: MyListingCard;
  /** Opens the dialog for an action (edit is a link and doesn't come through here). */
  onAction: (action: Exclude<ListingAction, "edit">, listing: MyListingCard) => void;
}

const BUTTON_LABELS: Record<Exclude<ListingAction, "edit" | "history">, string> = {
  stock: "Update stock",
  hide: "Hide",
  unhide: "Show again",
  archive: "Archive",
  resubmit: "Resubmit",
  duplicate: "Duplicate",
};

const wall = (value: string) => value.slice(0, 19).replace(" ", "T");

function Banner({ listing }: { listing: MyListingCard }) {
  switch (listing.status) {
    case "Pending Approval":
      return (
        <p className="rounded-md border border-primary/30 bg-secondary p-2 text-xs text-secondary-foreground">
          Waiting for staff approval. Buyers can't see this listing yet.
        </p>
      );
    case "Rejected":
      return (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
          <span className="font-semibold">Rejected:</span> {listing.status_reason ?? "No reason was given."}{" "}
          Edit the listing, then resubmit it.
        </p>
      );
    case "Suspended":
      return (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
          <span className="font-semibold">Suspended by staff:</span> {listing.status_reason ?? "No reason was given."}{" "}
          Please contact staff.
        </p>
      );
    case "Hidden":
      return (
        <p className="rounded-md border bg-muted p-2 text-xs text-muted-foreground">
          Hidden from the marketplace. Buyers who already ordered it can still see it.
        </p>
      );
    case "Archived":
      return (
        <p className="rounded-md border bg-muted p-2 text-xs text-muted-foreground">
          Archived. You can duplicate it into a new listing.
        </p>
      );
    default:
      return null;
  }
}

export function MyListingRow({ listing, onAction }: MyListingCardProps) {
  const actions = listingActions(listing);
  const stock = stockLabel(listing.stock_state);
  const isAuction = listing.selling_type === "Auction";
  const disabledReasons = actions.filter((a) => !a.enabled && a.reason).map((a) => a.reason as string);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
        <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted sm:w-24">
          {listing.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(listing.cover_image)} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageOff className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold">{listing.title}</h2>
            <Badge variant={statusTone(listing.status)}>{statusLabel(listing.status)}</Badge>
            <Badge variant={isAuction ? "accent" : "secondary"}>{listing.selling_type}</Badge>
            {stock && <Badge variant={listing.stock_state === "out_of_stock" ? "destructive" : "warning"}>{stock}</Badge>}
          </div>

          <p className="text-sm text-muted-foreground">
            {listing.category_title ?? listing.category} · {listing.district}
            {!isAuction && listing.price_per_unit !== null && (
              <> · {formatLKR(listing.price_per_unit)}/{listing.unit}</>
            )}{" "}
            · {listing.quantity_available.toLocaleString()} {listing.unit}
            {isAuction ? " lot" : " available"} · created {formatDate(listing.created)}
          </p>

          {isAuction && listing.auction && (
            // A div, not a p: the badge is a div and a div cannot sit inside a p (hydration error).
            <div className="text-sm text-muted-foreground">
              Min bid {formatLKR(listing.auction.min_bid)}/{listing.unit} · starts{" "}
              {formatDateTime(wall(listing.auction.start_time))} · ends {formatDateTime(wall(listing.auction.end_time))}{" "}
              <Badge variant="outline" className="ml-1 capitalize">{listing.auction.status}</Badge>
            </div>
          )}

          <Banner listing={listing} />
          {listing.resubmission_note && listing.status === "Pending Approval" && (
            <p className="text-xs text-muted-foreground">Your note to staff: {listing.resubmission_note}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {actions.map(({ action, enabled, reason }) => {
              if (action === "edit") {
                return enabled ? (
                  <Button key={action} size="sm" variant="outline" asChild>
                    <Link href={`/seller/listings/${listing.name}/edit`}>Edit</Link>
                  </Button>
                ) : (
                  <Button key={action} size="sm" variant="outline" disabled title={reason}>Edit</Button>
                );
              }
              if (action === "history") {
                return (
                  <Button key={action} size="sm" variant="ghost" onClick={() => onAction("history", listing)}>
                    <History className="h-4 w-4" /> History
                  </Button>
                );
              }
              return (
                <Button
                  key={action}
                  size="sm"
                  variant={action === "archive" ? "ghost" : "outline"}
                  disabled={!enabled}
                  title={reason}
                  onClick={() => onAction(action, listing)}
                >
                  {BUTTON_LABELS[action]}
                </Button>
              );
            })}
          </div>
          {disabledReasons.length > 0 && (
            <p className="text-xs text-muted-foreground">{[...new Set(disabledReasons)].join(" ")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
