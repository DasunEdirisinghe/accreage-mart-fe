"use server";

import { revalidatePath } from "next/cache";

import { frappeFetch } from "@/lib/frappe";
import { frappeErrorMessage } from "@/lib/frappe-error";
import { AUCTION_METHODS } from "@/lib/methods";
import type {
  AuctionDetailResponse,
  BuyerBidsResponse,
  SellerAuctionsResponse,
} from "@/types/auctions.type";

/** Null on any failure — the caller renders a "not found" state. */
export async function getAuctionDetail(auction: string): Promise<AuctionDetailResponse | null> {
  try {
    const res = await frappeFetch(AUCTION_METHODS.GET_DETAIL, {
      method: "POST",
      body: { auction },
      cache: "no-store",
    });
    return ((await res.json()) as { message: AuctionDetailResponse }).message ?? null;
  } catch {
    return null;
  }
}

export async function placeBid(
  auction: string,
  amount: number,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await frappeFetch(AUCTION_METHODS.PLACE_BID, {
      method: "POST",
      body: { auction, amount },
    });
    revalidatePath(`/auctions/${auction}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: frappeErrorMessage(error) };
  }
}

export async function reviewAuction(
  auction: string,
  decision: "approve" | "reject",
  reason?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await frappeFetch(AUCTION_METHODS.REVIEW, {
      method: "POST",
      body: { auction, decision, reason: reason || undefined },
    });
    revalidatePath("/admin/auctions");
    revalidatePath(`/auctions/${auction}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: frappeErrorMessage(error) };
  }
}

export async function cancelAuction(
  auction: string,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await frappeFetch(AUCTION_METHODS.CANCEL, {
      method: "POST",
      body: { auction, reason },
    });
    revalidatePath("/admin/auctions");
    revalidatePath(`/auctions/${auction}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: frappeErrorMessage(error) };
  }
}

/** Null on any failure — the caller renders an empty/error state. */
export async function getSellerAuctions(page = 1): Promise<SellerAuctionsResponse | null> {
  try {
    const res = await frappeFetch(AUCTION_METHODS.LIST_MINE, {
      method: "POST",
      body: { page },
      cache: "no-store",
    });
    return ((await res.json()) as { message: SellerAuctionsResponse }).message ?? null;
  } catch {
    return null;
  }
}

/** Null on any failure — the caller renders an empty/error state. */
export async function getBuyerBids(page = 1): Promise<BuyerBidsResponse | null> {
  try {
    const res = await frappeFetch(AUCTION_METHODS.LIST_MY_BIDS, {
      method: "POST",
      body: { page },
      cache: "no-store",
    });
    return ((await res.json()) as { message: BuyerBidsResponse }).message ?? null;
  } catch {
    return null;
  }
}
