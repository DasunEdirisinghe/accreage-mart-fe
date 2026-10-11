"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setCommodityActive } from "@/app/actions/pricing";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

/** The one write control on the otherwise view-only commodity detail page (Story 5.2) —
 * turns a commodity's price suggestions off for every category linked to it, without
 * touching any of its data. */
export function CommodityActiveToggle({ name, isActive }: { name: string; isActive: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const toggle = async (next: boolean) => {
    setBusy(true);
    const res = await setCommodityActive(name, next);
    setBusy(false);
    if (res.ok) {
      toast.success(next ? "Price suggestions turned on" : "Price suggestions turned off");
      router.refresh();
    } else {
      toast.error(res.error ?? "Could not update the commodity");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isActive ? "secondary" : "outline"}>{isActive ? "Active" : "Inactive"}</Badge>
      <Switch checked={isActive} disabled={busy} onCheckedChange={toggle} aria-label="Toggle price suggestions" />
    </div>
  );
}
