import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/pricing", () => ({ setCommodityActive: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { setCommodityActive } from "@/app/actions/pricing";
import { CommodityActiveToggle } from "@/components/shared/commodity-active-toggle";

const mockSetActive = vi.mocked(setCommodityActive);

beforeEach(() => vi.clearAllMocks());

describe("CommodityActiveToggle", () => {
  it("shows Active and a checked switch when the commodity is active", () => {
    render(<CommodityActiveToggle name="Rice - Nadu 1" isActive={true} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("shows Inactive and an unchecked switch when the commodity is disabled", () => {
    render(<CommodityActiveToggle name="Rice - Nadu 1" isActive={false} />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("calls setCommodityActive with the new state when toggled off", async () => {
    mockSetActive.mockResolvedValue({ ok: true, isActive: false });
    const user = userEvent.setup();
    render(<CommodityActiveToggle name="Rice - Nadu 1" isActive={true} />);
    await user.click(screen.getByRole("switch"));
    expect(mockSetActive).toHaveBeenCalledWith("Rice - Nadu 1", false);
  });
});
