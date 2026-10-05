"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { approveListing, rejectListing, suspendListing } from "@/app/actions/listing-review";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DecisionKind } from "@/lib/review-tabs";
import type { ListingStatusLabel } from "@/types/listing.type";

interface DecisionDialogProps {
  kind: DecisionKind;
  name: string;
  title: string;
  /** The listing's status when it was opened (a suspended listing is "reinstated", not "approved"). */
  status: ListingStatusLabel;
  expectedModified: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecided: (kind: DecisionKind) => void;
  /** The seller changed the listing after it was opened. */
  onStale: () => void;
}

const COPY = {
  approve: {
    title: "Approve this listing?",
    reinstateTitle: "Reinstate this listing?",
    description: "It goes live on the marketplace and the seller is told.",
    reinstateDescription: "It returns to the marketplace and the seller is told.",
    reasonLabel: "Note to the seller (optional)",
    button: "Approve",
    reinstateButton: "Reinstate",
    required: false,
  },
  reject: {
    title: "Reject this listing?",
    reinstateTitle: "",
    description: "The seller gets your reason by email and can fix the listing and resubmit it.",
    reinstateDescription: "",
    reasonLabel: "Reason for rejection *",
    button: "Reject listing",
    reinstateButton: "",
    required: true,
  },
  suspend: {
    title: "Suspend this listing?",
    reinstateTitle: "",
    description:
      "It leaves the marketplace at once and the seller cannot edit it. Buyers who already ordered it can still see it.",
    reinstateDescription: "",
    reasonLabel: "Reason for suspension *",
    button: "Suspend listing",
    reinstateButton: "",
    required: true,
  },
} as const;

export function ReviewDecisionDialog(props: DecisionDialogProps) {
  const { kind, name, title, status, expectedModified, open, onOpenChange, onDecided, onStale } = props;
  const copy = COPY[kind];
  const reinstating = kind === "approve" && status === "Suspended";

  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
    }
  }, [open]);

  const canSubmit = !busy && (!copy.required || reason.trim() !== "");

  const submit = async () => {
    setBusy(true);
    setError(null);
    const result =
      kind === "approve"
        ? await approveListing(name, expectedModified, reason)
        : kind === "reject"
          ? await rejectListing(name, expectedModified, reason)
          : await suspendListing(name, expectedModified, reason);
    setBusy(false);

    if (result.ok) {
      onOpenChange(false);
      onDecided(kind);
    } else if (result.stale) {
      onOpenChange(false);
      onStale();
    } else {
      setError(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reinstating ? copy.reinstateTitle : copy.title}</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {reinstating ? copy.reinstateDescription : copy.description}
        </p>

        <div className="space-y-2">
          <Label htmlFor="decision-reason">{copy.reasonLabel}</Label>
          <Textarea
            id="decision-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={kind === "approve" ? "Anything the seller should know" : "Explain what needs to change"}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant={kind === "approve" ? "default" : "destructive"}
            disabled={!canSubmit}
            onClick={submit}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {reinstating ? copy.reinstateButton : copy.button}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
