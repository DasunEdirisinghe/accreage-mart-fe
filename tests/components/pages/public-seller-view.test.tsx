import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicSellerView } from "@/components/pages/marketplace/public-seller-view";
import { makeAuctionCard, makeCard, makeMarketplace, makeSeller } from "../../helpers/marketplace";

describe("PublicSellerView", () => {
  it("shows the seller's public card", () => {
    render(<PublicSellerView seller={makeSeller()} listings={makeMarketplace()} />);
    expect(screen.getByRole("heading", { level: 1, name: /Test Farms/ })).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText(/Kandy district/)).toBeInTheDocument();
    expect(screen.getByText(/Member since/)).toBeInTheDocument();
    expect(screen.getByText("3 live listings")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("Family farm growing upcountry vegetables.")).toBeInTheDocument();
  });

  it("says '1 live listing' in the singular", () => {
    render(<PublicSellerView seller={makeSeller({ live_listing_count: 1 })} listings={makeMarketplace()} />);
    expect(screen.getByText("1 live listing")).toBeInTheDocument();
  });

  it("leaves out the About section when there is no description", () => {
    render(<PublicSellerView seller={makeSeller({ description: null })} listings={makeMarketplace()} />);
    expect(screen.queryByText("About")).not.toBeInTheDocument();
  });

  it("lists their published listings, both types", () => {
    render(<PublicSellerView seller={makeSeller()} listings={makeMarketplace([makeCard(), makeAuctionCard()], { total: 2 })} />);
    expect(screen.getByRole("heading", { name: "Fresh Carrots" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Embul Kesel lot" })).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();
  });

  it("says when there are no live listings", () => {
    render(<PublicSellerView seller={makeSeller({ live_listing_count: 0 })} listings={makeMarketplace([], { total: 0 })} />);
    expect(screen.getByText("No live listings")).toBeInTheDocument();
  });

  it("pages within the seller's own address", () => {
    render(<PublicSellerView seller={makeSeller()} listings={makeMarketplace([makeCard()], { page: 2, has_more: true })} />);
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/sellers/abc123");
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/sellers/abc123?page=3");
  });

  it("never shows an email address", () => {
    const { container } = render(<PublicSellerView seller={makeSeller()} listings={makeMarketplace()} />);
    expect(container.innerHTML).not.toContain("@");
  });

  it("never nests a block element in a paragraph", () => {
    const { container } = render(<PublicSellerView seller={makeSeller()} listings={makeMarketplace([makeAuctionCard()])} />);
    expect(container.querySelectorAll("p div, p ul, p ol, p table, p h1, p h2, p p")).toHaveLength(0);
  });
});
