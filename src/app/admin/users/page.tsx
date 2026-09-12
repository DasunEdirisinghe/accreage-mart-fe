import { listAccounts } from "@/app/actions/admin-accounts";
import { PageHeader } from "@/components/shared/page-header";
import { AccountManageTable } from "@/components/shared/account-manage-table";

export default async function UserManagementPage() {
  const rows = await listAccounts("members");

  return (
    <>
      <PageHeader
        title="User management"
        description="View, activate, suspend or deactivate buyer and seller accounts."
      />
      <AccountManageTable
        rows={rows}
        showBusiness
        emptyDescription="Buyer and seller accounts appear here once people register."
      />
    </>
  );
}
