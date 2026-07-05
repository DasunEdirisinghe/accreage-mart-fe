"use client";

import Link from "next/link";
import { Plus, Trash2, Tags, Eye } from "lucide-react";
import { toast } from "sonner";

import { useDB } from "@/hooks/use-db";
import { useAuth } from "@/components/providers/auth-provider";
import { deleteListing } from "@/lib/services/listings";
import { formatLKR, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function SellerListingsPage() {
  const db = useDB();
  const { sellerProfile } = useAuth();
  if (!sellerProfile) return null;

  const mine = db.listings.filter((l) => l.sellerId === sellerProfile.id);

  return (
    <>
      <PageHeader
        title="My listings"
        description="New listings are reviewed by platform staff before going live (compliance & quality)."
      >
        <Button asChild>
          <Link href="/seller/listings/new">
            <Plus className="h-4 w-4" /> New listing
          </Link>
        </Button>
      </PageHeader>

      {mine.length === 0 ? (
        <EmptyState icon={Tags} title="No listings yet" description="Create your first product or service listing.">
          <Button asChild>
            <Link href="/seller/listings/new">Create listing</Link>
          </Button>
        </EmptyState>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Listing</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mine.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="max-w-64 pl-4">
                      <span className="block truncate font-medium">
                        {l.image} {l.title}
                      </span>
                      {l.status === "rejected" && l.rejectionReason && (
                        <span className="mt-0.5 block truncate text-xs text-destructive">
                          {l.rejectionReason}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.sellingType === "auction" ? "accent" : "secondary"}>
                        {l.sellingType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {l.sellingType === "direct" ? `${formatLKR(l.pricePerUnit)}/${l.unit}` : "—"}
                    </TableCell>
                    <TableCell>
                      {l.quantityAvailable.toLocaleString()} {l.unit}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          l.status === "approved" ? "success" : l.status === "pending" ? "warning" : "destructive"
                        }
                      >
                        {l.status === "pending" ? "pending approval" : l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(l.createdAt)}</TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild title="View public page">
                          <Link href={`/marketplace/${l.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete listing"
                          onClick={() => {
                            deleteListing(l.id);
                            toast.info("Listing deleted");
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
