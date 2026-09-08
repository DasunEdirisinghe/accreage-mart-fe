import { getPendingAccounts } from "@/app/actions/accounts";
import { PageHeader } from "@/components/shared/page-header";
import { PendingAccountsTable } from "@/components/shared/pending-accounts-table";

export default async function AccountApprovalsPage() {
  const rows = await getPendingAccounts();

  return (
    <>
      <PageHeader
        title="Account approvals"
        description="Verify new buyer and seller businesses. Verifying a seller lifts their pending gate (SRS 2.2)."
      />
      <PendingAccountsTable rows={rows} />
    </>
  );
}
