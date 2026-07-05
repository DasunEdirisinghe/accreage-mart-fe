"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

import { useDB } from "@/hooks/use-db";
import { reviewListing } from "@/lib/services/listings";
import { formatLKR, formatDate, cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ListingApprovalsPage() {
  const db = useDB();
  const [rejectId, setRejectId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState("");

  const pending = db.listings.filter((l) => l.status === "pending");
  const reviewed = db.listings.filter((l) => l.status !== "pending");

  const approve = (id: string) => {
    reviewListing(id, "approved");
    toast.success("Listing approved and published");
  };

  const reject = () => {
    if (!rejectId) return;
    reviewListing(rejectId, "rejected", feedback || "Does not meet marketplace guidelines.");
    toast.info("Listing rejected, seller notified with feedback");
    setRejectId(null);
    setFeedback("");
  };

  const renderCard = (id: string) => {
    const l = db.listings.find((x) => x.id === id)!;
    const seller = db.sellerProfiles.find((s) => s.id === l.sellerId);
    return (
      <Card key={l.id}>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <span
            className={cn(
              "flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-3xl",
              l.imageGradient
            )}
          >
            {l.image}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/marketplace/${l.id}`} className="font-semibold hover:text-primary hover:underline">
                {l.title}
              </Link>
              <Badge variant={l.sellingType === "auction" ? "accent" : "secondary"}>{l.sellingType}</Badge>
              {l.organic && <Badge variant="success">organic</Badge>}
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{l.description}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {seller?.businessName} · {l.location} · submitted {formatDate(l.createdAt)}
              {l.sellingType === "direct" && ` · ${formatLKR(l.pricePerUnit)}/${l.unit}`}
            </p>
          </div>
          {l.status === "pending" ? (
            <div className="flex shrink-0 gap-2">
              <Button size="sm" onClick={() => approve(l.id)}>
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setRejectId(l.id)}>
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </div>
          ) : (
            <Badge variant={l.status === "approved" ? "success" : "destructive"} className="shrink-0">
              {l.status}
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <PageHeader
        title="Listing approvals"
        description="Review listings for quality and compliance before they go live (SRS 2.1 REQ-4/5)."
      />
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4 space-y-3">
          {pending.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="Queue is clear" description="No listings waiting for review." />
          ) : (
            pending.map((l) => renderCard(l.id))
          )}
        </TabsContent>
        <TabsContent value="reviewed" className="mt-4 space-y-3">
          {reviewed.map((l) => renderCard(l.id))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject listing</DialogTitle>
            <DialogDescription>
              Feedback is sent to the seller so they can fix and resubmit.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            placeholder="Reason for rejection…"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={reject}>Reject listing</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
