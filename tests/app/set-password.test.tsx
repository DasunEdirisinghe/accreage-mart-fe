import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/auth", () => ({ setPassword: vi.fn() }));

const searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

import SetPasswordPage from "@/app/(site)/set-password/page";

describe("SetPasswordPage", () => {
  it("shows the form when a key is present", () => {
    searchParams.set("key", "abc123");
    render(<SetPasswordPage />);
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("asks for a fresh link when the key is missing", () => {
    searchParams.delete("key");
    render(<SetPasswordPage />);
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request a new link/i })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });
});
