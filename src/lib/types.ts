/**
 * Domain types mirroring the Accreage Mart ERD (SRS v1.0, Appendix B).
 * These shapes are what the Frappe backend will eventually return -
 * keep them stable so wiring the API later is a drop-in change.
 */

export type Role = "public" | "buyer" | "seller" | "staff" | "admin";

// "invited": account created (self-registered or staff-provisioned) but the person
// has not yet set a password via the emailed link, so they cannot sign in.
export type UserStatus = "invited" | "active" | "suspended" | "deactivated";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  avatarColor: string; // UI helper for mock avatars
  createdAt: string;
}

export interface SellerProfile {
  id: string;
  userId: string;
  businessName: string;
  location: string;
  district: string;
  description: string;
  trustScore: number; // 0..5
  verified: boolean;
  totalSales: number;
}

export type BuyerType = "Hotel" | "Supermarket" | "Exporter" | "Processor" | "Other";

export interface BuyerProfile {
  id: string;
  userId: string;
  businessName: string;
  buyerType: BuyerType;
  location: string;
  verified: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // emoji for mock UI
}

export type SellingType = "direct" | "auction";
export type ListingStatus = "pending" | "approved" | "rejected";

export interface Listing {
  id: string;
  sellerId: string;
  categoryId: string;
  title: string;
  description: string;
  sellingType: SellingType;
  unit: string; // kg, nut, bundle...
  pricePerUnit: number; // LKR (direct listings)
  aiSuggestedPrice?: { min: number; max: number };
  quantityAvailable: number;
  minOrderQty: number;
  location: string;
  district: string;
  organic: boolean;
  certification?: string;
  status: ListingStatus;
  rejectionReason?: string;
  image: string; // emoji for mock UI
  imageGradient: string; // tailwind gradient classes (primary placeholder)
  gallery?: string[]; // extra gradient placeholders → multi-image carousel
  createdAt: string;
}

export type AuctionStatus = "pending" | "scheduled" | "live" | "ended" | "rejected";

export interface Auction {
  id: string;
  listingId: string;
  minBid: number; // LKR per unit
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  aiFairValue?: number;
  winnerBidId?: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  buyerId: string;
  amount: number;
  bidTime: string;
}

export type OrderStatus =
  | "pending_confirmation"
  | "confirmed"
  | "payment_review"
  | "paid"
  | "completed"
  | "cancelled";

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  invoiceNo?: string;
}

export type PaymentProofStatus = "submitted" | "approved" | "rejected";

export interface PaymentProof {
  id: string;
  orderId: string;
  fileName: string;
  note?: string;
  status: PaymentProofStatus;
  submittedAt: string;
  reviewedAt?: string;
}

export type Sentiment = "positive" | "neutral" | "negative";

export interface Review {
  id: string;
  orderId: string;
  sellerId: string;
  buyerId: string;
  rating: number; // 1..5
  comment: string;
  sentiment: Sentiment;
  flagged: boolean;
  createdAt: string;
}

export interface ForecastPoint {
  ds: string; // date
  yhat: number;
  yhatLower: number;
  yhatUpper: number;
  actual?: number; // present for history
}

export interface CategoryForecast {
  categoryId: string;
  commodity: string;
  unit: string;
  modelVersion: string;
  mape: number;
  points: ForecastPoint[];
}

export type InquiryStatus = "open" | "in_progress" | "resolved";

export interface Inquiry {
  id: string;
  userId: string;
  subject: string;
  category: "Product" | "Order" | "Payment" | "Platform" | "Other";
  message: string;
  status: InquiryStatus;
  response?: string;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId?: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  sentAt: string;
}

export type NotificationChannel = "email" | "sms" | "in_app";

export interface AppNotification {
  id: string;
  userId: string;
  type: "auction" | "order" | "payment" | "listing" | "system";
  message: string;
  channel: NotificationChannel;
  read: boolean;
  sentAt: string;
}

export interface ContentPage {
  id: string;
  title: string;
  slug: string;
  body: string;
  published: boolean;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

/** Marketplace-facing pricing taxonomy (Epic 03). Decouples the listing category a seller
 * picks from the raw priced-commodity list — many categories can share one commodity's
 * forecast, and a category can have none (Tools/Fertilizer/Other). Mirrors the backend
 * Category DocType 1:1; `name` is the Frappe docname (a random hash, not the title). */
export type CategoryArea = "Fruits" | "Vegetables" | "Fertilizer" | "Tools" | "Rice" | "Other";

export interface PricingCategory {
  name: string;
  title: string;
  area: CategoryArea;
  /** The linked Commodity's name (itself the display value — Commodity autonames on this
   * field), or null when this category has no priced commodity behind it. */
  commodity: string | null;
}

/** Row shape for /admin/commodities (Story 3.16, view-only). */
export interface CommodityOverview {
  name: string;
  harti_category: string;
  market: string;
  is_active: boolean;
  last_evaluated_on: string | null;
  mape_1_7d: number | null;
}

/** One row of a Commodity's Price Forecast Day child table. */
export interface ForecastDay {
  forecast_date: string;
  horizon_days_ahead: number;
  predicted_price: number;
  lower_bound: number;
  upper_bound: number;
}

/** Full Commodity fields + its current forecast, for /admin/commodities/[id] (Story 3.16,
 * view-only — no create/edit/delete anywhere on either route). */
export interface Commodity {
  name: string;
  harti_category: string;
  market: string;
  unit: string;
  is_active: boolean;
  mape_1_7d: number | null;
  mape_8_14d: number | null;
  mape_15_30d: number | null;
  sample_size_1_7d: number;
  sample_size_8_14d: number;
  sample_size_15_30d: number;
  last_evaluated_on: string | null;
  forecast_days: ForecastDay[];
}
