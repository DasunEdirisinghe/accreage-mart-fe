"use client";

import {
  LayoutDashboard,
  ClipboardCheck,
  Gavel,
  Users,
  Receipt,
  HelpCircle,
  Star,
  FileText,
  ShieldCheck,
  LineChart,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/approvals", label: "Listing approvals", icon: ClipboardCheck },
  { href: "/admin/auctions", label: "Auction approvals", icon: Gavel },
  { href: "/admin/payments", label: "Payment review", icon: Receipt },
  { href: "/admin/users", label: "User management", icon: Users },
  { href: "/admin/inquiries", label: "Inquiries", icon: HelpCircle },
  { href: "/admin/reviews", label: "Feedback moderation", icon: Star },
  { href: "/admin/content", label: "Web content", icon: FileText },
  { href: "/admin/staff", label: "Staff management", icon: ShieldCheck },
  { href: "/admin/reports", label: "Reports", icon: LineChart },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allowedRoles={["staff", "admin"]} title="Admin" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
