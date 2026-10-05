import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicListingCard } from "@/components/pages/marketplace/public-listing-card";
import { makeAuctionCard, makeCard } from "../../helpers/marketplace";

describe("PublicListingCard: a Direct listing", () => {
  it("links to the listing's page and shows the essentials", () => {
    render(<PublicListingCard listing={makeCard()} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/marketplace/LST-00001");
    expect(screen.getByRole("heading", { name: "Fresh Carrots" })).toBeInTheDocument();
    expect(screen.getByText("Direct")).toBeInTheDocument();
    expect(screen.getByText(/Nuwara Eliya market, Nuwara Eliya/)).toBeInTheDocument();
    expect(screen.getByText("Test Farms")).toBeInTheDocument();
    expect(screen.getByText(/Rs\. 150/)).toBeInTheDocument();
    expect(screen.getByText("400 kg available")).toBeInTheDocument();
  });

  it("shows the cover photo when there is one, and a placeholder when there isn't", () => {
    const { container, rerender } = render(<PublicListingCard listing={makeCard({ cover_image: "/files/lst-a.png" })} />);
    expect(container.querySelector("img")).toHaveAttribute("src", expect.stringContaining("/files/lst-a.png"));
    rerender(<PublicListingCard listing={makeCard({ cover_image: null })} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("flags organic and out-of-stock listings", () => {
    render(<PublicListingCard listing={makeCard({ organic: true, in_stock: false, quantity_available: 0 })} />);
    expect(screen.getByText("Organic")).toBeInTheDocument();
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });

  it("does not flag stock on a normal listing", () => {
    render(<PublicListingCard listing={makeCard()} />);
    expect(screen.queryByText("Out of stock")).not.toBeInTheDocument();
    expect(screen.queryByText("Organic")).not.toBeInTheDocument();
  });
});

describe("PublicListingCard: an Auction listing", () => {
  it("shows the minimum bid, the phase and that bidding opens soon", () => {
    render(<PublicListingCard listing={makeAuctionCard("scheduled")} />);
    expect(screen.getByText("Auction")).toBeInTheDocument();
    expect(screen.getByText(/From Rs\. 180/)).toBeInTheDocument();
    expect(screen.getByText(/Scheduled · starts/)).toBeInTheDocument();
    expect(screen.getByText(/Bidding opens soon/)).toBeInTheDocument();
  });

  it("says a running auction is live, without a start time", () => {
    render(<PublicListingCard listing={makeAuctionCard("live")} />);
    expect(screen.getByText(/Live now/)).toBeInTheDocument();
    expect(screen.queryByText(/starts/)).not.toBeInTheDocument();
  });

  it("does not show a fixed price or a stock line for an auction", () => {
    render(<PublicListingCard listing={makeAuctionCard()} />);
    expect(screen.queryByText(/available/)).not.toBeInTheDocument();
    expect(screen.queryByText("Out of stock")).not.toBeInTheDocument();
  });
});

describe("PublicListingCard: valid HTML", () => {
  it("never nests a block element in a paragraph", () => {
    const { container } = render(
      <>
        <PublicListingCard listing={makeCard({ organic: true, in_stock: false })} />
        <PublicListingCard listing={makeAuctionCard()} />
      </>,
    );
    expect(container.querySelectorAll("p div, p ul, p ol, p table, p h1, p h2, p p")).toHaveLength(0);
  });
});
