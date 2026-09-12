import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/pricing", () => ({ upsertCategory: vi.fn(), deleteCategory: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { CategoriesTable } from "@/components/shared/categories-table";
import { deleteCategory, upsertCategory, type CommodityOption } from "@/app/actions/pricing";
import type { PricingCategory } from "@/lib/types";

const mockUpsert = vi.mocked(upsertCategory);
const mockDelete = vi.mocked(deleteCategory);

const carrot: PricingCategory = {
  name: "cat-carrot",
  title: "Carrot — Up Country",
  area: "Vegetables",
  commodity: "Up Country Vegetable - Carrot",
};
const tools: PricingCategory = { name: "cat-tools", title: "Hand Tools", area: "Tools", commodity: null };
const commodities: CommodityOption[] = [
  { name: "Up Country Vegetable - Carrot" },
  { name: "Rice - Nadu 1" },
];

afterEach(() => vi.clearAllMocks());

describe("CategoriesTable", () => {
  it("lists categories with their area and commodity", () => {
    render(<CategoriesTable categories={[carrot, tools]} commodities={commodities} />);
    expect(screen.getByText("Carrot — Up Country")).toBeInTheDocument();
    expect(screen.getByText("Up Country Vegetable - Carrot")).toBeInTheDocument();
    expect(screen.getByText("Hand Tools")).toBeInTheDocument();
  });

  it("shows an empty state when there are no categories", () => {
    render(<CategoriesTable categories={[]} commodities={commodities} />);
    expect(screen.getByText(/no categories yet/i)).toBeInTheDocument();
  });

  it("creates a category via the New category dialog", async () => {
    const user = userEvent.setup();
    mockUpsert.mockResolvedValueOnce({
      ok: true,
      category: { name: "cat-new", title: "Fertilizer Mix", area: "Fertilizer", commodity: null },
    });
    render(<CategoriesTable categories={[tools]} commodities={commodities} />);

    await user.click(screen.getByRole("button", { name: /new category/i }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText(/title/i), "Fertilizer Mix");
    await user.click(within(dialog).getByRole("button", { name: /create category/i }));

    expect(mockUpsert).toHaveBeenCalledWith({
      name: undefined,
      title: "Fertilizer Mix",
      area: "Other",
      commodity: null,
    });
  });

  it("blocks saving without a title", async () => {
    const user = userEvent.setup();
    render(<CategoriesTable categories={[tools]} commodities={commodities} />);

    await user.click(screen.getByRole("button", { name: /new category/i }));
    await user.click(screen.getByRole("button", { name: /create category/i }));

    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("opens the edit dialog prefilled with the category's values", async () => {
    const user = userEvent.setup();
    render(<CategoriesTable categories={[carrot, tools]} commodities={commodities} />);

    const row = screen.getByText("Carrot — Up Country").closest("tr")!;
    await user.click(within(row).getByRole("button", { name: /edit/i }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByDisplayValue("Carrot — Up Country")).toBeInTheDocument();
    expect(within(dialog).getByText("Up Country Vegetable - Carrot")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("shows the reverse-lookup panel when the selected commodity is shared with another category", async () => {
    const shared: PricingCategory = {
      name: "cat-carrot-2",
      title: "Carrot — Low Country",
      area: "Vegetables",
      commodity: "Up Country Vegetable - Carrot",
    };
    const user = userEvent.setup();
    render(<CategoriesTable categories={[carrot, shared]} commodities={commodities} />);

    const row = screen.getByText("Carrot — Up Country").closest("tr")!;
    await user.click(within(row).getByRole("button", { name: /edit/i }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/also used by/i)).toBeInTheDocument();
    expect(within(dialog).getByText("Carrot — Low Country")).toBeInTheDocument();
  });

  it("deletes a category after confirmation", async () => {
    const user = userEvent.setup();
    mockDelete.mockResolvedValueOnce({ ok: true });
    render(<CategoriesTable categories={[tools]} commodities={commodities} />);

    const row = screen.getByText("Hand Tools").closest("tr")!;
    await user.click(within(row).getByRole("button", { name: /delete/i }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/delete "hand tools"\?/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /^delete category$/i }));

    expect(mockDelete).toHaveBeenCalledWith("cat-tools");
  });
});
