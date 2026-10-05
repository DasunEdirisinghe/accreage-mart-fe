"use client";

import * as React from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";

import { discardListingImage, uploadListingImage } from "@/app/actions/listings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { IMAGE_TYPES, MAX_IMAGES, MAX_IMAGE_BYTES } from "@/lib/listing-constants";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { ListingImageValue } from "@/types/listing.type";

interface ImageUploaderProps {
  images: ListingImageValue[];
  onChange: (images: ListingImageValue[]) => void;
  error?: string;
  disabled?: boolean;
}

/** 1-5 photos. One is the cover: automatically the first, or the seller's choice. */
export function ImageUploader({ images, onChange, error, disabled }: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const uploadedThisSession = React.useRef(new Set<string>());
  const [busy, setBusy] = React.useState(false);
  const [problems, setProblems] = React.useState<string[]>([]);

  const withCover = (list: ListingImageValue[]): ListingImageValue[] =>
    list.length > 0 && !list.some((item) => item.is_cover)
      ? list.map((item, index) => ({ ...item, is_cover: index === 0 }))
      : list;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const messages: string[] = [];
    let next = [...images];

    setBusy(true);
    for (const file of Array.from(files)) {
      if (next.length >= MAX_IMAGES) {
        messages.push(`You can add at most ${MAX_IMAGES} photos.`);
        break;
      }
      if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
        messages.push(`${file.name}: only JPG, PNG and WebP photos are allowed.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        messages.push(`${file.name}: photos can be at most 5 MB.`);
        continue;
      }
      const body = new FormData();
      body.append("file", file);
      const result = await uploadListingImage(body);
      if (!result.ok) {
        messages.push(`${file.name}: ${result.error}`);
        continue;
      }
      uploadedThisSession.current.add(result.url);
      next = withCover([...next, { image: result.url, is_cover: false }]);
      onChange(next);
    }
    setBusy(false);
    setProblems(messages);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (url: string) => {
    onChange(withCover(images.filter((item) => item.image !== url)));
    if (uploadedThisSession.current.delete(url)) void discardListingImage(url);
  };

  const makeCover = (url: string) =>
    onChange(images.map((item) => ({ ...item, is_cover: item.image === url })));

  return (
    <div className="space-y-3">
      <Label>
        Photos * <span className="font-normal text-muted-foreground">(1 to {MAX_IMAGES}, JPG/PNG/WebP, up to 5 MB each)</span>
      </Label>

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((item) => (
            <li
              key={item.image}
              className={cn("overflow-hidden rounded-md border", item.is_cover && "ring-2 ring-primary")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(item.image)} alt="Listing photo" className="h-28 w-full object-cover" />
              <div className="flex items-center justify-between gap-1 p-1.5">
                {item.is_cover ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    <Star className="h-3 w-3 fill-current" /> Cover
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={disabled}
                    onClick={() => makeCover(item.image)}
                  >
                    Make cover
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Remove photo"
                  disabled={disabled}
                  onClick={() => remove(item.image)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        multiple
        className="sr-only"
        aria-label="Add photos"
        onChange={(event) => void handleFiles(event.target.files)}
        disabled={disabled || busy || images.length >= MAX_IMAGES}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled || busy || images.length >= MAX_IMAGES}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {busy ? "Uploading…" : images.length === 0 ? "Add photos" : "Add more photos"}
      </Button>

      {problems.map((message) => (
        <p key={message} className="text-xs text-destructive">{message}</p>
      ))}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
