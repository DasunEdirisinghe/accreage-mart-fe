import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/auth", () => ({ setPassword: vi.fn() }));

import { SetPasswordClient } from "@/components/shared/set-password-client";

describe("SetPasswordClient", () => {
  it("shows the form for a valid key", () => {
    render(<SetPasswordClient valid requestKey="abc123" />);
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("shows the expired state for an invalid / used key", () => {
    render(<SetPasswordClient valid={false} requestKey="" />);
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    expect(screen.getByText(/link expired/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request a new link/i })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });
});
