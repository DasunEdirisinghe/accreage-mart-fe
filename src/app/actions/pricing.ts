"use server";

import { revalidatePath } from "next/cache";

import { frappeFetch } from "@/lib/frappe";
import { frappeErrorMessage } from "@/lib/frappe-error";
import { PRICING_METHODS } from "@/lib/methods";
import type { PricingCategory } from "@/lib/types";

export interface CommodityOption {
  name: string;
}

export async function getCategories(): Promise<PricingCategory[]> {
  try {
    const res = await frappeFetch(PRICING_METHODS.LIST_CATEGORIES, { cache: "no-store" });
    return ((await res.json()) as { message: PricingCategory[] }).message ?? [];
  } catch {
    return [];
  }
}

export async function getCommodities(search?: string): Promise<CommodityOption[]> {
  try {
    const res = await frappeFetch(PRICING_METHODS.LIST_COMMODITIES, {
      method: "POST",
      body: { search: search || undefined },
      cache: "no-store",
    });
    return ((await res.json()) as { message: CommodityOption[] }).message ?? [];
  } catch {
    return [];
  }
}

export async function upsertCategory(input: {
  name?: string;
  title: string;
  area: PricingCategory["area"];
  commodity: string | null;
}): Promise<{ ok: boolean; error?: string; category?: PricingCategory }> {
  try {
    const res = await frappeFetch(PRICING_METHODS.UPSERT_CATEGORY, {
      method: "POST",
      body: {
        name: input.name || undefined,
        title: input.title,
        area: input.area,
        commodity: input.commodity || undefined,
      },
    });
    const data = ((await res.json()) as { message: PricingCategory }).message;
    revalidatePath("/admin/categories");
    return { ok: true, category: data };
  } catch (error) {
    return { ok: false, error: frappeErrorMessage(error) };
  }
}

export async function deleteCategory(name: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await frappeFetch(PRICING_METHODS.DELETE_CATEGORY, {
      method: "POST",
      body: { name },
    });
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: frappeErrorMessage(error) };
  }
}
