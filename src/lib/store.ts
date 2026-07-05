/**
 * In-memory interactive mock store.
 *
 * Every read in the UI goes through the service layer (src/lib/services/*),
 * which reads from this store today and will call the Frappe REST API later.
 * Mutations here make the prototype feel real: placing an order, bidding,
 * approving a listing etc. all update state that is reflected across pages.
 *
 * State resets on a full page reload (by design — no persistence layer yet).
 */

import {
  seedUsers,
  seedSellerProfiles,
  seedBuyerProfiles,
  seedCategories,
  seedListings,
  seedAuctions,
  seedBids,
  seedOrders,
  seedPaymentProofs,
  seedReviews,
  seedInquiries,
  seedChats,
  seedNotifications,
  seedContentPages,
  seedAnnouncements,
  seedForecasts,
} from "./mock-data";
import type {
  User,
  SellerProfile,
  BuyerProfile,
  Category,
  Listing,
  Auction,
  Bid,
  Order,
  PaymentProof,
  Review,
  Inquiry,
  ChatThread,
  AppNotification,
  ContentPage,
  Announcement,
  CategoryForecast,
} from "./types";

export interface DB {
  users: User[];
  sellerProfiles: SellerProfile[];
  buyerProfiles: BuyerProfile[];
  categories: Category[];
  listings: Listing[];
  auctions: Auction[];
  bids: Bid[];
  orders: Order[];
  paymentProofs: PaymentProof[];
  reviews: Review[];
  inquiries: Inquiry[];
  chats: ChatThread[];
  notifications: AppNotification[];
  contentPages: ContentPage[];
  announcements: Announcement[];
  forecasts: CategoryForecast[];
}

function seed(): DB {
  return {
    users: [...seedUsers],
    sellerProfiles: [...seedSellerProfiles],
    buyerProfiles: [...seedBuyerProfiles],
    categories: [...seedCategories],
    listings: [...seedListings],
    auctions: [...seedAuctions],
    bids: [...seedBids],
    orders: [...seedOrders],
    paymentProofs: [...seedPaymentProofs],
    reviews: [...seedReviews],
    inquiries: [...seedInquiries],
    chats: seedChats.map((c) => ({ ...c, messages: [...c.messages] })),
    notifications: [...seedNotifications],
    contentPages: [...seedContentPages],
    announcements: [...seedAnnouncements],
    forecasts: seedForecasts,
  };
}

let db: DB = seed();
const listeners = new Set<() => void>();

export function getDB(): DB {
  return db;
}

/** Apply a mutation and notify all subscribed components. */
export function mutate(fn: (draft: DB) => void): void {
  fn(db);
  db = { ...db }; // new reference so useSyncExternalStore re-renders
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetStore(): void {
  db = seed();
  listeners.forEach((l) => l());
}

let idCounter = 1000;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
