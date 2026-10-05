import { fromBackendDateTime, siteNow } from "@/lib/listing-time";
import type { ListingFormValues, OwnListingDetail } from "@/types/listing.type";

export interface EditRestriction {
  canEdit: boolean;
  /** Why the form is not offered (when canEdit is false). */
  blockedReason?: string;
  /** A started, published auction: min bid / start / end are frozen. */
  termsLocked: boolean;
  /** A started, published auction: quantity and unit are frozen too. */
  lotLocked: boolean;
  /** Changing the auction terms of a published listing sends it back to review. */
  termsChangeSendsToReview: boolean;
  banner?: { tone: "info" | "warning"; text: string };
}

/** What the seller may do on the edit page, mirroring the backend's rules. */
export function editRestriction(
  listing: Pick<OwnListingDetail, "status" | "selling_type" | "auction" | "status_reason">,
  now: string = siteNow(),
): EditRestriction {
  const open: EditRestriction = {
    canEdit: true,
    termsLocked: false,
    lotLocked: false,
    termsChangeSendsToReview: false,
  };

  switch (listing.status) {
    case "Archived":
      return {
        ...open,
        canEdit: false,
        blockedReason: "Archived listings can't be edited. Duplicate it from My listings instead.",
      };
    case "Suspended":
      return {
        ...open,
        canEdit: false,
        blockedReason: "This listing was suspended by staff. Please contact staff.",
      };
    case "Pending Approval":
      return {
        ...open,
        banner: {
          tone: "info",
          text: "Waiting for staff approval. Buyers can't see this listing yet. Your changes are saved to the pending version.",
        },
      };
    case "Rejected":
      return {
        ...open,
        banner: {
          tone: "warning",
          text: `Rejected${listing.status_reason ? `: ${listing.status_reason}` : "."} Update the listing, then resubmit it from My listings.`,
        },
      };
    default:
      break;
  }

  if (listing.selling_type === "Auction" && listing.auction) {
    const started = listing.auction.start_time.slice(0, 16).replace(" ", "T") <= now;
    if (started) {
      return {
        ...open,
        termsLocked: true,
        lotLocked: true,
        banner: {
          tone: "warning",
          text: "This auction has started. Its terms and lot can't be changed, and it can't be stopped without contacting staff.",
        },
      };
    }
    return {
      ...open,
      termsChangeSendsToReview: true,
      banner: {
        tone: "warning",
        text: "Changing the minimum bid, start or end time sends this listing back to staff for review, and it leaves the marketplace until it is approved again.",
      },
    };
  }
  return open;
}

/** Initial form values for the edit page, from the owner's view of a listing. */
export function detailToFormValues(listing: OwnListingDetail): ListingFormValues {
  const text = (value: number | null | undefined) =>
    value === null || value === undefined || value === 0 ? "" : String(value);

  return {
    selling_type: listing.selling_type,
    category: listing.category.name,
    title: listing.title,
    description: listing.description,
    unit: listing.unit,
    quantity_available: String(listing.quantity_available),
    price_per_unit: text(listing.price_per_unit),
    min_order_qty: text(listing.min_order_qty),
    low_stock_level: text(listing.low_stock_level),
    district: listing.district,
    location: listing.location,
    latitude: text(listing.latitude),
    longitude: text(listing.longitude),
    organic: listing.organic,
    certification: listing.certification ?? "",
    images: listing.images.map((image) => ({ image: image.url, is_cover: image.is_cover })),
    min_bid: listing.auction ? String(listing.auction.min_bid) : "",
    start_time: fromBackendDateTime(listing.auction?.start_time),
    end_time: fromBackendDateTime(listing.auction?.end_time),
    auction_terms_acknowledged: false,
  };
}
