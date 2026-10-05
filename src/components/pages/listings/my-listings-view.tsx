"use client";

import Link from "next/link";
import { Plus, Search, Tags } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListingActions } from "@/components/pages/listings/listing-action-host";
import { MyListingRow } from "@/components/pages/listings/my-listing-card";
import { cn } from "@/lib/utils";
import type { MyListingsResponse, MyListingsTab } from "@/types/listing.type";

export const TAB_LABELS: { key: MyListingsTab | undefined; label: string }[] = [
  { key: undefined, label: "All" },
  { key: "pending", label: "Pending Approval" },
  { key: "live", label: "Published" },
  { key: "hidden", label: "Hidden" },
  { key: "rejected", label: "Rejected" },
  { key: "suspended", label: "Suspended" },
  { key: "archived", label: "Archived" },
];

interface MyListingsViewProps {
  data: MyListingsResponse;
  tab?: MyListingsTab;
  search?: string;
  /** Set right after creating / editing a listing (from the redirect's query string). */
  flash?: { submitted?: string; updated?: string };
}

function href(tab: MyListingsTab | undefined, search: string | undefined, page?: number): string {
  const query = new URLSearchParams();
  if (tab) query.set("tab", tab);
  if (search) query.set("q", search);
  if (page && page > 1) query.set("page", String(page));
  const text = query.toString();
  return `/seller/listings${text ? `?${text}` : ""}`;
}

export function MyListingsView({ data, tab, search, flash }: MyListingsViewProps) {
  const { dialogs, open } = useListingActions();
  const total = Object.values(data.counts).reduce((sum, count) => sum + count, 0);

  return (
    <>
      <PageHeader
        title="My listings"
        description="New listings are reviewed by platform staff before going live."
      >
        <Button asChild>
          <Link href="/seller/listings/new">
            <Plus className="h-4 w-4" /> New listing
          </Link>
        </Button>
      </PageHeader>

      {flash?.submitted && (
        <p role="status" className="mb-4 rounded-md border border-primary/30 bg-secondary p-3 text-sm">
          Your listing was submitted. It is waiting for staff approval, and you'll see it here as Pending Approval.
        </p>
      )}
      {flash?.updated && (
        <p role="status" className="mb-4 rounded-md border border-primary/30 bg-secondary p-3 text-sm">
          Your changes were saved.
        </p>
      )}

      <nav aria-label="Listing status" className="mb-4 flex flex-wrap gap-2">
        {TAB_LABELS.map(({ key, label }) => {
          const count = key ? data.counts[key] : total;
          const selected = key === tab;
          return (
            <Link
              key={label}
              href={href(key, search)}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
                selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {label}
              <Badge variant={selected ? "secondary" : "muted"} className="px-1.5 py-0">{count}</Badge>
            </Link>
          );
        })}
      </nav>

      <form action="/seller/listings" method="get" className="mb-4 flex max-w-md gap-2">
        {tab && <input type="hidden" name="tab" value={tab} />}
        <Input name="q" defaultValue={search} placeholder="Search your listings" aria-label="Search your listings" />
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4" /> Search
        </Button>
      </form>

      {data.items.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={total === 0 ? "No listings yet" : "Nothing here"}
          description={
            total === 0
              ? "Create your first product listing."
              : search
                ? "No listings match your search."
                : "You have no listings with this status."
          }
        >
          {total === 0 && (
            <Button asChild>
              <Link href="/seller/listings/new">Create listing</Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {data.items.map((listing) => (
            <MyListingRow key={listing.name} listing={listing} onAction={(action, row) => void open(action, row)} />
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

      {dialogs}
    </>
  );
}
