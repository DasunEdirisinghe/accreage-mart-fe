import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import UserManagementPage from "@/app/admin/users/page";
import { mutate } from "@/lib/store";
import type { User } from "@/lib/types";

const invitedUser: User = {
  id: "u-test-invited",
  name: "Test Invitee",
  email: "invitee@accreagemart.lk",
  phone: "+94 70 000 0000",
  role: "buyer",
  status: "invited",
  avatarColor: "bg-slate-600",
  createdAt: new Date().toISOString(),
};

describe("UserManagementPage — invited accounts", () => {
  beforeEach(() => {
    mutate((db) => {
      db.users.push(invitedUser);
    });
  });

  it("shows an 'Invited' badge and no status controls for an invited account", () => {
    render(<UserManagementPage />);

    const row = screen.getByText("Test Invitee").closest("tr");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText("Invited")).toBeInTheDocument();
    expect(
      within(row as HTMLElement).queryByRole("button", { name: /manage/i }),
    ).not.toBeInTheDocument();
    expect(within(row as HTMLElement).getByText("Awaiting activation")).toBeInTheDocument();
  });

  it("still shows the Manage control for an active account", () => {
    render(<UserManagementPage />);

    const row = screen.getByText("Nadeesha Perera").closest("tr");
    expect(within(row as HTMLElement).getByRole("button", { name: /manage/i })).toBeInTheDocument();
  });
});
