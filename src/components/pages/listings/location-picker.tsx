"use client";

import * as React from "react";
import { ExternalLink, LocateFixed, MapPin, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { googleMapsUrl, isInSriLanka, isValidLatLng, osmEmbedUrl, parseCoordinates } from "@/lib/maps";

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
  error?: string;
}

const round = (value: number) => String(Math.round(value * 1e6) / 1e6);

/**
 * The optional map pin. The seller pastes a Google Maps link (or "lat, lng"), uses their
 * current location, or types the coordinates; a live OpenStreetMap preview confirms it.
 * Only latitude/longitude are stored, so the picker can be swapped for a click-on-map one
 * (OpenStreetMap or Google) later without touching the data.
 */
export function LocationPicker({ latitude, longitude, onChange, error }: LocationPickerProps) {
  const [paste, setPaste] = React.useState("");
  const [note, setNote] = React.useState<string | null>(null);

  const point = { lat: Number(latitude), lng: Number(longitude) };
  const hasPin = latitude.trim() !== "" && longitude.trim() !== "" && isValidLatLng(point);

  const applyPaste = () => {
    const parsed = parseCoordinates(paste);
    if (!parsed) {
      setNote(
        "Couldn't find a location in that. Paste the full Google Maps link (not a short maps.app.goo.gl one), or type coordinates like 7.2906, 80.6337.",
      );
      return;
    }
    onChange(round(parsed.lat), round(parsed.lng));
    setPaste("");
    setNote(null);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setNote("Your browser can't share its location. Paste a Google Maps link instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange(round(position.coords.latitude), round(position.coords.longitude));
        setNote(null);
      },
      () => setNote("Couldn't get your location. Allow location access, or paste a Google Maps link."),
    );
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-primary" /> Location pin <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        {hasPin && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("", "")}>
            <X className="h-3.5 w-3.5" /> Clear pin
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={paste}
          onChange={(event) => setPaste(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applyPaste();
            }
          }}
          placeholder="Paste a Google Maps link or coordinates"
          aria-label="Google Maps link or coordinates"
        />
        <Button type="button" variant="secondary" onClick={applyPaste} disabled={!paste.trim()}>
          Set pin
        </Button>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
        <LocateFixed className="h-4 w-4" /> Use my current location
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="latitude" className="text-xs">Latitude</Label>
          <Input
            id="latitude"
            name="latitude"
            inputMode="decimal"
            value={latitude}
            onChange={(event) => onChange(event.target.value, longitude)}
            placeholder="7.2906"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="longitude" className="text-xs">Longitude</Label>
          <Input
            id="longitude"
            name="longitude"
            inputMode="decimal"
            value={longitude}
            onChange={(event) => onChange(latitude, event.target.value)}
            placeholder="80.6337"
          />
        </div>
      </div>

      {note && <p className="text-xs text-destructive">{note}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hasPin && !isInSriLanka(point) && (
        <p className="text-xs text-amber-700">This pin is outside Sri Lanka. Double-check it.</p>
      )}

      {hasPin && (
        <div className="space-y-2">
          <iframe
            title="Pin preview"
            src={osmEmbedUrl(point)}
            className="h-44 w-full rounded-md border"
            loading="lazy"
          />
          <a
            href={googleMapsUrl(point)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary underline"
          >
            Open in Google Maps <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
