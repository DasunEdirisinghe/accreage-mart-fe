import { z } from "zod";

import {
  DISTRICTS,
  MAX_IMAGES,
  TITLE_MAX,
  UNITS,
} from "@/lib/listing-constants";
import { toBackendDateTime, validateAuctionTimes } from "@/lib/listing-time";
import type { ListingFormValues } from "@/types/listing.type";

/**
 * The listing form's rules, shared by the server actions and the client form. The backend
 * (accreage_mart) enforces the same rules again; these exist for fast, friendly errors.
 */

export interface SchemaOptions {
  /** Create / duplicate need the "an auction cannot be stopped once started" tick. */
  requireAcknowledgement: boolean;
  /** Edit of a started auction: its terms are locked, so they are not re-validated. */
  skipAuctionTerms?: boolean;
}

const num = (value: string): number => (value.trim() === "" ? Number.NaN : Number(value));

export function formDataToValues(formData: FormData): ListingFormValues {
  const text = (key: string) => String(formData.get(key) ?? "");
  const flag = (key: string) => formData.get(key) === "on" || formData.get(key) === "true";

  let images: ListingFormValues["images"] = [];
  try {
    const parsed = JSON.parse(text("images") || "[]");
    if (Array.isArray(parsed)) images = parsed;
  } catch {
    images = [];
  }

  return {
    selling_type: text("selling_type") as ListingFormValues["selling_type"],
    category: text("category"),
    title: text("title"),
    description: text("description"),
    unit: text("unit"),
    quantity_available: text("quantity_available"),
    price_per_unit: text("price_per_unit"),
    min_order_qty: text("min_order_qty"),
    low_stock_level: text("low_stock_level"),
    district: text("district"),
    location: text("location"),
    latitude: text("latitude"),
    longitude: text("longitude"),
    organic: flag("organic"),
    certification: text("certification"),
    images,
    min_bid: text("min_bid"),
    start_time: text("start_time"),
    end_time: text("end_time"),
    auction_terms_acknowledged: flag("auction_terms_acknowledged"),
  };
}

export function makeListingSchema(options: SchemaOptions) {
  return z
    .object({
      selling_type: z.enum(["Direct", "Auction"], { message: "Choose how you want to sell." }),
      category: z.string().min(1, "Choose a category."),
      title: z
        .string()
        .trim()
        .min(1, "Title is required.")
        .max(TITLE_MAX, `Title can be at most ${TITLE_MAX} characters.`),
      description: z.string().trim().min(1, "Description is required."),
      unit: z.enum(UNITS, { message: "Choose a unit." }),
      quantity_available: z.string(),
      price_per_unit: z.string(),
      min_order_qty: z.string(),
      low_stock_level: z.string(),
      district: z.enum(DISTRICTS, { message: "Choose a district." }),
      location: z.string().trim().min(1, "Location is required."),
      latitude: z.string(),
      longitude: z.string(),
      organic: z.boolean(),
      certification: z.string().trim(),
      images: z
        .array(
          z.object({
            image: z.string().startsWith("/files/", "Images must be uploaded through the form."),
            is_cover: z.boolean(),
          }),
        )
        .min(1, "Add at least one image.")
        .max(MAX_IMAGES, `A listing can have at most ${MAX_IMAGES} images.`),
      min_bid: z.string(),
      start_time: z.string(),
      end_time: z.string(),
      auction_terms_acknowledged: z.boolean(),
    })
    .superRefine((v, ctx) => {
      const issue = (path: keyof ListingFormValues, message: string) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

      const quantity = num(v.quantity_available);
      if (!(quantity > 0)) issue("quantity_available", "Quantity must be greater than zero.");

      if (v.selling_type === "Direct") {
        if (!(num(v.price_per_unit) > 0)) issue("price_per_unit", "Price must be greater than zero.");
        if (v.min_order_qty.trim() !== "") {
          const min = num(v.min_order_qty);
          if (!(min > 0)) issue("min_order_qty", "Minimum order must be greater than zero.");
          else if (quantity > 0 && min > quantity)
            issue("min_order_qty", "Minimum order cannot be more than the available quantity.");
        }
        if (v.low_stock_level.trim() !== "" && !(num(v.low_stock_level) >= 0))
          issue("low_stock_level", "Low stock level cannot be negative.");
      }

      if (v.selling_type === "Auction") {
        if (options.requireAcknowledgement && !v.auction_terms_acknowledged)
          issue("auction_terms_acknowledged", "Please confirm that you have read the auction rules.");
        if (!options.skipAuctionTerms) {
          if (!(num(v.min_bid) > 0)) issue("min_bid", "Minimum bid must be greater than zero.");
          const timeErrors = validateAuctionTimes(v.start_time, v.end_time);
          if (timeErrors.start_time) issue("start_time", timeErrors.start_time);
          if (timeErrors.end_time) issue("end_time", timeErrors.end_time);
        }
      }

      if (v.organic && v.certification === "")
        issue("certification", "Certification details are required for organic produce.");

      const hasLat = v.latitude.trim() !== "";
      const hasLng = v.longitude.trim() !== "";
      if (hasLat !== hasLng) issue("latitude", "The location pin needs both latitude and longitude.");
      if (hasLat && hasLng) {
        const lat = num(v.latitude);
        const lng = num(v.longitude);
        if (!(Math.abs(lat) <= 90) || !(Math.abs(lng) <= 180))
          issue("latitude", "The location pin is outside the valid range.");
      }
    });
}

export type ParsedListing = z.infer<ReturnType<typeof makeListingSchema>>;

function optionalNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

/** The body for api.listings.create_listing. */
export function toCreateBody(v: ParsedListing): Record<string, unknown> {
  const isAuction = v.selling_type === "Auction";
  return {
    category: v.category,
    title: v.title,
    description: v.description,
    selling_type: v.selling_type,
    unit: v.unit,
    quantity_available: Number(v.quantity_available),
    district: v.district,
    location: v.location,
    images: v.images,
    price_per_unit: isAuction ? null : Number(v.price_per_unit),
    min_order_qty: isAuction ? null : optionalNumber(v.min_order_qty),
    low_stock_level: isAuction ? null : optionalNumber(v.low_stock_level),
    latitude: optionalNumber(v.latitude),
    longitude: optionalNumber(v.longitude),
    organic: v.organic ? 1 : 0,
    certification: v.organic ? v.certification : null,
    min_bid: isAuction ? Number(v.min_bid) : null,
    start_time: isAuction ? toBackendDateTime(v.start_time) : null,
    end_time: isAuction ? toBackendDateTime(v.end_time) : null,
    auction_terms_acknowledged: v.auction_terms_acknowledged ? 1 : 0,
  };
}

/** The `values` for api.listings.update_listing (only fields that apply to the listing's type). */
export function toUpdateValues(
  v: ParsedListing,
  options: { termsLocked: boolean; lotLocked: boolean },
): Record<string, unknown> {
  const isAuction = v.selling_type === "Auction";
  const values: Record<string, unknown> = {
    category: v.category,
    title: v.title,
    description: v.description,
    district: v.district,
    location: v.location,
    images: v.images,
    latitude: optionalNumber(v.latitude) ?? 0,
    longitude: optionalNumber(v.longitude) ?? 0,
    organic: v.organic ? 1 : 0,
    certification: v.organic ? v.certification : null,
  };
  if (!options.lotLocked) {
    values.unit = v.unit;
    values.quantity_available = Number(v.quantity_available);
  }
  if (isAuction) {
    if (!options.termsLocked) {
      values.min_bid = Number(v.min_bid);
      values.start_time = toBackendDateTime(v.start_time);
      values.end_time = toBackendDateTime(v.end_time);
    }
  } else {
    values.price_per_unit = Number(v.price_per_unit);
    values.min_order_qty = optionalNumber(v.min_order_qty) ?? 0;
    values.low_stock_level = optionalNumber(v.low_stock_level) ?? 0;
  }
  return values;
}
