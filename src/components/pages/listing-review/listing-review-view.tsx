"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, ExternalLink, ImageOff, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewDecisionDialog } from "@/components/pages/listing-review/review-decision-dialogs";
import { statusLabel, statusTone } from "@/lib/listing-status";
import { mediaUrl } from "@/lib/media";
import { DECISION_PAST, relevantDecisions, type DecisionKind } from "@/lib/review-tabs";
import { cn, formatDate, formatDateTime, formatLKR } from "@/lib/utils";
import type { ReviewListingResponse } from "@/types/listing-review.type";

const wall = (value: string) => value.slice(0, 19).replace(" ", "T");

const HISTORY_TEXT = {
  Approved: "Approved",
  Rejected: "Rejected",
  Suspended: "Suspended",
  Resubmitted: "Resubmitted by the seller",
} as const;

const BUTTONS: Record<DecisionKind, { label: string; reinstateLabel?: string; variant: "default" | "destructive" | "outline" }> = {
  approve: { label: "Approve", reinstateLabel: "Reinstate", variant: "default" },
  reject: { label: "Reject", variant: "destructive" },
  suspend: { label: "Suspend", variant: "destructive" },
};

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** The listing as buyers will see it. */
function ListingPreview({ data }: { data: ReviewListingResponse }) {
  const { listing } = data;
  const [selected, setSelected] = React.useState(0);
  const images = listing.images;
  const isAuction = listing.selling_type === "Auction";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">As buyers will see it</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex h-64 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {images[selected] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(images[selected].url)} alt={listing.title} className="h-full w-full object-contain" />
            ) : (
              <ImageOff className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          {images.length > 1 && (
            <ul className="flex flex-wrap gap-2">
              {images.map((image, index) => (
                <li key={image.url}>
                  <button
                    type="button"
                    aria-label={`Show photo ${index + 1}${image.is_cover ? " (cover)" : ""}`}
                    aria-current={index === selected}
                    onClick={() => setSelected(index)}
                    className={cn("h-14 w-14 overflow-hidden rounded border", index === selected && "ring-2 ring-primary")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl(image.url)} alt="" className="h-full w-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{listing.title}</h2>
            <Badge variant={isAuction ? "accent" : "secondary"}>{listing.selling_type}</Badge>
            {listing.organic && <Badge variant="success">Organic</Badge>}
            {!listing.in_stock && !isAuction && <Badge variant="destructive">Out of stock</Badge>}
          </div>
          {isAuction && listing.auction ? (
            <div className="space-y-1 text-sm">
              <div className="text-lg font-bold text-primary">
                Min bid {formatLKR(listing.auction.min_bid)}
                <span className="text-xs font-normal text-muted-foreground"> per {listing.unit}</span>
              </div>
              <div className="text-muted-foreground">
                {listing.quantity_available.toLocaleString()} {listing.unit} lot · starts{" "}
                {formatDateTime(wall(listing.auction.start_time))} · ends {formatDateTime(wall(listing.auction.end_time))}
                {listing.auction.duration_hours !== undefined && ` · ${listing.auction.duration_hours} hours`}
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-sm">
              <div className="text-lg font-bold text-primary">
                {formatLKR(listing.price_per_unit ?? 0)}
                <span className="text-xs font-normal text-muted-foreground"> per {listing.unit}</span>
              </div>
              <div className="text-muted-foreground">
                {listing.quantity_available.toLocaleString()} {listing.unit} available · minimum order{" "}
                {listing.min_order_qty ?? 1} {listing.unit}
              </div>
            </div>
          )}
        </div>

        <p className="whitespace-pre-line text-sm">{listing.description}</p>

        <dl className="space-y-2">
          <Detail label="Category">
            {listing.category.title} <span className="text-muted-foreground">· {listing.category.area}</span>
          </Detail>
          <Detail label="Location">
            {listing.location}, {listing.district}
            {listing.map_url && (
              <a
                href={listing.map_url}
                target="_blank"
                rel="noreferrer"
                className="ml-2 inline-flex items-center gap-1 text-primary underline"
              >
                <MapPin className="h-3 w-3" /> Open in Google Maps <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </Detail>
          {listing.organic && <Detail label="Certification">{listing.certification || "Not provided"}</Detail>}
          <Detail label="Seller">
            {listing.seller.business_name} · {listing.seller.district}
            {listing.seller.verified && <Badge variant="success" className="ml-2">Verified</Badge>}
          </Detail>
        </dl>
      </CardContent>
    </Card>
  );
}

/** What staff need to decide: seller, price reference, history. */
function ReviewContext({ data }: { data: ReviewListingResponse }) {
  const { listing, review } = data;
  const isAuction = listing.selling_type === "Auction";
  const { seller } = review;
  const hasRange = review.ai_suggested_min !== null && review.ai_suggested_max !== null;
  const price = listing.price_per_unit;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Seller</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <Detail label="Business">{seller.business_name}</Detail>
            <Detail label="Email">{seller.email}</Detail>
            <Detail label="Account">
              <Badge variant={seller.account_status === "active" ? "success" : "destructive"}>{seller.account_status}</Badge>
              {seller.verified ? (
                <Badge variant="success" className="ml-2">Verified</Badge>
              ) : (
                <Badge variant="warning" className="ml-2">Not verified</Badge>
              )}
            </Detail>
            <Detail label="Member since">{formatDate(seller.member_since)}</Detail>
            <Detail label="Total sales">{formatLKR(seller.total_sales)}</Detail>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">AI price reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {hasRange ? (
            <>
              <div>
                Suggested range at submission:{" "}
                <span className="font-semibold">
                  {formatLKR(review.ai_suggested_min!)} – {formatLKR(review.ai_suggested_max!)}
                </span>{" "}
                per {listing.unit}
              </div>
              {!isAuction && price !== null && (
                <div className="text-muted-foreground">
                  Seller's price {formatLKR(price)}:{" "}
                  {price > review.ai_suggested_max!
                    ? "above the suggested range"
                    : price < review.ai_suggested_min!
                      ? "below the suggested range"
                      : "within the suggested range"}
                </div>
              )}
            </>
          ) : (
            <div className="text-muted-foreground">No price suggestion was available when this was submitted.</div>
          )}
          {isAuction && review.ai_fair_value !== null && (
            <div>
              Fair value at the start date: <span className="font-semibold">{formatLKR(review.ai_fair_value)}</span> per{" "}
              {listing.unit}
            </div>
          )}
          <div className="text-xs text-muted-foreground">A guide only. It is a snapshot, not a live figure.</div>
        </CardContent>
      </Card>

      {review.resubmission_note && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Seller's note</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{review.resubmission_note}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Review history</CardTitle>
        </CardHeader>
        <CardContent>
          {review.history.length === 0 ? (
            <div className="text-sm text-muted-foreground">No earlier decisions on this listing.</div>
          ) : (
            <ol className="space-y-3 text-sm">
              {review.history.map((entry) => (
                <li key={entry.name} className="rounded-md border p-3">
                  <div className="font-medium">
                    {HISTORY_TEXT[entry.action]}
                    {entry.action !== "Resubmitted" && <span className="font-normal text-muted-foreground"> by {entry.reviewer_name}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(entry.reviewed_on.replace(" ", "T"))}</div>
                  {entry.reason && <div className="mt-1">Reason: {entry.reason}</div>}
                  {entry.seller_note && <div className="mt-1">Seller's note: {entry.seller_note}</div>}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Edit history</CardTitle>
        </CardHeader>
        <CardContent>
          {review.edit_history.length === 0 ? (
            <div className="text-sm text-muted-foreground">No edits recorded.</div>
          ) : (
            <ul className="space-y-3 text-sm">
              {review.edit_history.map((entry, index) => (
                <li key={`${entry.at}-${index}`}>
                  <div className="text-xs text-muted-foreground">
                    {entry.user} · {formatDateTime(entry.at.replace(" ", "T"))}
                  </div>
                  {entry.changes.map((change) => (
                    <div key={change.field} className="truncate">
                      <span className="font-medium">{change.field}:</span> {change.old ?? "empty"} → {change.new ?? "empty"}
                    </div>
                  ))}
                  {entry.table_rows_changed > 0 && <div className="text-muted-foreground">Photos changed</div>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ListingReviewView({ data }: { data: ReviewListingResponse }) {
  const router = useRouter();
  const { listing, actions } = data;
  const [dialog, setDialog] = React.useState<DecisionKind | null>(null);
  const [stale, setStale] = React.useState(false);

  const decisions = relevantDecisions(listing.status);
  const blocked = decisions.filter((kind) => !actions[kind].allowed);

  const onDecided = (kind: DecisionKind) => {
    toast.success(`Listing ${DECISION_PAST[kind]}`);
    router.push(`/admin/approvals?decided=${encodeURIComponent(listing.name)}&as=${kind}`);
  };

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
        <Link href="/admin/approvals">
          <ChevronLeft className="h-4 w-4" /> Listing approvals
        </Link>
      </Button>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Review listing</h1>
            <Badge variant={statusTone(listing.status)}>{statusLabel(listing.status)}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {listing.name} · submitted {data.review.submitted_on ? formatDate(data.review.submitted_on) : "–"}
            {listing.status_reason && ` · last reason: ${listing.status_reason}`}
          </p>
        </div>

        {decisions.length > 0 && (
          <div className="flex shrink-0 gap-2">
            {decisions.map((kind) => (
              <Button
                key={kind}
                variant={BUTTONS[kind].variant}
                disabled={!actions[kind].allowed || stale}
                onClick={() => setDialog(kind)}
              >
                {kind === "approve" && listing.status === "Suspended"
                  ? BUTTONS.approve.reinstateLabel
                  : BUTTONS[kind].label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {stale && (
        <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            This listing changed after you opened it. Reload it to review the latest version.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setStale(false);
              router.refresh();
            }}
          >
            Reload
          </Button>
        </div>
      )}

      {blocked.length > 0 && (
        <div role="status" className="mb-4 space-y-1 rounded-md border bg-muted p-3 text-sm text-muted-foreground">
          {blocked.map((kind) => (
            <div key={kind}>{actions[kind].blocked_reason}</div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <ListingPreview data={data} />
        <ReviewContext data={data} />
      </div>

      {dialog && (
        <ReviewDecisionDialog
          kind={dialog}
          name={listing.name}
          title={listing.title}
          status={listing.status}
          expectedModified={data.expected_modified}
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          onDecided={onDecided}
          onStale={() => setStale(true)}
        />
      )}
    </>
  );
}
