import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/pricing", () => ({ updatePriceSuggestionSettings: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { updatePriceSuggestionSettings } from "@/app/actions/pricing";
import { PriceSuggestionSettingsForm } from "@/components/shared/price-suggestion-settings-form";

const mockUpdate = vi.mocked(updatePriceSuggestionSettings);

const settings = { mape_threshold_1_7d: 20, mape_threshold_8_14d: 20, mape_threshold_15_30d: 20 };

beforeEach(() => vi.clearAllMocks());

describe("PriceSuggestionSettingsForm", () => {
  it("renders the three current thresholds", () => {
    render(<PriceSuggestionSettingsForm settings={settings} />);
    expect(screen.getByLabelText("1–7 days")).toHaveValue(20);
    expect(screen.getByLabelText("8–14 days")).toHaveValue(20);
    expect(screen.getByLabelText("15–30 days")).toHaveValue(20);
  });

  it("saves the edited values", async () => {
    mockUpdate.mockResolvedValue({
      ok: true,
      settings: { mape_threshold_1_7d: 15, mape_threshold_8_14d: 20, mape_threshold_15_30d: 20 },
    });
    const user = userEvent.setup();
    render(<PriceSuggestionSettingsForm settings={settings} />);

    await user.clear(screen.getByLabelText("1–7 days"));
    await user.type(screen.getByLabelText("1–7 days"), "15");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(mockUpdate).toHaveBeenCalledWith({
      mape_threshold_1_7d: 15,
      mape_threshold_8_14d: 20,
      mape_threshold_15_30d: 20,
    });
  });

  it("disables saving when a threshold is out of range", async () => {
    const user = userEvent.setup();
    render(<PriceSuggestionSettingsForm settings={settings} />);

    await user.clear(screen.getByLabelText("1–7 days"));
    await user.type(screen.getByLabelText("1–7 days"), "0");

    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
