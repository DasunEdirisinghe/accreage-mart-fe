"use client";

import { useParams } from "next/navigation";
import { OrderDetailView } from "@/components/shared/order-detail-view";

export default function BuyerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <OrderDetailView orderId={id} perspective="buyer" backHref="/buyer/orders" />;
}
