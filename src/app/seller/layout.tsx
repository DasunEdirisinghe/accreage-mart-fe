"use client";

import {
  LayoutDashboard,
  Package,
  Tags,
  Gavel,
  Boxes,
  LineChart,
  MessageSquare,
  UserRound,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const NAV = [
  { href: "/seller", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/listings", label: "My listings", icon: Tags },
  { href: "/seller/orders", label: "Orders", icon: Package },
  { href: "/seller/auctions", label: "Auctions", icon: Gavel },
  { href: "/seller/inventory", label: "Inventory", icon: Boxes },
  { href: "/seller/reports", label: "Reports & AI", icon: LineChart },
  { href: "/seller/chat", label: "Chat", icon: MessageSquare },
  { href: "/seller/profile", label: "Profile", icon: UserRound },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allowedRoles={["seller"]} title="Seller" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
