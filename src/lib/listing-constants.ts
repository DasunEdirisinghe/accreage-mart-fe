/**
 * Listing form constants. They mirror the backend (accreage_mart/utils/listing.py) — the
 * backend validates everything again, so a drift shows up as an error message, not bad data.
 */

export const DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara",
  "Hambantota", "Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa",
  "Ampara", "Trincomalee", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle",
] as const;

export const UNITS = ["kg", "nut", "bundle", "piece", "bag", "litre", "dozen"] as const;

export const TITLE_MAX = 140;
export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const MIN_AUCTION_HOURS = 6;
export const MAX_AUCTION_HOURS = 48;
export const MIN_START_GAP_HOURS = 24;

/** Sellers and the site work in Sri Lanka time; form times are wall-clock times in this zone. */
export const SITE_TIME_ZONE = "Asia/Colombo";
