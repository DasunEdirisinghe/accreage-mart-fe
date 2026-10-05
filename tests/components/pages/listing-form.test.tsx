import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/listings", () => ({
  createListing: vi.fn(async () => ({})),
  updateListing: vi.fn(async () => ({})),
  getPriceSuggestion: vi.fn(async () => ({ state: "none", reason: "no_commodity" })),
  uploadListingImage: vi.fn(),
  discardListingImage: vi.fn(),
}));

import { createListing, getPriceSuggestion, updateListing } from "@/app/actions/listings";
import { ListingForm } from "@/components/pages/listings/listing-form";
import type { EditRestriction } from "@/lib/listing-edit";
import type { ListingCategoryOption, ListingFormValues } from "@/types/listing.type";

const mockCreate = vi.mocked(createListing);
const mockUpdate = vi.mocked(updateListing);
const mockSuggest = vi.mocked(getPriceSuggestion);

const categories: ListingCategoryOption[] = [
  { name: "cat-carrot", title: "Carrot", area: "Vegetables" },
  { name: "cat-rice", title: "Nadu Rice", area: "Rice" },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({});
  mockSuggest.mockResolvedValue({ state: "none", reason: "no_commodity" });
});

const initialDirect: ListingFormValues = {
  selling_type: "Direct",
  category: "cat-carrot",
  title: "Fresh Carrots",
  description: "Grade A",
  unit: "kg",
  quantity_available: "500",
  price_per_unit: "120",
  min_order_qty: "",
  low_stock_level: "",
  district: "Kandy",
  location: "Kandy market",
  latitude: "",
  longitude: "",
  organic: false,
  certification: "",
  images: [{ image: "/files/lst-a.png", is_cover: true }],
  min_bid: "",
  start_time: "",
  end_time: "",
  auction_terms_acknowledged: false,
};

const initialAuction: ListingFormValues = {
  ...initialDirect,
  selling_type: "Auction",
  price_per_unit: "",
  min_bid: "300",
  start_time: "2030-01-01T10:00",
  end_time: "2030-01-01T22:00",
};

describe("ListingForm: creating", () => {
  it("starts as a direct sale with the direct-only fields", () => {
    render(<ListingForm mode="create" categories={categories} />);
    expect(screen.getByRole("button", { name: /Direct sale/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText(/Price per kg/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Minimum order quantity/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Low-stock alert level/)).toBeInTheDocument();
    expect(screen.queryByText("Auction terms *")).not.toBeInTheDocument();
  });

  it("makes the minimum order and low-stock fields optional", () => {
    render(<ListingForm mode="create" categories={categories} />);
    expect(screen.getByLabelText(/Minimum order quantity/).closest("div")).toHaveTextContent("(optional)");
    expect(screen.getByLabelText(/Low-stock alert level/).closest("div")).toHaveTextContent("(optional)");
  });

  it("switches to an auction: terms and rules appear, the direct price goes", async () => {
    const user = userEvent.setup();
    render(<ListingForm mode="create" categories={categories} />);
    await user.click(screen.getByRole("button", { name: /Auction/ }));

    expect(screen.getByText("Auction terms *")).toBeInTheDocument();
    expect(screen.getByLabelText(/Minimum bid/)).toBeInTheDocument();
    expect(screen.getByLabelText("Starts *")).toBeInTheDocument();
    expect(screen.getByLabelText("Ends *")).toBeInTheDocument();
    expect(screen.getByLabelText(/Lot quantity/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Price per kg/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Minimum order quantity/)).not.toBeInTheDocument();
  });

  it("states the auction rules and asks for an acknowledgement", async () => {
    const user = userEvent.setup();
    render(<ListingForm mode="create" categories={categories} />);
    await user.click(screen.getByRole("button", { name: /Auction/ }));

    expect(screen.getByText(/at least 24 hours from now/)).toBeInTheDocument();
    expect(screen.getByText(/6 to 48 hours/)).toBeInTheDocument();
    expect(screen.getByText(/cannot stop it without contacting staff/)).toBeInTheDocument();
    expect(screen.getByText(/not even staff can stop it/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /I understand these rules/ })).not.toBeChecked();
  });

  it("shows the certification field only for organic produce", async () => {
    const user = userEvent.setup();
    render(<ListingForm mode="create" categories={categories} />);
    expect(screen.queryByLabelText(/Certification details/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("switch"));
    expect(screen.getByLabelText(/Certification details/)).toBeInTheDocument();
  });

  it("picks a category from a searchable list and a district from a searchable list", async () => {
    const user = userEvent.setup();
    render(<ListingForm mode="create" categories={categories} />);

    await user.click(screen.getByRole("combobox", { name: /Category/ }));
    await user.type(screen.getByPlaceholderText("Search categories"), "rice");
    await user.click(screen.getByRole("option", { name: /Nadu Rice/ }));
    expect(screen.getByRole("combobox", { name: /Category/ })).toHaveTextContent("Nadu Rice");

    await user.click(screen.getByRole("combobox", { name: /District/ }));
    await user.type(screen.getByPlaceholderText("Search districts"), "nuw");
    await user.click(screen.getByRole("option", { name: "Nuwara Eliya" }));
    expect(screen.getByRole("combobox", { name: /District/ })).toHaveTextContent("Nuwara Eliya");
  });

  it("lists the fixed units", () => {
    render(<ListingForm mode="create" categories={categories} />);
    const units = within(screen.getByLabelText("Unit *")).getAllByRole("option").map((o) => o.textContent);
    expect(units).toEqual(["kg", "nut", "bundle", "piece", "bag", "litre", "dozen"]);
  });

  it("looks up the price suggestion when a category is chosen and can use it", async () => {
    const user = userEvent.setup();
    mockSuggest.mockResolvedValue({ state: "available", commodityName: "Carrot", priceUnit: "kg", tier: "direct", price: 150, min: 130, max: 170 });
    render(<ListingForm mode="create" categories={categories} />);

    expect(screen.getByText(/Choose a category to see a price reference/)).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: /Category/ }));
    await user.click(screen.getByRole("option", { name: /Carrot/ }));

    await user.click(await screen.findByRole("button", { name: /Use this price/ }));
    expect(screen.getByLabelText(/Price per kg/)).toHaveValue(150);
    expect(mockSuggest).toHaveBeenCalledWith("cat-carrot");
  });

  it("says there is no suggestion when the category has no price reference", async () => {
    const user = userEvent.setup();
    render(<ListingForm mode="create" categories={categories} />);
    await user.click(screen.getByRole("combobox", { name: /Category/ }));
    await user.click(screen.getByRole("option", { name: /Carrot/ }));
    expect(await screen.findByText(/no price reference set up/)).toBeInTheDocument();
  });

  it("uses the suggestion as the minimum bid for an auction", async () => {
    const user = userEvent.setup();
    mockSuggest.mockResolvedValue({ state: "available", commodityName: "Carrot", priceUnit: "kg", tier: "range", min: 100, max: 140 });
    render(<ListingForm mode="create" categories={categories} />);
    await user.click(screen.getByRole("button", { name: /Auction/ }));
    await user.click(screen.getByRole("combobox", { name: /Category/ }));
    await user.click(screen.getByRole("option", { name: /Carrot/ }));
    await user.click(await screen.findByRole("button", { name: /Use as minimum bid/ }));
    expect(screen.getByLabelText(/Minimum bid/)).toHaveValue(120);
  });

  it("submits the form fields, images and flags to the create action", async () => {
    const user = userEvent.setup();
    render(<ListingForm mode="create" categories={categories} initial={initialDirect} />);
    await user.click(screen.getByRole("button", { name: "Submit for approval" }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    const data = mockCreate.mock.calls[0][1] as FormData;
    expect(data.get("selling_type")).toBe("Direct");
    expect(data.get("category")).toBe("cat-carrot");
    expect(data.get("title")).toBe("Fresh Carrots");
    expect(data.get("district")).toBe("Kandy");
    expect(data.get("price_per_unit")).toBe("120");
    expect(data.get("organic")).toBe("");
    expect(JSON.parse(String(data.get("images")))).toEqual([{ image: "/files/lst-a.png", is_cover: true }]);
  });

  it("sends the auction terms and the acknowledgement for an auction", async () => {
    const user = userEvent.setup();
    render(<ListingForm mode="create" categories={categories} initial={initialAuction} />);
    await user.click(screen.getByRole("checkbox", { name: /I understand these rules/ }));
    await user.click(screen.getByRole("button", { name: "Submit for approval" }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    const data = mockCreate.mock.calls[0][1] as FormData;
    expect(data.get("selling_type")).toBe("Auction");
    expect(data.get("min_bid")).toBe("300");
    expect(data.get("start_time")).toBe("2030-01-01T10:00");
    expect(data.get("auction_terms_acknowledged")).toBe("on");
  });

  it("shows the action's field errors and message", async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValueOnce({
      success: false,
      message: "Only verified sellers can manage listings.",
      errors: { title: ["Title is required."], images: ["Add at least one image."] },
    });
    render(<ListingForm mode="create" categories={categories} initial={initialDirect} />);
    await user.click(screen.getByRole("button", { name: "Submit for approval" }));

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Add at least one image.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Only verified sellers can manage listings.");
  });

  it("shows live feedback on auction times", async () => {
    render(
      <ListingForm
        mode="create"
        categories={categories}
        initial={{ ...initialAuction, start_time: "2020-01-01T10:00", end_time: "2020-01-01T11:00" }}
      />,
    );
    expect(screen.getByText(/The auction must start at least 24 hours from now/)).toBeInTheDocument();
    expect(screen.getByText(/An auction must run for at least 6 hours\./)).toBeInTheDocument();
  });
});

describe("ListingForm: editing", () => {
  const open: EditRestriction = { canEdit: true, termsLocked: false, lotLocked: false, termsChangeSendsToReview: false };

  it("fills in the existing values and fixes the selling type", () => {
    render(<ListingForm mode="edit" listingName="LST-1" categories={categories} initial={initialDirect} restriction={open} />);
    expect(screen.getByLabelText(/Title/)).toHaveValue("Fresh Carrots");
    expect(screen.getByLabelText(/Price per kg/)).toHaveValue(120);
    expect(screen.getByRole("button", { name: /Direct sale/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Auction/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("saves through the update action, bound to the listing", async () => {
    const user = userEvent.setup();
    render(<ListingForm mode="edit" listingName="LST-1" categories={categories} initial={initialDirect} restriction={open} />);
    await user.clear(screen.getByLabelText(/Title/));
    await user.type(screen.getByLabelText(/Title/), "Renamed");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
    expect(mockUpdate.mock.calls[0][0]).toBe("LST-1");
    expect((mockUpdate.mock.calls[0][2] as FormData).get("title")).toBe("Renamed");
  });

  it("does not ask for the auction acknowledgement again", () => {
    render(<ListingForm mode="edit" listingName="LST-1" categories={categories} initial={initialAuction} restriction={open} />);
    expect(screen.queryByRole("checkbox", { name: /I understand these rules/ })).not.toBeInTheDocument();
  });

  it("shows the restriction banner", () => {
    render(
      <ListingForm
        mode="edit"
        listingName="LST-1"
        categories={categories}
        initial={initialAuction}
        restriction={{ ...open, termsChangeSendsToReview: true, banner: { tone: "warning", text: "Changing the terms sends this listing back for review." } }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("sends this listing back for review");
    expect(screen.getByText(/sends this listing back for staff review/)).toBeInTheDocument();
  });

  it("freezes the terms, quantity and unit of a started auction but still submits them", () => {
    const { container } = render(
      <ListingForm
        mode="edit"
        listingName="LST-1"
        categories={categories}
        initial={initialAuction}
        restriction={{ ...open, termsLocked: true, lotLocked: true }}
      />,
    );
    expect(screen.getByLabelText(/Minimum bid/)).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Starts *")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Ends *")).toHaveAttribute("readonly");
    expect(screen.getByLabelText(/Lot quantity/)).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Unit *")).toBeDisabled();
    expect(container.querySelector('input[type="hidden"][name="unit"]')).toHaveValue("kg");
  });
});
