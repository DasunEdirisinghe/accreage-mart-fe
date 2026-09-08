"use server";

import { revalidatePath } from "next/cache";

import { frappeFetch } from "@/lib/frappe";
import { frappeErrorMessage } from "@/lib/frappe-error";
import { AUTH_METHODS } from "@/lib/methods";
import type { PrimaryRole } from "@/lib/session";

export interface PendingAccount {
  email: string;
  fullName: string;
  role: Extract<PrimaryRole, "buyer" | "seller">;
  businessName: string;
  district: string;
  status: string;
  since: string;
}

export async function getPendingAccounts(): Promise<PendingAccount[]> {
  try {
    const res = await frappeFetch(AUTH_METHODS.PENDING_ACCOUNTS, { cache: "no-store" });
    return ((await res.json()) as { message: PendingAccount[] }).message ?? [];
  } catch {
    return [];
  }
}

export async function approveAccount(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await frappeFetch(AUTH_METHODS.VERIFY_ACCOUNT, {
      method: "POST",
      body: { email },
    });
    revalidatePath("/admin/accounts");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: frappeErrorMessage(error) };
  }
}
