"use client";

import Link from "next/link";
import { Package } from "lucide-react";

import { useDB } from "@/hooks/use-db";
import { useAuth } from "@/components/providers/auth-provider";
import { ORDER_STATUS_LABEL, ORDER_STATUS_VARIANT } from "@/lib/services/orders";
import { formatLKR, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function BuyerOrdersPage() {
  const db = useDB();
  const { buyerProfile } = useAuth();
  if (!buyerProfile) return null;

  const orders = db.orders.filter((o) => o.buyerId === buyerProfile.id);

  return (
    <>
      <PageHeader
        title="My orders"
        description="Track order status, upload payment proofs and download invoices."
      />
      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" description="Browse the marketplace to place your first wholesale order.">
          <Button asChild>
            <Link href="/marketplace">Browse marketplace</Link>
          </Button>
        </EmptyState>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Order</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Placed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => {
                  const listing = db.listings.find((l) => l.id === o.listingId);
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="pl-4 font-mono text-xs">
                        <Link href={`/buyer/orders/${o.id}`} className="font-medium text-primary hover:underline">
                          {o.id}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-52">
                        <span className="block truncate">{listing?.title}</span>
                      </TableCell>
                      <TableCell>
                        {o.quantity.toLocaleString()} {listing?.unit}
                      </TableCell>
                      <TableCell className="font-medium">{formatLKR(o.totalPrice)}</TableCell>
                      <TableCell>
                        <Badge variant={ORDER_STATUS_VARIANT[o.status]}>
                          {ORDER_STATUS_LABEL[o.status].split(" — ")[0]}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4 text-right text-muted-foreground">
                        {formatDate(o.createdAt)}
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
