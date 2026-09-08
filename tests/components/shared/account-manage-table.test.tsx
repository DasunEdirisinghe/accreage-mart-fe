import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/admin-accounts", () => ({ setAccountStatus: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { AccountManageTable } from "@/components/shared/account-manage-table";
import type { ManagedAccount } from "@/app/actions/admin-accounts";

const rows: ManagedAccount[] = [
  { email: "a@x.lk", fullName: "Active One", role: "staff", status: "active", since: "2026-01-10T00:00:00Z" },
  { email: "i@x.lk", fullName: "Invited One", role: "admin", status: "invited", since: "2026-02-10T00:00:00Z" },
  { email: "s@x.lk", fullName: "Suspended One", role: "buyer", status: "suspended", businessName: "Hotel Co", since: "2026-03-10T00:00:00Z" },
];

describe("AccountManageTable", () => {
  it("renders a status badge per row and gates the Manage control by status", () => {
    render(<AccountManageTable rows={rows} showBusiness emptyDescription="none" />);

    const activeRow = screen.getByText("Active One").closest("tr") as HTMLElement;
    expect(within(activeRow).getByText("Active")).toBeInTheDocument();
    expect(within(activeRow).getByRole("button", { name: /manage/i })).toBeInTheDocument();

    const invitedRow = screen.getByText("Invited One").closest("tr") as HTMLElement;
    expect(within(invitedRow).getByText("Invited")).toBeInTheDocument();
    expect(within(invitedRow).queryByRole("button", { name: /manage/i })).not.toBeInTheDocument();
    expect(within(invitedRow).getByText(/awaiting activation/i)).toBeInTheDocument();

    expect(screen.getByText("Hotel Co")).toBeInTheDocument();
  });

  it("shows an empty state with no rows", () => {
    render(<AccountManageTable rows={[]} emptyDescription="Nobody here yet" />);
    expect(screen.getByText("Nobody here yet")).toBeInTheDocument();
  });
});
