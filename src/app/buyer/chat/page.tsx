"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { ChatView } from "@/components/shared/chat-view";

export default function BuyerChatPage() {
  const { buyerProfile } = useAuth();
  if (!buyerProfile) return null;
  return (
    <>
      <PageHeader title="Chat" description="Negotiate directly with sellers in real time." />
      <ChatView perspective="buyer" profileId={buyerProfile.id} />
    </>
  );
}
