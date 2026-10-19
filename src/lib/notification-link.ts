import type { Role } from "@/lib/types";

/**
 * Maps a notification's source document to the route for the viewing role.
 * `document_type`/`document_name` are Notification Log's core fields (see
 * docs/epics/06-notification-management). Returns null when there is nothing
 * sensible to link to — callers render the row as plain text in that case.
 */
export function resolveNotificationLink(
  documentType: string | null | undefined,
  documentName: string | null | undefined,
  role: Role,
): string | null {
  if (!documentType || !documentName) return null;
  const id = encodeURIComponent(documentName);

  switch (documentType) {
    case "Listing":
      // No read-only seller-facing listing detail page exists yet — only the edit page
      // does (src/app/seller/listings/[id]/edit). Point there until one is built.
      if (role === "seller") return `/seller/listings/${id}/edit`;
      if (role === "staff" || role === "admin") return `/admin/approvals/${id}`;
      return `/marketplace/${id}`;
    case "Auction":
      // No role-specific auction detail route exists yet — the public detail
      // page works for every role.
      return `/auctions/${id}`;
    case "Order":
      if (role === "buyer") return `/buyer/orders/${id}`;
      if (role === "seller") return `/seller/orders/${id}`;
      if (role === "staff" || role === "admin") return `/admin/payments`;
      return null;
    case "Payment":
      if (role === "buyer") return `/buyer/orders/${id}`;
      if (role === "seller") return `/seller/orders/${id}`;
      if (role === "staff" || role === "admin") return `/admin/payments`;
      return null;
    default:
      return null;
  }
}
