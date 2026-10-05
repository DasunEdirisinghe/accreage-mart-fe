/**
 * Every Frappe method path the frontend calls, as enums.
 * No method string is written inline anywhere else — add a constant here first.
 * See docs/frontend-coding-guide.md.
 */

export enum AUTH_METHODS {
  /** Frappe native session login — POST usr/pwd, returns a Set-Cookie: sid=... */
  LOGIN = "login",
  /** Frappe native logout — clears the server session for the current sid. */
  LOGOUT = "logout",
  /** Current user + primary role + profile + status. Authenticated. */
  GET_USER_INFO = "accreage_mart.api.auth.get_user_info",
  /** Self-service buyer sign-up. Guest, rate-limited. */
  REGISTER_BUYER = "accreage_mart.api.auth.register_buyer",
  /** Self-service seller sign-up. Guest, rate-limited. */
  REGISTER_SELLER = "accreage_mart.api.auth.register_seller",
  /** Set the password behind an emailed key and activate the account. Guest. */
  SET_PASSWORD = "accreage_mart.api.auth.set_password",
  /** Whether a set-password link is still usable. Guest. */
  CHECK_RESET_KEY = "accreage_mart.api.auth.check_reset_key",
  /** Whether an email belongs to a pending (invited) account. Guest. */
  ACCOUNT_HINT = "accreage_mart.api.auth.account_hint",
  /** Send a password-reset link. Guest, rate-limited, generic response. */
  REQUEST_PASSWORD_RESET = "accreage_mart.api.auth.request_password_reset",
  /** Re-send the activation link for an account still in "invited". Guest. */
  RESEND_ACTIVATION = "accreage_mart.api.auth.resend_activation",
  /** Admin provisions a Staff/Admin account (emails an invite). Admin only. */
  CREATE_STAFF = "accreage_mart.api.auth.create_staff",
  /** Real staff / member account rows for the admin tables. Admin only. */
  LIST_ACCOUNTS = "accreage_mart.api.auth.list_accounts",
  /** Activate / suspend / deactivate an account. Admin only. */
  SET_ACCOUNT_STATUS = "accreage_mart.api.auth.set_account_status",
  /** Every buyer/seller application (Pending/Approved/Rejected). Staff/Admin only. */
  ACCOUNT_APPLICATIONS = "accreage_mart.api.auth.account_applications",
  /** Approves an application, mints a set-password link, emails the applicant. Staff/Admin only. */
  VERIFY_ACCOUNT = "accreage_mart.api.auth.verify_account",
  /** Rejects an application with a reason, emails the applicant. Staff/Admin only. */
  REJECT_ACCOUNT = "accreage_mart.api.auth.reject_account",
}

export enum PRICING_METHODS {
  /** All Category rows, for /admin/categories. Staff/Admin only. */
  LIST_CATEGORIES = "accreage_mart.api.pricing.list_categories",
  /** Create (no name) or update (name given) a Category. Staff/Admin only. */
  UPSERT_CATEGORY = "accreage_mart.api.pricing.upsert_category",
  /** Removes a Category — allowed even when linked to a commodity. Staff/Admin only. */
  DELETE_CATEGORY = "accreage_mart.api.pricing.delete_category",
  /** Read-only commodity list for the Category form's picker. Staff/Admin only. */
  LIST_COMMODITIES = "accreage_mart.api.pricing.list_commodities",
  /** Richer commodity list for /admin/commodities (view-only). Staff/Admin only. */
  LIST_COMMODITIES_OVERVIEW = "accreage_mart.api.pricing.list_commodities_overview",
  /** One commodity's full fields + its forecast days, for /admin/commodities/[id]. Staff/Admin only. */
  GET_COMMODITY = "accreage_mart.api.pricing.get_commodity",
}

export enum LISTING_METHODS {
  /** Categories for the listing form dropdown and the marketplace filter. Guest. */
  LIST_CATEGORIES = "accreage_mart.api.marketplace.list_listing_categories",
  /** One listing as the caller may see it (owner / staff / public). Guest. */
  GET = "accreage_mart.api.marketplace.get_listing",
  /** Create a Direct or Auction listing (listing, then auction, then link). Verified seller. */
  CREATE = "accreage_mart.api.listings.create_listing",
  /** Edit a listing; auction-term changes on a published listing send it back to review. Owner. */
  UPDATE = "accreage_mart.api.listings.update_listing",
  /** Multipart image upload (JPG/PNG/WebP, 5 MB). Verified seller. */
  UPLOAD_IMAGE = "accreage_mart.api.listing_images.upload_listing_image",
  /** Delete an upload that is not on any listing. Owner of the upload. */
  DISCARD_IMAGE = "accreage_mart.api.listing_images.discard_listing_image",
  /** The caller's own listings with per-tab counts. Verified seller. */
  LIST_MINE = "accreage_mart.api.marketplace.list_my_listings",
  /** Staff decisions and own resubmissions on one of the caller's listings. Owner. */
  GET_HISTORY = "accreage_mart.api.marketplace.get_listing_history",
  /** Whether hide / archive / unhide are possible now, plus the warning text. Owner. */
  GET_ACTION_INFO = "accreage_mart.api.listings.get_listing_action_info",
  /** Published -> Hidden (needs acknowledgement). Owner. */
  HIDE = "accreage_mart.api.listings.hide_listing",
  /** Hidden -> Published. Owner. */
  UNHIDE = "accreage_mart.api.listings.unhide_listing",
  /** The seller's "delete": archives the listing (needs acknowledgement). Owner. */
  ARCHIVE = "accreage_mart.api.listings.archive_listing",
  /** Rejected -> Pending Approval, with a note for staff. Owner. */
  RESUBMIT = "accreage_mart.api.listings.resubmit_listing",
  /** A new Pending listing copied from an archived one. Owner. */
  DUPLICATE = "accreage_mart.api.listings.duplicate_listing",
  /** Change a Direct listing's stock (low-stock email when it first drops below the level). Owner. */
  UPDATE_STOCK = "accreage_mart.api.listings.update_stock",
  /** Resolve a Category to its price suggestion (tiers + forecast days). Authenticated. */
  GET_PRICE_SUGGESTION = "accreage_mart.api.pricing.get_price_suggestion",
}

export enum REVIEW_METHODS {
  /** The staff queue: listings of one status, both types together. Staff/Admin. */
  LIST = "accreage_mart.api.listing_review.list_listings_for_review",
  /** One listing as buyers see it plus review context and which actions are possible. Staff/Admin. */
  GET = "accreage_mart.api.listing_review.get_listing_for_review",
  /** Publish a pending listing, or reinstate a suspended one. Staff/Admin. */
  APPROVE = "accreage_mart.api.listing_review.approve_listing",
  /** Reject a pending listing (reason required). Staff/Admin. */
  REJECT = "accreage_mart.api.listing_review.reject_listing",
  /** Suspend a published or hidden listing (reason required). Staff/Admin. */
  SUSPEND = "accreage_mart.api.listing_review.suspend_listing",
}
