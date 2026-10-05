"use client";

import * as React from "react";
import { ImageOff } from "lucide-react";

import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

/** The listing's real photos: the cover first, with thumbnails to step through the rest. */
export function PublicListingGallery({
  images,
  title,
}: {
  images: { url: string; is_cover: boolean }[];
  title: string;
}) {
  const [selected, setSelected] = React.useState(0);
  const current = images[selected];

  return (
    <div className="space-y-3">
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border bg-muted">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(current.url)} alt={title} className="h-full w-full object-cover" />
        ) : (
          <ImageOff className="h-10 w-10 text-muted-foreground" />
        )}
      </div>

      {images.length > 1 && (
        <ul className="flex flex-wrap gap-2">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                aria-label={`Show photo ${index + 1} of ${images.length}`}
                aria-current={index === selected}
                onClick={() => setSelected(index)}
                className={cn(
                  "h-16 w-16 overflow-hidden rounded-md border transition",
                  index === selected ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(image.url)} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
