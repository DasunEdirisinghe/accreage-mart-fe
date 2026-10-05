import Link from "next/link";
import { ClipboardCheck, ImageOff, Search } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { statusLabel, statusTone } from "@/lib/listing-status";
import { mediaUrl } from "@/lib/media";
import { DECISION_PAST, REVIEW_TABS, type DecisionKind } from "@/lib/review-tabs";
import { cn, formatDate, formatDateTime, formatLKR } from "@/lib/utils";
import type { ReviewQueueItem, ReviewQueueResponse } from "@/types/listing-review.type";

interface ReviewQueueViewProps {
  data: ReviewQueueResponse;
  /** The slug of the current tab (see REVIEW_TABS). */
  tab: string;
  search?: string;
  /** Set right after a decision (from the redirect's query string). */
  decided?: { name: string; kind: DecisionKind };
}

function href(tab: string, search: string | undefined, page?: number): string {
  const query = new URLSearchParams();
  if (tab !== REVIEW_TABS[0].slug) query.set("tab", tab);
  if (search) query.set("q", search);
  if (page && page > 1) query.set("page", String(page));
  const text = query.toString();
  return `/admin/approvals${text ? `?${text}` : ""}`;
}

const wall = (value: string) => value.slice(0, 19).replace(" ", "T");

function QueueRow({ item }: { item: ReviewQueueItem }) {
  const isAuction = item.selling_type === "Auction";
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex h-20 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted sm:w-20">
          {item.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(item.cover_image)} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageOff className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/approvals/${item.name}`} className="font-semibold hover:text-primary hover:underline">
              {item.title}
            </Link>
            <Badge variant={isAuction ? "accent" : "secondary"}>{item.selling_type}</Badge>
            <Badge variant={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
            {item.previous_rejections > 0 && (
              <Badge variant="warning">
                Rejected before{item.previous_rejections > 1 ? ` ×${item.previous_rejections}` : ""}
              </Badge>
            )}
            {item.resubmitted && <Badge variant="info">Resubmitted</Badge>}
          </div>

          <p className="text-sm text-muted-foreground">
            {item.seller_business_name} · {item.category_title ?? "No category"} ·{" "}
            {isAuction
              ? `${item.quantity_available.toLocaleString()} ${item.unit} lot`
              : `${formatLKR(item.price_per_unit ?? 0)}/${item.unit} · ${item.quantity_available.toLocaleString()} ${item.unit}`}{" "}
            · submitted {formatDate(item.submitted_on ?? item.modified)}
          </p>

          {isAuction && item.auction && (
            <div className="text-sm text-muted-foreground">
              Min bid {formatLKR(item.auction.min_bid)}/{item.unit} · starts{" "}
              {formatDateTime(wall(item.auction.start_time))}{" "}
              {item.auction.start_passed && (
                <Badge variant="destructive" className="ml-1">Start time has passed</Badge>
              )}
            </div>
          )}
        </div>

        <Button asChild variant={item.status === "Pending Approval" ? "default" : "outline"} className="shrink-0">
          <Link href={`/admin/approvals/${item.name}`}>Review</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** The shared queue: Direct and Auction listings together. Decisions are made on the listing's own page. */
export function ReviewQueueView({ data, tab, search, decided }: ReviewQueueViewProps) {
  const emptyTitle = tab === REVIEW_TABS[0].slug ? "Queue is clear" : "Nothing here";

  return (
    <>
      <PageHeader
        title="Listing approvals"
        description="Direct and auction listings share one queue. Open a listing to see it exactly as buyers will, then approve, reject or suspend it."
      />

      {decided && (
        <p role="status" className="mb-4 rounded-md border border-primary/30 bg-secondary p-3 text-sm">
          Listing {decided.name} was {DECISION_PAST[decided.kind]}. The seller has been told.
        </p>
      )}

      <nav aria-label="Listing status" className="mb-4 flex flex-wrap gap-2">
        {REVIEW_TABS.map((entry) => {
          const selected = entry.slug === tab;
          return (
            <Link
              key={entry.slug}
              href={href(entry.slug, search)}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
                selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {entry.label}
              <Badge variant={selected ? "secondary" : "muted"} className="px-1.5 py-0">
                {data.counts[entry.status]}
              </Badge>
            </Link>
          );
        })}
      </nav>

      <form action="/admin/approvals" method="get" className="mb-4 flex max-w-md gap-2">
        {tab !== REVIEW_TABS[0].slug && <input type="hidden" name="tab" value={tab} />}
        <Input name="q" defaultValue={search} placeholder="Search listings" aria-label="Search listings" />
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4" /> Search
        </Button>
      </form>

      {data.items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={emptyTitle}
          description={search ? "No listings match your search." : "No listings with this status."}
        />
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => (
            <QueueRow key={item.name} item={item} />
          ))}
        </div>
      )}

      {(data.page > 1 || data.has_more) && (
        <div className="mt-6 flex items-center justify-between text-sm">
          {data.page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={href(tab, search, data.page - 1)}>Previous</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">Page {data.page}</span>
          {data.has_more ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={href(tab, search, data.page + 1)}>Next</Link>
            </Button>
          ) : (
            <span />
          )}
        </div>
      )}
    </>
  );
}
