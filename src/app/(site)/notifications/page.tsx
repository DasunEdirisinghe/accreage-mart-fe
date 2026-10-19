import { redirect } from "next/navigation";

import { getNotificationsPage } from "@/app/actions/notifications";
import { NotificationsListView } from "@/components/pages/notifications/notifications-list-view";
import { getCurrentUser } from "@/lib/current-user-info";

const PAGE_SIZE = 20;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/notifications");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const data = await getNotificationsPage(page, PAGE_SIZE);

  return <NotificationsListView data={data} role={user.role ?? "public"} />;
}
