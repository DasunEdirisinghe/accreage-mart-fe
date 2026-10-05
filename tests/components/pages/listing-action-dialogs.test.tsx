import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/listings", () => ({
  archiveListing: vi.fn(),
  duplicateListing: vi.fn(),
  getListingActionInfo: vi.fn(),
  getListingHistory: vi.fn(),
  hideListing: vi.fn(),
  resubmitListing: vi.fn(),
  updateStock: vi.fn(),
}));

import {
  archiveListing,
  duplicateListing,
  getListingActionInfo,
  getListingHistory,
  hideListing,
  resubmitListing,
  updateStock,
} from "@/app/actions/listings";
import {
  DuplicateDialog,
  HideArchiveDialog,
  HistoryDialog,
  ResubmitDialog,
  StockDialog,
} from "@/components/pages/listings/listing-action-dialogs";
import { siteNow } from "@/lib/listing-time";
import type { ListingActionInfo } from "@/types/listing.type";
import { makeAuctionListing, makeMyListing } from "../../helpers/my-listing";

const mockInfo = vi.mocked(getListingActionInfo);
const mockHide = vi.mocked(hideListing);
const mockArchive = vi.mocked(archiveListing);
const mockStock = vi.mocked(updateStock);
const mockResubmit = vi.mocked(resubmitListing);
const mockDuplicate = vi.mocked(duplicateListing);
const mockHistory = vi.mocked(getListingHistory);

const WARNING = "Buyers who have already ordered it can still see it through their order.";
const info = (over: Partial<ListingActionInfo> = {}): ListingActionInfo => ({
  hide: { blocked_reason: null },
  archive: { blocked_reason: null },
  unhide: { blocked_reason: null },
  warning: WARNING,
  active_order_count: 0,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockInfo.mockResolvedValue(info());
});

function setup<P extends { onOpenChange: (o: boolean) => void; onDone: () => void }>(
  Dialog: (props: any) => React.ReactElement, // eslint-disable-line @typescript-eslint/no-explicit-any
  props: Omit<P, "onOpenChange" | "onDone" | "open"> & Record<string, unknown>,
) {
  const onOpenChange = vi.fn();
  const onDone = vi.fn();
  render(<Dialog open onOpenChange={onOpenChange} onDone={onDone} {...props} />);
  return { onOpenChange, onDone };
}

describe("HideArchiveDialog", () => {
  it("shows the warning from the backend and needs the acknowledgement", async () => {
    const user = userEvent.setup();
    mockHide.mockResolvedValue({ ok: true });
    const { onDone, onOpenChange } = setup(HideArchiveDialog, { mode: "hide", listing: makeMyListing() });

    expect(await screen.findByText(WARNING)).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Hide" });
    expect(confirm).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: "I understand" }));
    expect(confirm).toBeEnabled();
    await user.click(confirm);

    await waitFor(() => expect(mockHide).toHaveBeenCalledWith("LST-00001", true));
    expect(onDone).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("explains that archiving is the way to delete, and that it can't be restored", async () => {
    setup(HideArchiveDialog, { mode: "archive", listing: makeMyListing() });
    expect(await screen.findByText(/Archiving is how you delete a listing/)).toBeInTheDocument();
    expect(screen.getByText(/can't be restored/)).toBeInTheDocument();
  });

  it("archives after the acknowledgement", async () => {
    const user = userEvent.setup();
    mockArchive.mockResolvedValue({ ok: true });
    const { onDone } = setup(HideArchiveDialog, { mode: "archive", listing: makeMyListing() });
    await user.click(await screen.findByRole("checkbox", { name: "I understand" }));
    await user.click(screen.getByRole("button", { name: "Archive" }));
    await waitFor(() => expect(mockArchive).toHaveBeenCalledWith("LST-00001", true));
    expect(onDone).toHaveBeenCalled();
  });

  it("mentions orders that will carry on", async () => {
    mockInfo.mockResolvedValue(info({ active_order_count: 2 }));
    setup(HideArchiveDialog, { mode: "hide", listing: makeMyListing() });
    expect(await screen.findByText(/2 orders on this listing will carry on as normal/)).toBeInTheDocument();
  });

  it("shows why it is blocked and offers no way through", async () => {
    mockInfo.mockResolvedValue(
      info({ archive: { blocked_reason: "This auction has started and cannot be stopped from here. Please contact staff." } }),
    );
    setup(HideArchiveDialog, { mode: "archive", listing: makeAuctionListing("live") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Please contact staff.");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archive" })).toBeDisabled();
  });

  it("shows the backend's error and stays open when the action fails", async () => {
    const user = userEvent.setup();
    mockHide.mockResolvedValue({ ok: false, error: "Only a published listing can be hidden." });
    const { onDone, onOpenChange } = setup(HideArchiveDialog, { mode: "hide", listing: makeMyListing() });
    await user.click(await screen.findByRole("checkbox", { name: "I understand" }));
    await user.click(screen.getByRole("button", { name: "Hide" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Only a published listing can be hidden.");
    expect(onDone).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("says so when it can't check the listing", async () => {
    mockInfo.mockResolvedValue(null);
    setup(HideArchiveDialog, { mode: "hide", listing: makeMyListing() });
    expect(await screen.findByText(/Couldn't check this listing/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide" })).toBeDisabled();
  });
});

describe("StockDialog", () => {
  it("starts from the current quantity and saves the new one", async () => {
    const user = userEvent.setup();
    mockStock.mockResolvedValue({ ok: true });
    const { onDone } = setup(StockDialog, { listing: makeMyListing({ quantity_available: 500 }) });
    const input = screen.getByLabelText(/Quantity available \(kg\)/);
    expect(input).toHaveValue(500);

    await user.clear(input);
    await user.type(input, "120");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mockStock).toHaveBeenCalledWith("LST-00001", 120));
    expect(onDone).toHaveBeenCalled();
  });

  it("lets the seller enter zero for sold out", async () => {
    const user = userEvent.setup();
    mockStock.mockResolvedValue({ ok: true });
    setup(StockDialog, { listing: makeMyListing() });
    await user.clear(screen.getByLabelText(/Quantity available/));
    await user.type(screen.getByLabelText(/Quantity available/), "0");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mockStock).toHaveBeenCalledWith("LST-00001", 0));
  });

  it("won't save a blank or negative quantity", async () => {
    const user = userEvent.setup();
    setup(StockDialog, { listing: makeMyListing() });
    const input = screen.getByLabelText(/Quantity available/);
    await user.clear(input);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await user.type(input, "-3");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("reminds the seller of the low-stock alert level", () => {
    setup(StockDialog, { listing: makeMyListing({ low_stock_level: 100 }) });
    expect(screen.getByText(/email when stock drops below 100 kg/)).toBeInTheDocument();
  });

  it("shows the error when saving fails", async () => {
    const user = userEvent.setup();
    mockStock.mockResolvedValue({ ok: false, error: "This listing's stock cannot be changed right now." });
    setup(StockDialog, { listing: makeMyListing() });
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("cannot be changed right now");
  });
});

describe("ResubmitDialog", () => {
  it("shows what staff said and sends the note", async () => {
    const user = userEvent.setup();
    mockResubmit.mockResolvedValue({ ok: true });
    const { onDone } = setup(ResubmitDialog, {
      listing: makeMyListing({ status: "Rejected", status_reason: "Photos are blurry." }),
    });
    expect(screen.getByText(/Photos are blurry./)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/What did you change/), "Replaced the photos.");
    await user.click(screen.getByRole("button", { name: "Resubmit" }));
    await waitFor(() => expect(mockResubmit).toHaveBeenCalledWith("LST-00001", "Replaced the photos."));
    expect(onDone).toHaveBeenCalled();
  });

  it("allows resubmitting without a note", async () => {
    const user = userEvent.setup();
    mockResubmit.mockResolvedValue({ ok: true });
    setup(ResubmitDialog, { listing: makeMyListing({ status: "Rejected" }) });
    await user.click(screen.getByRole("button", { name: "Resubmit" }));
    await waitFor(() => expect(mockResubmit).toHaveBeenCalledWith("LST-00001", ""));
  });

  it("shows the backend's reason when resubmitting is refused", async () => {
    const user = userEvent.setup();
    mockResubmit.mockResolvedValue({
      ok: false,
      error: "The auction must start at least 24 hours after you submit it for review.",
    });
    setup(ResubmitDialog, { listing: makeMyListing({ status: "Rejected" }) });
    await user.click(screen.getByRole("button", { name: "Resubmit" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("at least 24 hours");
  });
});

describe("DuplicateDialog", () => {
  it("duplicates a direct listing straight away", async () => {
    const user = userEvent.setup();
    mockDuplicate.mockResolvedValue({ ok: true, name: "LST-9" });
    const { onDone } = setup(DuplicateDialog, { listing: makeMyListing({ status: "Archived" }) });
    await user.click(screen.getByRole("button", { name: "Duplicate" }));
    await waitFor(() =>
      expect(mockDuplicate).toHaveBeenCalledWith("LST-00001", {
        acknowledged: false,
        minBid: undefined,
        startTime: undefined,
        endTime: undefined,
      }),
    );
    expect(onDone).toHaveBeenCalled();
  });

  it("asks an auction for new times and the acknowledgement before it can be duplicated", async () => {
    const user = userEvent.setup();
    mockDuplicate.mockResolvedValue({ ok: true, name: "LST-9" });
    setup(DuplicateDialog, { listing: makeAuctionListing("ended", { status: "Archived" }) });
    const button = screen.getByRole("button", { name: "Duplicate" });
    expect(button).toBeDisabled();
    expect(screen.getByLabelText(/Minimum bid/)).toHaveValue(300);

    const start = siteNow(new Date(Date.now() + 30 * 3_600_000));
    const end = siteNow(new Date(Date.now() + 42 * 3_600_000));
    await user.type(screen.getByLabelText("Starts"), start);
    await user.type(screen.getByLabelText("Ends"), end);
    expect(button).toBeDisabled(); // still needs the acknowledgement
    await user.click(screen.getByRole("checkbox"));
    expect(button).toBeEnabled();

    await user.click(button);
    await waitFor(() =>
      expect(mockDuplicate).toHaveBeenCalledWith("LST-00002", {
        acknowledged: true,
        minBid: 300,
        startTime: start,
        endTime: end,
      }),
    );
  });

  it("shows the time rules and blocks bad times", async () => {
    const user = userEvent.setup();
    setup(DuplicateDialog, { listing: makeAuctionListing("ended", { status: "Archived" }) });
    await user.type(screen.getByLabelText("Starts"), siteNow(new Date(Date.now() + 2 * 3_600_000)));
    await user.type(screen.getByLabelText("Ends"), siteNow(new Date(Date.now() + 3 * 3_600_000)));
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByText(/The auction must start at least 24 hours from now/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duplicate" })).toBeDisabled();
  });
});

describe("HistoryDialog", () => {
  it("lists decisions with who made them, reasons and notes", async () => {
    mockHistory.mockResolvedValue([
      { action: "Resubmitted", reason: null, seller_note: "New photos.", reviewed_on: "2026-10-05 12:00:00", by: "you" },
      { action: "Rejected", reason: "Photos are blurry.", seller_note: null, reviewed_on: "2026-10-04 09:00:00", by: "staff" },
    ]);
    setup(HistoryDialog, { listing: makeMyListing() });
    expect(await screen.findByText("You resubmitted it")).toBeInTheDocument();
    expect(screen.getByText("Rejected by staff")).toBeInTheDocument();
    expect(screen.getByText("Reason: Photos are blurry.")).toBeInTheDocument();
    expect(screen.getByText("Note: New photos.")).toBeInTheDocument();
  });

  it("says when nothing has happened yet", async () => {
    mockHistory.mockResolvedValue([]);
    setup(HistoryDialog, { listing: makeMyListing() });
    expect(await screen.findByText(/No decisions yet/)).toBeInTheDocument();
  });
});
