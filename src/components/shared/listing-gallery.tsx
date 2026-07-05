"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Listing image gallery (placeholder edition): a large emoji-on-gradient tile
 * with a clickable thumbnail strip. Each gradient stands in for one photo until
 * real seller-uploaded images are wired to the backend.
 */
export function ListingGallery({
  emoji,
  gradients,
}: {
  emoji: string;
  gradients: string[];
}) {
  const list = gradients.length > 0 ? gradients : ["from-secondary to-background"];
  const [active, setActive] = React.useState(0);
  const current = list[Math.min(active, list.length - 1)];

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex h-64 items-center justify-center rounded-xl bg-gradient-to-br text-8xl sm:h-80",
          current
        )}
      >
        {emoji}
      </div>

      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((g, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "flex h-16 w-20 shrink-0 items-center justify-center rounded-lg border-2 bg-gradient-to-br text-2xl transition-colors",
                g,
                active === i ? "border-primary" : "border-transparent hover:border-border"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
