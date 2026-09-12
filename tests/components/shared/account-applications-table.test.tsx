import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/accounts", () => ({ approveAccount: vi.fn(), rejectAccount: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { AccountApplicationsTable } from "@/components/shared/account-applications-table";
import { approveAccount, rejectAccount, type AccountApplication } from "@/app/actions/accounts";

const mockApprove = vi.mocked(approveAccount);
const mockReject = vi.mocked(rejectAccount);

const baseRow: AccountApplication = {
  email: "seller@x.lk",
  fullName: "Sena Silva",
  role: "seller",
  businessName: "Silva Farms",
  district: "Kandy",
  mobile: "0771234567",
  description: "Organic vegetable grower.",
  verificationStatus: "pending",
  rejectionReason: "",
  since: "2026-09-01T00:00:00Z",
  reviewedOn: null,
};

describe("AccountApplicationsTable", () => {
  it("shows pending rows under the Pending tab with a Review action", () => {
    render(<AccountApplicationsTable rows={[baseRow]} />);
    expect(screen.getByRole("tab", { name: /pending \(1\)/i })).toBeInTheDocument();
    expect(screen.getByText("Silva Farms")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /review/i })).toBeInTheDocument();
  });

  it("shows an empty state when there is nothing pending", () => {
    render(<AccountApplicationsTable rows={[]} />);
    expect(screen.getByText(/nothing to review/i)).toBeInTheDocument();
  });

  it("opens the detail dialog with every registration field and approves on confirm", async () => {
    const user = userEvent.setup();
    mockApprove.mockResolvedValueOnce({ ok: true });
    render(<AccountApplicationsTable rows={[baseRow]} />);

    await user.click(screen.getByRole("button", { name: /review/i }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Silva Farms")).toBeInTheDocument();
    expect(within(dialog).getByText(/sena silva/i)).toBeInTheDocument();
    expect(within(dialog).getByText("0771234567")).toBeInTheDocument();
    expect(within(dialog).getByText("Kandy")).toBeInTheDocument();
    expect(within(dialog).getByText("Organic vegetable grower.")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /^approve$/i }));

    expect(mockApprove).toHaveBeenCalledWith("seller@x.lk");
  });

  it("requires a reason before rejecting, then submits it", async () => {
    const user = userEvent.setup();
    mockReject.mockResolvedValueOnce({ ok: true });
    render(<AccountApplicationsTable rows={[baseRow]} />);

    await user.click(screen.getByRole("button", { name: /review/i }));
    await user.click(screen.getByRole("button", { name: /^reject$/i }));

    const confirmButton = screen.getByRole("button", { name: /reject account/i });
    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/reason for rejection/i), "Missing documents");
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);
    expect(mockReject).toHaveBeenCalledWith("seller@x.lk", "Missing documents");
  });

  it("shows the rejection reason and reviewed date in the Rejected tab", async () => {
    const user = userEvent.setup();
    const rejectedRow: AccountApplication = {
      ...baseRow,
      email: "rejected@x.lk",
      businessName: "Old Farms",
      verificationStatus: "rejected",
      rejectionReason: "Duplicate application",
      reviewedOn: "2026-09-05T00:00:00Z",
    };
    render(<AccountApplicationsTable rows={[rejectedRow]} />);

    await user.click(screen.getByRole("tab", { name: /rejected \(1\)/i }));
    expect(screen.getByText("Old Farms")).toBeInTheDocument();
    expect(screen.getByText("Duplicate application")).toBeInTheDocument();
  });
});
