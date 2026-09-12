import { listAccounts } from "@/app/actions/admin-accounts";
import { PageHeader } from "@/components/shared/page-header";
import { AdminOverview } from "@/components/shared/admin-overview";

export default async function AdminDashboardPage() {
  const [staff, members] = await Promise.all([
    listAccounts("staff"),
    listAccounts("members"),
  ]);
  const sellerCount = members.filter((m) => m.role === "seller").length;
  const buyerCount = members.filter((m) => m.role === "buyer").length;

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Operations dashboard for staff and administrators."
      />
      <AdminOverview
        registeredUsers={staff.length + members.length}
        sellerCount={sellerCount}
        buyerCount={buyerCount}
      />
    </>
  );
}
