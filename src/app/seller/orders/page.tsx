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
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function SellerOrdersPage() {
  const db = useDB();
  const { sellerProfile } = useAuth();
  if (!sellerProfile) return null;

  const orders = db.orders.filter((o) => o.sellerId === sellerProfile.id);

  return (
    <>
      <PageHeader
        title="Orders"
        description="Confirm incoming orders, review payment proofs and complete fulfilment."
      />
      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" description="Orders from buyers will appear here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Order</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Placed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => {
                  const listing = db.listings.find((l) => l.id === o.listingId);
                  const buyer = db.buyerProfiles.find((b) => b.id === o.buyerId);
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="pl-4">
                        <Link href={`/seller/orders/${o.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
                          {o.id}
                        </Link>
                      </TableCell>
                      <TableCell>{buyer?.businessName}</TableCell>
                      <TableCell className="max-w-48">
                        <span className="block truncate">{listing?.title}</span>
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
