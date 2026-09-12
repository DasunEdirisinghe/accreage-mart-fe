import { listAccounts } from "@/app/actions/admin-accounts";
import { PageHeader } from "@/components/shared/page-header";
import { AccountManageTable } from "@/components/shared/account-manage-table";
import { AddStaffDialog } from "@/components/shared/add-staff-dialog";

export default async function StaffManagementPage() {
  const rows = await listAccounts("staff");

  return (
    <>
      <PageHeader
        title="Staff management"
        description="Administrators create staff and admin accounts and manage their access."
      >
        <AddStaffDialog />
      </PageHeader>
      <AccountManageTable
        rows={rows}
        emptyDescription="Add a staff member — they'll get an email to set their password."
      />
    </>
  );
}
