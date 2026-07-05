"use client";

/**
 * Mock authentication.
 * WIRING LATER: replace with Frappe session auth
 * (POST /api/method/login, GET /api/method/frappe.auth.get_logged_user).
 * The role switcher lets you demo every user class without a backend.
 */

import * as React from "react";
import type { Role, User, SellerProfile, BuyerProfile } from "@/lib/types";
import { useDB } from "@/hooks/use-db";

interface AuthContextValue {
  user: User | null;
  sellerProfile: SellerProfile | null;
  buyerProfile: BuyerProfile | null;
  loginAs: (role: Exclude<Role, "public">) => void;
  loginWithEmail: (email: string) => boolean;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const ROLE_TO_USER: Record<Exclude<Role, "public">, string> = {
  buyer: "u-buyer-1",
  seller: "u-seller-1",
  staff: "u-staff",
  admin: "u-admin",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const db = useDB();
  const [userId, setUserId] = React.useState<string | null>(null);

  const user = userId ? db.users.find((u) => u.id === userId) ?? null : null;
  const sellerProfile = user ? db.sellerProfiles.find((s) => s.userId === user.id) ?? null : null;
  const buyerProfile = user ? db.buyerProfiles.find((b) => b.userId === user.id) ?? null : null;

  const loginAs = React.useCallback((role: Exclude<Role, "public">) => {
    setUserId(ROLE_TO_USER[role]);
  }, []);

  const loginWithEmail = React.useCallback(
    (email: string) => {
      const match = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (match) {
        setUserId(match.id);
        return true;
      }
      return false;
    },
    [db.users]
  );

  const logout = React.useCallback(() => setUserId(null), []);

  return (
    <AuthContext.Provider
      value={{ user, sellerProfile, buyerProfile, loginAs, loginWithEmail, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
