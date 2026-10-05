import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ListingUnavailable, PublicListingDetail } from "@/components/pages/marketplace/public-listing-detail";
import { makeAuctionCard, makePublicListing, makeResponse } from "../../helpers/marketplace";

const auctionListing = (status = "scheduled") =>
  makePublicListing({
    selling_type: "Auction",
    price_per_unit: null,
    min_order_qty: null,
    quantity_available: 900,
    title: "Embul Kesel lot",
    auction: makeAuctionCard(status).auction,
  });

describe("PublicListingDetail: a Direct listing", () => {
  it("shows the listing in full", () => {
    render(<PublicListingDetail data={makeResponse()} />);
    expect(screen.getByRole("heading", { level: 1, name: "Fresh Carrots" })).toBeInTheDocument();
    expect(screen.getByText(/Grade A carrots\./)).toBeInTheDocument();
    expect(screen.getByText(/Nuwara Eliya market, Nuwara Eliya district/)).toBeInTheDocument();
    expect(screen.getByText("Carrot")).toBeInTheDocument();
    expect(screen.getByText("Direct sale")).toBeInTheDocument();
    expect(screen.getByText("Organic")).toBeInTheDocument();
    expect(screen.getByText("SLS organic 1234")).toBeInTheDocument();
  });

  it("shows the wholesale price, stock and minimum order", () => {
    render(<PublicListingDetail data={makeResponse()} />);
    expect(screen.getByText("Wholesale price")).toBeInTheDocument();
    expect(screen.getByText(/Rs\. 150/)).toBeInTheDocument();
    expect(screen.getByText("In stock")).toBeInTheDocument();
    expect(screen.getByText("Min. order").nextSibling).toHaveTextContent("25 kg");
  });

  it("links the map pin to Google Maps", () => {
    render(<PublicListingDetail data={makeResponse()} />);
    expect(screen.getByRole("link", { name: /View on Google Maps/ })).toHaveAttribute("href", "https://www.google.com/maps?q=6.97,80.77");
  });

  it("has no map link without a pin, and no certification for a non-organic listing", () => {
    render(<PublicListingDetail data={makeResponse({ listing: makePublicListing({ map_url: null, organic: false, certification: null }) })} />);
    expect(screen.queryByRole("link", { name: /Google Maps/ })).not.toBeInTheDocument();
    expect(screen.queryByText("SLS organic 1234")).not.toBeInTheDocument();
  });

  it("cannot be ordered yet, and says so", () => {
    render(<PublicListingDetail data={makeResponse()} />);
    expect(screen.getByRole("button", { name: "Ordering opens soon" })).toBeDisabled();
  });

  it("shows out of stock and disables the button", () => {
    render(<PublicListingDetail data={makeResponse({ accepting_orders: false, listing: makePublicListing({ in_stock: false, quantity_available: 0 }) })} />);
    expect(screen.getAllByText("Out of stock").length).toBeGreaterThanOrEqual(2); // the badge and the button
    expect(screen.getByRole("button", { name: "Out of stock" })).toBeDisabled();
  });
});

describe("PublicListingDetail: photos", () => {
  it("shows the cover first and lets the visitor step through the rest", async () => {
    const user = userEvent.setup();
    render(<PublicListingDetail data={makeResponse()} />);
    expect(screen.getByRole("img", { name: "Fresh Carrots" })).toHaveAttribute("src", expect.stringContaining("/files/lst-a.png"));
    await user.click(screen.getByRole("button", { name: "Show photo 2 of 2" }));
    expect(screen.getByRole("img", { name: "Fresh Carrots" })).toHaveAttribute("src", expect.stringContaining("/files/lst-b.png"));
  });

  it("has no thumbnails for a single photo", () => {
    render(<PublicListingDetail data={makeResponse({ listing: makePublicListing({ images: [{ url: "/files/lst-a.png", is_cover: true }] }) })} />);
    expect(screen.queryByRole("button", { name: /Show photo/ })).not.toBeInTheDocument();
  });
});

describe("PublicListingDetail: an Auction listing", () => {
  it("shows the minimum bid, times and that bidding opens soon", () => {
    render(<PublicListingDetail data={makeResponse({ accepting_orders: false, listing: auctionListing() })} />);
    expect(screen.getByText("Auction listing")).toBeInTheDocument();
    expect(screen.getByText(/From Rs\. 180/)).toBeInTheDocument();
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText("Starts")).toBeInTheDocument();
    expect(screen.getByText("Ends")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bidding opens soon/ })).toBeDisabled();
    expect(screen.getByText(/whole lot to the winner/)).toBeInTheDocument();
  });

  it("shows the lot, not a minimum order", () => {
    render(<PublicListingDetail data={makeResponse({ listing: auctionListing() })} />);
    expect(screen.getByText("Lot").nextSibling).toHaveTextContent("900 kg");
    expect(screen.queryByText("Min. order")).not.toBeInTheDocument();
  });

  it("marks a running auction as live", () => {
    render(<PublicListingDetail data={makeResponse({ listing: auctionListing("live") })} />);
    expect(screen.getByText("Live now")).toBeInTheDocument();
  });
});

describe("PublicListingDetail: the seller", () => {
  it("links to the seller's public page by their opaque id, never an email", () => {
    const { container } = render(<PublicListingDetail data={makeResponse()} />);
    const links = screen.getAllByRole("link", { name: /Test Farms|View seller profile/ });
    for (const link of links) expect(link).toHaveAttribute("href", "/sellers/abc123");
    expect(container.innerHTML).not.toContain("@");
  });

  it("shows the trust score", () => {
    render(<PublicListingDetail data={makeResponse()} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("trust score")).toBeInTheDocument();
  });
});

describe("PublicListingDetail: availability messages", () => {
  it("shows only the message when the viewer isn't allowed to see the listing", () => {
    render(
      <PublicListingDetail
        data={makeResponse({ availability: "hidden", accepting_orders: false, listing: null, message: "This listing is temporarily unavailable." })}
      />,
    );
    expect(screen.getByText("This listing is temporarily unavailable.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to marketplace" })).toHaveAttribute("href", "/marketplace");
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("has wording for suspended and archived listings too", () => {
    const { rerender } = render(<ListingUnavailable message="This listing is unavailable." />);
    expect(screen.getByText("This listing is unavailable.")).toBeInTheDocument();
    rerender(<ListingUnavailable message="This listing is no longer available." />);
    expect(screen.getByText("This listing is no longer available.")).toBeInTheDocument();
    rerender(<ListingUnavailable message={null} />);
    expect(screen.getByText("This listing is unavailable.")).toBeInTheDocument();
  });

  it("shows the listing with a message for a buyer who has an order on it", () => {
    render(
      <PublicListingDetail
        data={makeResponse({
          availability: "hidden",
          accepting_orders: false,
          viewer: "order_holder",
          message: "This listing is temporarily unavailable. Your order is not affected.",
        })}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Your order is not affected.");
    expect(screen.getByRole("heading", { level: 1, name: "Fresh Carrots" })).toBeInTheDocument();
  });

  it("tells the owner their own listing is pending, with a link back to My listings", () => {
    render(
      <PublicListingDetail
        data={makeResponse({
          availability: "pending",
          accepting_orders: false,
          viewer: "owner",
          message: "Waiting for staff approval. Buyers can't see this listing yet.",
        })}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Waiting for staff approval");
    expect(within(screen.getByRole("status")).getByRole("link", { name: "My listings" })).toHaveAttribute("href", "/seller/listings");
  });

  it("gives staff a link to the review page", () => {
    render(
      <PublicListingDetail
        data={makeResponse({ availability: "pending", accepting_orders: false, viewer: "staff", message: "Waiting for staff approval." })}
      />,
    );
    expect(screen.getByRole("link", { name: "Open in review" })).toHaveAttribute("href", "/admin/approvals/LST-00001");
  });

  it("shows no banner for an ordinary published listing", () => {
    render(<PublicListingDetail data={makeResponse()} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("never nests a block element in a paragraph", () => {
    const { container } = render(<PublicListingDetail data={makeResponse({ listing: auctionListing("live") })} />);
    expect(container.querySelectorAll("p div, p ul, p ol, p table, p h1, p h2, p p")).toHaveLength(0);
  });
});
