import { listAccounts } from "@/app/actions/admin-accounts";
import { PageHeader } from "@/components/shared/page-header";
import { AdminReportsView } from "@/components/shared/admin-reports-view";

export default async function AdminReportsPage() {
  const [staff, members] = await Promise.all([
    listAccounts("staff"),
    listAccounts("members"),
  ]);
  const accounts = [...staff, ...members];

  return (
    <>
      <PageHeader
        title="Platform reports"
        description="Sales, user activity and AI market analysis."
      />
      <AdminReportsView
        totalUsers={accounts.length}
        activeUsers={accounts.filter((a) => a.status === "active").length}
      />
    </>
  );
}
