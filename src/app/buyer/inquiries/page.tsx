"use client";

import { useCurrentUser } from "@/components/providers/current-user-provider";
import { InquiriesPanel } from "@/components/shared/inquiries-panel";

export default function BuyerInquiriesPage() {
  const { user } = useCurrentUser();
  if (!user) return null;
  return <InquiriesPanel userId={user.id} />;
}
