"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { ChatView } from "@/components/shared/chat-view";

export default function SellerChatPage() {
  const { sellerProfile } = useAuth();
  if (!sellerProfile) return null;
  return (
    <>
      <PageHeader title="Chat" description="Respond to buyer inquiries and negotiate deals in real time." />
      <ChatView perspective="seller" profileId={sellerProfile.id} />
    </>
  );
}
