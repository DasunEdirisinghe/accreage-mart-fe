"use client";

import * as React from "react";
import { BrainCircuit, Info, Loader2 } from "lucide-react";

import { getPriceSuggestion } from "@/app/actions/listings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { unitsMatch } from "@/lib/price-suggestion";
import { formatLKR } from "@/lib/utils";
import type { HorizonSuggestion, PriceHorizon, PriceSuggestionView } from "@/types/listing.type";

interface PriceSuggestionBoxProps {
  category: string;
  unit: string;
  sellingType: "Direct" | "Auction";
  /** Called with the number the seller chose to use (a price, or a minimum bid). */
  onUse: (value: number) => void;
}

const NONE_TEXT = {
  no_commodity:
    "There is no price reference set up for this category yet, so no AI suggestion is available. Set your own price.",
  disabled:
    "Price suggestions have been turned off for this category. Set your own price.",
  unreliable:
    "A price reference exists for this category, but it isn't accurate enough yet to suggest a price. Set your own price.",
  error: "Couldn't load the price suggestion just now. You can still set your own price.",
} as const;

const HORIZON_LABELS: Record<PriceHorizon, string> = {
  near: "1–7 days",
  mid: "8–14 days",
  long: "15–30 days",
};

/** The AI price suggestion: always says clearly when there isn't one, and why. */
export function PriceSuggestionBox({ category, unit, sellingType, onUse }: PriceSuggestionBoxProps) {
  const [view, setView] = React.useState<PriceSuggestionView | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!category) {
      setView(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getPriceSuggestion(category).then((result) => {
      if (!cancelled) {
        setView(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [category]);

  const heading = sellingType === "Direct" ? "AI price suggestion" : "AI reference price";
  const action = sellingType === "Direct" ? "Use this price" : "Use as minimum bid";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-1.5 text-base">
          <BrainCircuit className="h-4 w-4 text-primary" /> {heading}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!category && <p className="text-muted-foreground">Choose a category to see a price reference.</p>}

        {category && loading && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking the price forecast…
          </p>
        )}

        {category && !loading && view?.state === "none" && (
          <p className="flex gap-2 text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" /> {NONE_TEXT[view.reason]}
          </p>
        )}

        {category && !loading && view?.state === "available" && (
          <div className="space-y-2 rounded-md bg-secondary p-3">
            <p className="text-xs font-medium text-secondary-foreground">
              Wholesale reference for {view.commodityName}
            </p>
            <div className="divide-y divide-border">
              {view.horizons.map((horizon) => (
                <HorizonRow
                  key={horizon.horizon}
                  horizon={horizon}
                  priceUnit={view.priceUnit}
                  action={action}
                  onUse={onUse}
                />
              ))}
            </div>
            {!unitsMatch(unit, view.priceUnit) && (
              <p className="text-xs text-amber-700">
                This reference is per {view.priceUnit}, but you're selling per {unit}. Adjust it before you
                use it.
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          A guide only, based on past wholesale prices. You stay in full control of the final price.
        </p>
      </CardContent>
    </Card>
  );
}

/** One horizon's own row — independently shows a price (gated by that horizon's own
 * accuracy tier) or says plainly why nothing is shown for it. */
function HorizonRow({
  horizon,
  priceUnit,
  action,
  onUse,
}: {
  horizon: HorizonSuggestion;
  priceUnit: string;
  action: string;
  onUse: (value: number) => void;
}) {
  const label = `Valid ${HORIZON_LABELS[horizon.horizon]}`;

  if (!horizon.available) {
    return (
      <div className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
        <span className="text-xs font-medium text-secondary-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">Not accurate enough yet</span>
      </div>
    );
  }

  const value =
    horizon.tier === "direct" && horizon.price !== undefined
      ? Math.round(horizon.price)
      : Math.round((horizon.min + horizon.max) / 2);

  return (
    <div className="space-y-1 py-2 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-secondary-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">
          {formatLKR(Math.round(horizon.min))} – {formatLKR(Math.round(horizon.max))}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        {horizon.tier === "direct" && horizon.price !== undefined ? (
          <p className="text-base font-bold text-primary">
            {formatLKR(value)}
            <span className="text-xs font-normal text-muted-foreground"> per {priceUnit}</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Only a range — not accurate enough for one price.</p>
        )}
        <Button type="button" size="sm" variant="outline" onClick={() => onUse(value)}>
          {action} ({formatLKR(value)})
        </Button>
      </div>
    </div>
  );
}
