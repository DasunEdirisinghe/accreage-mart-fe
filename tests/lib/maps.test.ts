import { describe, expect, it } from "vitest";

import { googleMapsUrl, isInSriLanka, osmEmbedUrl, parseCoordinates } from "@/lib/maps";

describe("parseCoordinates", () => {
  it("reads plain coordinates", () => {
    expect(parseCoordinates("7.2906, 80.6337")).toEqual({ lat: 7.2906, lng: 80.6337 });
    expect(parseCoordinates("  7.2906 80.6337 ")).toEqual({ lat: 7.2906, lng: 80.6337 });
  });

  it("reads the map centre from an @lat,lng Google Maps link", () => {
    const link = "https://www.google.com/maps/@7.2906,80.6337,15z";
    expect(parseCoordinates(link)).toEqual({ lat: 7.2906, lng: 80.6337 });
  });

  it("prefers the place's own pin (!3d!4d) over the map centre", () => {
    const link =
      "https://www.google.com/maps/place/Kandy/@7.3,80.6,12z/data=!3m1!4b1!4m6!3m5!1s0x0!8m2!3d7.2906!4d80.6337";
    expect(parseCoordinates(link)).toEqual({ lat: 7.2906, lng: 80.6337 });
  });

  it("reads ?q=lat,lng links", () => {
    expect(parseCoordinates("https://www.google.com/maps?q=6.9271,79.8612")).toEqual({
      lat: 6.9271,
      lng: 79.8612,
    });
  });

  it("returns null for anything else, including out-of-range values and short links", () => {
    expect(parseCoordinates("")).toBeNull();
    expect(parseCoordinates("Kandy market")).toBeNull();
    expect(parseCoordinates("https://maps.app.goo.gl/abc123")).toBeNull();
    expect(parseCoordinates("95, 80")).toBeNull();
    expect(parseCoordinates("7, 200")).toBeNull();
  });
});

describe("map links", () => {
  it("flags pins outside Sri Lanka", () => {
    expect(isInSriLanka({ lat: 7.29, lng: 80.63 })).toBe(true);
    expect(isInSriLanka({ lat: 51.5, lng: -0.12 })).toBe(false);
  });

  it("builds a Google Maps link and an OpenStreetMap embed from the pin", () => {
    expect(googleMapsUrl({ lat: 7.29, lng: 80.63 })).toBe("https://www.google.com/maps?q=7.29,80.63");
    expect(osmEmbedUrl({ lat: 7.29, lng: 80.63 })).toContain("marker=7.29%2C80.63");
  });
});
