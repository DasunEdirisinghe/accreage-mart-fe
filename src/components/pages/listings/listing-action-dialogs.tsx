"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  archiveListing,
  duplicateListing,
  getListingActionInfo,
  getListingHistory,
  hideListing,
  resubmitListing,
  updateStock,
} from "@/app/actions/listings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_AUCTION_HOURS,
  MIN_AUCTION_HOURS,
  MIN_START_GAP_HOURS,
} from "@/lib/listing-constants";
import { validateAuctionTimes } from "@/lib/listing-time";
import { formatDateTime } from "@/lib/utils";
import type {
  ActionResult,
  ListingActionInfo,
  ListingHistoryEntry,
  MyListingCard,
} from "@/types/listing.type";

interface DialogProps {
  listing: MyListingCard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the action succeeded, so the page can refresh. */
  onDone: () => void;
}

function useAction(onDone: () => void, close: () => void, success: string) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = async (action: () => Promise<ActionResult>) => {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (result.ok) {
      toast.success(success);
      close();
      onDone();
    } else {
      setError(result.error);
    }
  };
  return { busy, error, setError, run };
}

// -- hide / archive ---------------------------------------------------------------------------

export function HideArchiveDialog({
  mode,
  ...props
}: DialogProps & { mode: "hide" | "archive" }) {
  const { listing, open, onOpenChange, onDone } = props;
  const [info, setInfo] = React.useState<ListingActionInfo | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [acknowledged, setAcknowledged] = React.useState(false);
  const { busy, error, run } = useAction(
    onDone,
    () => onOpenChange(false),
    mode === "hide" ? "Listing hidden" : "Listing archived",
  );

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setAcknowledged(false);
    setInfo(null);
    setLoading(true);
    getListingActionInfo(listing.name).then((result) => {
      if (!cancelled) {
        setInfo(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, listing.name]);

  const blocked = info?.[mode].blocked_reason ?? null;
  const verb = mode === "hide" ? "Hide" : "Archive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{verb} this listing?</DialogTitle>
          <DialogDescription>{listing.title}</DialogDescription>
        </DialogHeader>

        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking…
          </p>
        )}

        {!loading && !info && (
          <p className="text-sm text-destructive">Couldn't check this listing. Please try again.</p>
        )}

        {info && blocked && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {blocked}
          </p>
        )}

        {info && !blocked && (
          <div className="space-y-3 text-sm">
            <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">{info.warning}</p>
            {info.active_order_count > 0 && (
              <p className="text-muted-foreground">
                {info.active_order_count} order{info.active_order_count === 1 ? "" : "s"} on this listing will carry on as normal.
              </p>
            )}
            {mode === "hide" ? (
              <p className="text-muted-foreground">You can show it again at any time.</p>
            ) : (
              <p className="text-muted-foreground">
                Archiving is how you delete a listing. It stays in your archive for your records and
                can't be restored, but you can duplicate it into a new listing.
              </p>
            )}
            <label className="flex items-start gap-2 font-medium">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />
              <span>I understand</span>
            </label>
          </div>
        )}

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant={mode === "archive" ? "destructive" : "default"}
            disabled={busy || !info || Boolean(blocked) || !acknowledged}
            onClick={() =>
              run(() => (mode === "hide" ? hideListing(listing.name, true) : archiveListing(listing.name, true)))
            }
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {verb}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -- stock ------------------------------------------------------------------------------------

export function StockDialog({ listing, open, onOpenChange, onDone }: DialogProps) {
  const [quantity, setQuantity] = React.useState(String(listing.quantity_available));
  const { busy, error, setError, run } = useAction(onDone, () => onOpenChange(false), "Stock updated");

  React.useEffect(() => {
    if (open) {
      setQuantity(String(listing.quantity_available));
      setError(null);
    }
  }, [open, listing.quantity_available, setError]);

  const valid = quantity.trim() !== "" && Number(quantity) >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update stock</DialogTitle>
          <DialogDescription>{listing.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="stock-quantity">Quantity available ({listing.unit})</Label>
          <Input
            id="stock-quantity"
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Enter 0 when you've sold out.
            {listing.low_stock_level > 0 &&
              ` You'll get an email when stock drops below ${listing.low_stock_level} ${listing.unit}.`}
          </p>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={busy || !valid} onClick={() => run(() => updateStock(listing.name, Number(quantity)))}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -- resubmit ---------------------------------------------------------------------------------

export function ResubmitDialog({ listing, open, onOpenChange, onDone }: DialogProps) {
  const [note, setNote] = React.useState("");
  const { busy, error, setError, run } = useAction(
    onDone,
    () => onOpenChange(false),
    "Sent back for approval",
  );

  React.useEffect(() => {
    if (open) {
      setNote("");
      setError(null);
    }
  }, [open, setError]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resubmit for approval</DialogTitle>
          <DialogDescription>{listing.title}</DialogDescription>
        </DialogHeader>
        {listing.status_reason && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <span className="font-semibold">Staff said:</span> {listing.status_reason}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="resubmit-note">
            What did you change? <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="resubmit-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Replaced the photos and added the harvest date."
          />
          <p className="text-xs text-muted-foreground">Staff will see this note when they review the listing again.</p>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={busy} onClick={() => run(() => resubmitListing(listing.name, note))}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Resubmit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -- duplicate --------------------------------------------------------------------------------

export function DuplicateDialog({ listing, open, onOpenChange, onDone }: DialogProps) {
  const isAuction = listing.selling_type === "Auction";
  const [minBid, setMinBid] = React.useState("");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [acknowledged, setAcknowledged] = React.useState(false);
  const { busy, error, setError, run } = useAction(
    onDone,
    () => onOpenChange(false),
    "New listing created and sent for approval",
  );

  React.useEffect(() => {
    if (open) {
      setMinBid(listing.auction ? String(listing.auction.min_bid) : "");
      setStart("");
      setEnd("");
      setAcknowledged(false);
      setError(null);
    }
  }, [open, listing.auction, setError]);

  const issues = isAuction && start && end ? validateAuctionTimes(start, end) : {};
  const ready =
    !isAuction ||
    (Number(minBid) > 0 && start !== "" && end !== "" && Object.keys(issues).length === 0 && acknowledged);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate this listing</DialogTitle>
          <DialogDescription>{listing.title}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          A new listing is created with the same details and photos, and sent to staff for approval.
        </p>

        {isAuction && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="dup-min-bid">Minimum bid (LKR per {listing.unit})</Label>
              <Input id="dup-min-bid" type="number" min={0} step="any" value={minBid} onChange={(e) => setMinBid(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dup-start">Starts</Label>
                <Input id="dup-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
                {issues.start_time && <p className="text-xs text-destructive">{issues.start_time}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="dup-end">Ends</Label>
                <Input id="dup-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
                {issues.end_time && <p className="text-xs text-destructive">{issues.end_time}</p>}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Times are Sri Lanka time. It must start at least {MIN_START_GAP_HOURS} hours from now and run{" "}
              {MIN_AUCTION_HOURS} to {MAX_AUCTION_HOURS} hours.
            </p>
            <label className="flex items-start gap-2 text-xs font-medium">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />
              <span>
                I understand that once an auction has started it can't be stopped without contacting staff, and
                not at all once it has bids.
              </span>
            </label>
          </div>
        )}

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={busy || !ready}
            onClick={() =>
              run(() =>
                duplicateListing(listing.name, {
                  acknowledged,
                  minBid: isAuction ? Number(minBid) : undefined,
                  startTime: isAuction ? start : undefined,
                  endTime: isAuction ? end : undefined,
                }),
              )
            }
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Duplicate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -- history ----------------------------------------------------------------------------------

const HISTORY_TEXT: Record<ListingHistoryEntry["action"], string> = {
  Approved: "Approved by staff",
  Rejected: "Rejected by staff",
  Suspended: "Suspended by staff",
  Resubmitted: "You resubmitted it",
};

export function HistoryDialog({ listing, open, onOpenChange }: Omit<DialogProps, "onDone">) {
  const [entries, setEntries] = React.useState<ListingHistoryEntry[] | null>(null);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setEntries(null);
    getListingHistory(listing.name).then((result) => {
      if (!cancelled) setEntries(result);
    });
    return () => {
      cancelled = true;
    };
  }, [open, listing.name]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review history</DialogTitle>
          <DialogDescription>{listing.title}</DialogDescription>
        </DialogHeader>

        {entries === null && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        )}
        {entries?.length === 0 && (
          <p className="text-sm text-muted-foreground">No decisions yet. Staff haven't reviewed this listing.</p>
        )}
        {entries && entries.length > 0 && (
          <ol className="max-h-80 space-y-3 overflow-y-auto text-sm">
            {entries.map((entry, index) => (
              <li key={`${entry.reviewed_on}-${index}`} className="rounded-md border p-3">
                <p className="font-medium">{HISTORY_TEXT[entry.action]}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(entry.reviewed_on.replace(" ", "T"))}</p>
                {entry.reason && <p className="mt-1">Reason: {entry.reason}</p>}
                {entry.seller_note && <p className="mt-1">Note: {entry.seller_note}</p>}
              </li>
            ))}
          </ol>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
