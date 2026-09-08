import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AccountSuspendedPage from "@/app/(site)/account/suspended/page";

describe("AccountSuspendedPage", () => {
  it("explains the account is unavailable and links to support", () => {
    render(<AccountSuspendedPage />);

    expect(screen.getByText(/account unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /contact support/i })).toHaveAttribute("href", "/contact");
  });
});
