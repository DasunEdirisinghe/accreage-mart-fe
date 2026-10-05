"use client";

import * as React from "react";
import { BrainCircuit, Info, Loader2 } from "lucide-react";

import { getPriceSuggestion } from "@/app/actions/listings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { unitsMatch } from "@/lib/price-suggestion";
import { formatLKR } from "@/lib/utils";
import type { PriceSuggestionView } from "@/types/listing.type";

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
  unreliable:
    "A price reference exists for this category, but it isn't accurate enough yet to suggest a price. Set your own price.",
  error: "Couldn't load the price suggestion just now. You can still set your own price.",
} as const;

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
            {view.tier === "direct" && view.price !== undefined ? (
              <>
                <p className="text-lg font-bold text-primary">
                  {formatLKR(Math.round(view.price))}
                  <span className="text-xs font-normal text-muted-foreground"> per {view.priceUnit}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Likely range {formatLKR(Math.round(view.min))} – {formatLKR(Math.round(view.max))}
                </p>
                <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => onUse(Math.round(view.price!))}>
                  {action} ({formatLKR(Math.round(view.price))})
                </Button>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-primary">
                  {formatLKR(Math.round(view.min))} – {formatLKR(Math.round(view.max))}
                  <span className="text-xs font-normal text-muted-foreground"> per {view.priceUnit}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Only a range is shown: the forecast isn't accurate enough for a single price.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => onUse(Math.round((view.min + view.max) / 2))}
                >
                  {action} ({formatLKR(Math.round((view.min + view.max) / 2))})
                </Button>
              </>
            )}
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
