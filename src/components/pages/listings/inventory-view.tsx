"use client";

import Link from "next/link";
import { Boxes, ImageOff, TriangleAlert } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListingActions } from "@/components/pages/listings/listing-action-host";
import { statusLabel, statusTone, stockLabel } from "@/lib/listing-status";
import { mediaUrl } from "@/lib/media";
import type { MyListingCard, MyListingsResponse } from "@/types/listing.type";

const URGENCY: Record<string, number> = { out_of_stock: 0, low_stock: 1, in_stock: 2 };

/** Out-of-stock first, then low stock, then the rest (each group keeps the backend's order). */
export function sortByStockUrgency(items: MyListingCard[]): MyListingCard[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        (URGENCY[a.item.stock_state ?? "in_stock"] ?? 2) - (URGENCY[b.item.stock_state ?? "in_stock"] ?? 2) ||
        a.index - b.index,
    )
    .map(({ item }) => item);
}

export function InventoryView({ data }: { data: MyListingsResponse }) {
  const { dialogs, open } = useListingActions();
  const items = sortByStockUrgency(data.items);
  const out = items.filter((item) => item.stock_state === "out_of_stock").length;
  const low = items.filter((item) => item.stock_state === "low_stock").length;

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock for your Direct listings. Set an alert level on a listing to get an email when stock runs low."
      />

      {items.length === 0 ? (
        <EmptyState icon={Boxes} title="No stock to track" description="Direct listings you create will appear here.">
          <Button asChild>
            <Link href="/seller/listings/new">Create listing</Link>
          </Button>
        </EmptyState>
      ) : (
        <>
          {(out > 0 || low > 0) && (
            <p role="status" className="mb-4 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <TriangleAlert className="h-4 w-4" />
              {out > 0 && `${out} out of stock`}
              {out > 0 && low > 0 && " · "}
              {low > 0 && `${low} running low`}
            </p>
          )}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Product</TableHead>
                    <TableHead>Listing</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Alert level</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="pr-4 text-right">Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((listing) => {
                    const label = stockLabel(listing.stock_state);
                    const editable = listing.status !== "Suspended";
                    return (
                      <TableRow key={listing.name}>
                        <TableCell className="max-w-64 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                              {listing.cover_image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={mediaUrl(listing.cover_image)} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <ImageOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <span className="truncate font-medium">{listing.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusTone(listing.status)}>{statusLabel(listing.status)}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {listing.quantity_available.toLocaleString()} {listing.unit}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {listing.low_stock_level > 0 ? `${listing.low_stock_level} ${listing.unit}` : "Not set"}
                        </TableCell>
                        <TableCell>
                          {label ? (
                            <Badge variant={listing.stock_state === "out_of_stock" ? "destructive" : "warning"}>{label}</Badge>
                          ) : (
                            <Badge variant="success">In stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!editable}
                            title={editable ? undefined : "This listing is suspended. Please contact staff."}
                            onClick={() => void open("stock", listing)}
                          >
                            Update stock
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {(data.page > 1 || data.has_more) && (
            <div className="mt-6 flex items-center justify-between text-sm">
              {data.page > 1 ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/seller/inventory?page=${data.page - 1}`}>Previous</Link>
                </Button>
              ) : (
                <span />
              )}
              <span className="text-muted-foreground">Page {data.page}</span>
              {data.has_more ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/seller/inventory?page=${data.page + 1}`}>Next</Link>
                </Button>
              ) : (
                <span />
              )}
            </div>
          )}
        </>
      )}

      {dialogs}
    </>
  );
}
