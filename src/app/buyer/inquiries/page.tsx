"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { InquiriesPanel } from "@/components/shared/inquiries-panel";

export default function BuyerInquiriesPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <InquiriesPanel userId={user.id} />;
}
