import { getAccountApplications } from "@/app/actions/accounts";
import { PageHeader } from "@/components/shared/page-header";
import { AccountApplicationsTable } from "@/components/shared/account-applications-table";

export default async function AccountApprovalsPage() {
  const rows = await getAccountApplications();

  return (
    <>
      <PageHeader
        title="Account approvals"
        description="Verify new buyer and seller businesses. Verifying a seller lifts their pending gate."
      />
      <AccountApplicationsTable rows={rows} />
    </>
  );
}
