"use client";

import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Star,
  HelpCircle,
  UserRound,
  Gavel,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const NAV = [
  { href: "/buyer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/buyer/orders", label: "My orders", icon: Package },
  { href: "/buyer/bids", label: "My bids", icon: Gavel },
  { href: "/buyer/chat", label: "Chat", icon: MessageSquare },
  { href: "/buyer/reviews", label: "My reviews", icon: Star },
  { href: "/buyer/inquiries", label: "Inquiries", icon: HelpCircle },
  { href: "/buyer/profile", label: "Profile", icon: UserRound },
];

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allowedRoles={["buyer"]} title="Buyer" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
