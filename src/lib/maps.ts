/** Location pin helpers: parse a pasted Google Maps link or coordinates, build map links. */

export interface LatLng {
  lat: number;
  lng: number;
}

const NUM = "(-?\\d{1,3}(?:\\.\\d+)?)";

const PATTERNS: RegExp[] = [
  // The place's own pin in a Google Maps URL (more exact than the map-centre "@lat,lng").
  new RegExp(`!3d${NUM}!4d${NUM}`),
  new RegExp(`[?&](?:q|ll|query|destination)=${NUM}(?:,|%2C)\\s*${NUM}`),
  new RegExp(`@${NUM},${NUM}`),
  // Plain coordinates: "7.2906, 80.6337"
  new RegExp(`^\\s*${NUM}\\s*[,\\s]\\s*${NUM}\\s*$`),
];

export function isValidLatLng({ lat, lng }: LatLng): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

/** Extract coordinates from a full Google Maps link or plain "lat, lng" text. */
export function parseCoordinates(text: string): LatLng | null {
  const input = (text ?? "").trim();
  for (const pattern of PATTERNS) {
    const match = pattern.exec(input);
    if (match) {
      const point = { lat: Number(match[1]), lng: Number(match[2]) };
      if (isValidLatLng(point)) return point;
    }
  }
  return null;
}

/** Roughly Sri Lanka's bounding box — used to warn, never to block. */
export function isInSriLanka({ lat, lng }: LatLng): boolean {
  return lat >= 5.5 && lat <= 10.1 && lng >= 79.4 && lng <= 82.2;
}

export function googleMapsUrl({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/** An OpenStreetMap embed (no API key) centred on the pin, for a live preview. */
export function osmEmbedUrl({ lat, lng }: LatLng): string {
  const pad = 0.01;
  const bbox = [lng - pad, lat - pad, lng + pad, lat + pad].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}
