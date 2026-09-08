"use client";

/**
 * Session-backed identity for client components. Replaces the old mock
 * `auth-provider`. The initial value is fetched server-side in the root layout so
 * there is no logged-out -> logged-in flash.
 *
 * Demo bridge: while the dashboards still read the in-memory mock store, a real
 * session resolves to a fixed mock identity per role so those pages keep working.
 * Each dashboard drops the bridge when its own epic wires it to Frappe.
 */

import * as React from "react";

import { logout as logoutAction } from "@/app/actions/auth";
import { useDB } from "@/hooks/use-db";
import type { CurrentUserInfo } from "@/lib/current-user-info";
import type { BuyerProfile, SellerProfile, User } from "@/lib/types";

interface CurrentUserContextValue {
  user: User | null;
  sellerProfile: SellerProfile | null;
  buyerProfile: BuyerProfile | null;
  /** Real account info straight from the backend (not bridged). */
  account: CurrentUserInfo | null;
  logout: () => void;
}

const CurrentUserContext = React.createContext<CurrentUserContextValue | null>(null);

const MOCK_USER_ID: Record<string, string> = {
  buyer: "u-buyer-1",
  seller: "u-seller-1",
  staff: "u-staff",
  admin: "u-admin",
};

export function CurrentUserProvider({
  initialUser,
  children,
}: {
  initialUser: CurrentUserInfo | null;
  children: React.ReactNode;
}) {
  const db = useDB();

  const value = React.useMemo<CurrentUserContextValue>(() => {
    const logout = () => {
      void logoutAction();
    };

    if (!initialUser) {
      return { user: null, sellerProfile: null, buyerProfile: null, account: null, logout };
    }

    const mockId = initialUser.role ? MOCK_USER_ID[initialUser.role] : undefined;
    const mockUser = mockId ? db.users.find((u) => u.id === mockId) ?? null : null;

    const user: User = mockUser
      ? {
          ...mockUser,
          name: initialUser.fullName || mockUser.name,
          email: initialUser.email || mockUser.email,
          role: initialUser.role ?? mockUser.role,
        }
      : {
          id: initialUser.id,
          name: initialUser.fullName,
          email: initialUser.email,
          phone: initialUser.phone,
          role: initialUser.role ?? "public",
          status: initialUser.status,
          avatarColor: "bg-emerald-600",
          createdAt: new Date().toISOString(),
        };

    return {
      user,
      sellerProfile: mockId ? db.sellerProfiles.find((s) => s.userId === mockId) ?? null : null,
      buyerProfile: mockId ? db.buyerProfiles.find((b) => b.userId === mockId) ?? null : null,
      account: initialUser,
      logout,
    };
  }, [initialUser, db]);

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = React.useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within CurrentUserProvider");
  return ctx;
}
