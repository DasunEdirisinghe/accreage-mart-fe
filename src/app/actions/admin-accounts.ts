"use server";

import { revalidatePath } from "next/cache";

import { frappeFetch } from "@/lib/frappe";
import { frappeErrorMessage } from "@/lib/frappe-error";
import { AUTH_METHODS } from "@/lib/methods";
import type { Role, UserStatus } from "@/lib/types";

export interface ManagedAccount {
  email: string;
  fullName: string;
  role: Exclude<Role, "public"> | null;
  status: UserStatus;
  businessName?: string | null;
  since: string;
}

export type AccountKind = "staff" | "members";

export async function listAccounts(kind: AccountKind): Promise<ManagedAccount[]> {
  try {
    const res = await frappeFetch(`${AUTH_METHODS.LIST_ACCOUNTS}?kind=${kind}`, {
      cache: "no-store",
    });
    return ((await res.json()) as { message: ManagedAccount[] }).message ?? [];
  } catch {
    return [];
  }
}

export async function setAccountStatus(
  email: string,
  status: Extract<UserStatus, "active" | "suspended" | "deactivated">,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await frappeFetch(AUTH_METHODS.SET_ACCOUNT_STATUS, {
      method: "POST",
      body: { email, status },
    });
    revalidatePath("/admin/staff");
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: frappeErrorMessage(error) };
  }
}
