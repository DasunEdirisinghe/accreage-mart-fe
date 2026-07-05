"use client";

import { useParams } from "next/navigation";
import { OrderDetailView } from "@/components/shared/order-detail-view";

export default function SellerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <OrderDetailView orderId={id} perspective="seller" backHref="/seller/orders" />;
}
