"use server";

import { revalidatePath } from "next/cache";

import { frappeFetch } from "@/lib/frappe";
import { frappeErrorMessage } from "@/lib/frappe-error";
import { AUTH_METHODS } from "@/lib/methods";
import type { PrimaryRole } from "@/lib/session";

export type VerificationStatus = "pending" | "approved" | "rejected";

export interface AccountApplication {
  email: string;
  fullName: string;
  role: Extract<PrimaryRole, "buyer" | "seller">;
  businessName: string;
  district: string;
  mobile: string;
  description: string;
  verificationStatus: VerificationStatus;
  rejectionReason: string;
  since: string;
  reviewedOn: string | null;
}

export async function getAccountApplications(): Promise<AccountApplication[]> {
  try {
    const res = await frappeFetch(AUTH_METHODS.ACCOUNT_APPLICATIONS, { cache: "no-store" });
    return ((await res.json()) as { message: AccountApplication[] }).message ?? [];
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

export async function rejectAccount(
  email: string,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await frappeFetch(AUTH_METHODS.REJECT_ACCOUNT, {
      method: "POST",
      body: { email, reason },
    });
    revalidatePath("/admin/accounts");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: frappeErrorMessage(error) };
  }
}
