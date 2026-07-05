"use client";

import * as React from "react";
import { Boxes, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { useDB } from "@/hooks/use-db";
import { useAuth } from "@/components/providers/auth-provider";
import { updateListingStock } from "@/lib/services/listings";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const LOW_STOCK_THRESHOLD = 0.2; // 20% of min order × 10 heuristic for the demo

export default function SellerInventoryPage() {
  const db = useDB();
  const { sellerProfile } = useAuth();
  const [edits, setEdits] = React.useState<Record<string, string>>({});
  if (!sellerProfile) return null;

  const mine = db.listings.filter((l) => l.sellerId === sellerProfile.id);
  const capacity = (l: (typeof mine)[number]) => Math.max(l.minOrderQty * 10, l.quantityAvailable);

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Real-time stock tracking with low-stock alerts (SRS REQ 2.1-9)."
      />
      {mine.length === 0 ? (
        <EmptyState icon={Boxes} title="No inventory" description="Create listings to start tracking stock." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Product</TableHead>
                  <TableHead className="w-48">Stock level</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Min order</TableHead>
                  <TableHead className="pr-4 text-right">Update stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mine.map((l) => {
                  const pct = Math.min(100, Math.round((l.quantityAvailable / capacity(l)) * 100));
                  const low = l.quantityAvailable < capacity(l) * LOW_STOCK_THRESHOLD;
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="max-w-56 pl-4">
                        <span className="block truncate font-medium">
                          {l.image} {l.title}
                        </span>
                        {low && (
                          <Badge variant="warning" className="mt-1">
                            <TriangleAlert className="mr-1 h-3 w-3" /> Low stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Progress value={pct} />
                        <span className="mt-1 block text-xs text-muted-foreground">{pct}%</span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {l.quantityAvailable.toLocaleString()} {l.unit}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {l.minOrderQty} {l.unit}
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-2">
                          <Input
                            type="number"
                            className="h-8 w-28"
                            placeholder={String(l.quantityAvailable)}
                            value={edits[l.id] ?? ""}
                            onChange={(e) => setEdits((s) => ({ ...s, [l.id]: e.target.value }))}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!edits[l.id]}
                            onClick={() => {
                              updateListingStock(l.id, Number(edits[l.id]));
                              setEdits((s) => ({ ...s, [l.id]: "" }));
                              toast.success("Stock updated");
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
