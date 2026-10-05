import {
  MAX_AUCTION_HOURS,
  MIN_AUCTION_HOURS,
  MIN_START_GAP_HOURS,
  SITE_TIME_ZONE,
} from "@/lib/listing-constants";

/**
 * Auction times are wall-clock times in Sri Lanka ("YYYY-MM-DDTHH:mm", the value of a
 * `datetime-local` input). The browser's own time zone is ignored: sellers and the site both
 * work in Sri Lanka time, and the backend reads the strings in the site's time zone.
 */

/** The current Sri Lanka wall-clock time as "YYYY-MM-DDTHH:mm". */
export function siteNow(now: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone: SITE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return formatted.replace(" ", "T");
}

function wallClockMs(value: string): number {
  // Both sides of every comparison are wall-clock strings, so reading them as UTC is exact.
  return Date.parse(`${value.slice(0, 16)}:00Z`);
}

export function hoursBetween(from: string, to: string): number {
  return (wallClockMs(to) - wallClockMs(from)) / 3_600_000;
}

export interface AuctionTimeErrors {
  start_time?: string;
  end_time?: string;
}

export function validateAuctionTimes(
  start: string,
  end: string,
  now: string = siteNow(),
): AuctionTimeErrors {
  const errors: AuctionTimeErrors = {};
  if (!start) errors.start_time = "Choose a start date and time.";
  if (!end) errors.end_time = "Choose an end date and time.";
  if (!start || !end) return errors;

  if (hoursBetween(now, start) < MIN_START_GAP_HOURS) {
    errors.start_time = `The auction must start at least ${MIN_START_GAP_HOURS} hours from now, so staff can review it.`;
  }
  const duration = hoursBetween(start, end);
  if (duration <= 0) {
    errors.end_time = "The end time must be after the start time.";
  } else if (duration < MIN_AUCTION_HOURS) {
    errors.end_time = `An auction must run for at least ${MIN_AUCTION_HOURS} hours.`;
  } else if (duration > MAX_AUCTION_HOURS) {
    errors.end_time = `An auction can run for at most ${MAX_AUCTION_HOURS} hours (2 days).`;
  }
  return errors;
}

/** "2026-10-07T10:30" -> "2026-10-07 10:30:00" (what the backend expects). */
export function toBackendDateTime(value: string): string {
  return `${value.slice(0, 10)} ${value.slice(11, 16)}:00`;
}

/** "2026-10-07 10:30:00.000000" -> "2026-10-07T10:30" (a datetime-local value). */
export function fromBackendDateTime(value: string | null | undefined): string {
  if (!value) return "";
  return `${value.slice(0, 10)}T${value.slice(11, 16)}`;
}
