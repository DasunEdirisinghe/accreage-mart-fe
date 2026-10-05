"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { unhideListing } from "@/app/actions/listings";
import {
  DuplicateDialog,
  HideArchiveDialog,
  HistoryDialog,
  ResubmitDialog,
  StockDialog,
} from "@/components/pages/listings/listing-action-dialogs";
import type { ListingAction } from "@/lib/listing-status";
import type { MyListingCard } from "@/types/listing.type";

export type DialogAction = Exclude<ListingAction, "edit">;

/**
 * Owns which action dialog is open for which listing. Render `dialogs` once and call
 * `open(action, listing)`; the page refreshes itself after a successful action. "Show again"
 * (unhide) needs no confirmation, so it runs straight away.
 */
export function useListingActions() {
  const router = useRouter();
  const [active, setActive] = React.useState<{ action: DialogAction; listing: MyListingCard } | null>(null);

  const close = () => setActive(null);
  const common = (listing: MyListingCard) => ({
    listing,
    open: true,
    onOpenChange: (open: boolean) => {
      if (!open) close();
    },
    onDone: () => router.refresh(),
  });

  const dialogs = active ? (
    <>
      {(active.action === "hide" || active.action === "archive") && (
        <HideArchiveDialog mode={active.action} {...common(active.listing)} />
      )}
      {active.action === "stock" && <StockDialog {...common(active.listing)} />}
      {active.action === "resubmit" && <ResubmitDialog {...common(active.listing)} />}
      {active.action === "duplicate" && <DuplicateDialog {...common(active.listing)} />}
      {active.action === "history" && (
        <HistoryDialog
          listing={active.listing}
          open
          onOpenChange={(open) => {
            if (!open) close();
          }}
        />
      )}
    </>
  ) : null;

  return {
    dialogs,
    open: async (action: DialogAction, listing: MyListingCard) => {
      if (action !== "unhide") {
        setActive({ action, listing });
        return;
      }
      const result = await unhideListing(listing.name);
      if (result.ok) {
        toast.success("Listing is visible again");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    },
  };
}
