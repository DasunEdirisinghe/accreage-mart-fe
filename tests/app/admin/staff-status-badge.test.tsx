import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import StaffManagementPage from "@/app/admin/staff/page";
import { mutate } from "@/lib/store";
import type { User } from "@/lib/types";

const invitedStaff: User = {
  id: "u-test-staff-invited",
  name: "Priya Fernando",
  email: "priya@accreagemart.lk",
  phone: "+94 70 000 0000",
  role: "staff",
  status: "invited",
  avatarColor: "bg-cyan-700",
  createdAt: new Date().toISOString(),
};

describe("StaffManagementPage — invited accounts", () => {
  beforeEach(() => {
    mutate((db) => {
      db.users.push(invitedStaff);
    });
  });

  it("shows an 'Invited' badge and no suspend/reactivate control for an invited staff account", () => {
    render(<StaffManagementPage />);

    const row = screen.getByText("Priya Fernando").closest("tr");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText("Invited")).toBeInTheDocument();
    expect(
      within(row as HTMLElement).queryByRole("button", { name: /suspend|reactivate/i }),
    ).not.toBeInTheDocument();
    expect(within(row as HTMLElement).getByText("Awaiting activation")).toBeInTheDocument();
  });

  it("shows the Suspend control for an active staff account", () => {
    render(<StaffManagementPage />);

    const row = screen.getByText("Kasun Jayasuriya").closest("tr");
    expect(within(row as HTMLElement).getByRole("button", { name: /suspend/i })).toBeInTheDocument();
  });
});
