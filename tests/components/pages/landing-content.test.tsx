import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { src: string; alt: string }) => <img src={props.src} alt={props.alt} />,
}));

import { LandingContent } from "@/components/pages/landing/landing-content";
import { makeAuctionCard, makeCard } from "../../helpers/marketplace";

const categories = [
  { name: "cat-carrot", title: "Carrot", area: "Vegetables" },
  { name: "cat-banana", title: "Embul Kesel", area: "Fruits" },
];

describe("LandingContent", () => {
  it("features real published listings", () => {
    render(<LandingContent featured={[makeCard({ title: "Fresh Carrots" })]} auctions={[]} categories={categories} categoryCount={48} />);
    expect(screen.getByRole("heading", { name: "Fresh Carrots" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Fresh Carrots/ })).toHaveAttribute("href", "/marketplace/LST-00001");
  });

  it("says so when nothing is published yet", () => {
    render(<LandingContent featured={[]} auctions={[]} categories={categories} categoryCount={48} />);
    expect(screen.getByText("Published listings will be featured here.")).toBeInTheDocument();
    expect(screen.getByText("No auctions are scheduled right now.")).toBeInTheDocument();
  });

  it("links each category to the marketplace filtered by its id", () => {
    render(<LandingContent featured={[]} auctions={[]} categories={categories} categoryCount={48} />);
    expect(screen.getByRole("link", { name: /Carrot/ })).toHaveAttribute("href", "/marketplace?category=cat-carrot");
    expect(screen.getByRole("link", { name: /Embul Kesel/ })).toHaveAttribute("href", "/marketplace?category=cat-banana");
  });

  it("shows real auctions in the teaser, linking to their listing pages", () => {
    render(<LandingContent featured={[]} auctions={[makeAuctionCard("live")]} categories={categories} categoryCount={48} />);
    const link = screen.getByRole("link", { name: /Embul Kesel lot/ });
    expect(link).toHaveAttribute("href", "/marketplace/LST-00002");
    expect(link).toHaveTextContent("Live now");
    expect(link).toHaveTextContent("Rs. 180");
  });

  it("shows the real number of categories in the stats band", () => {
    render(<LandingContent featured={[]} auctions={[]} categories={categories} categoryCount={48} />);
    expect(screen.getByText("Produce categories").previousSibling).toHaveTextContent("48");
  });

  it("keeps the fallback figure when the categories could not be loaded", () => {
    render(<LandingContent featured={[]} auctions={[]} categories={[]} categoryCount={0} />);
    expect(screen.getByText("Produce categories").previousSibling).toHaveTextContent("8");
  });

  it("points 'view all auctions' at the filtered marketplace", () => {
    render(<LandingContent featured={[]} auctions={[]} categories={categories} categoryCount={48} />);
    expect(screen.getByRole("link", { name: /View all auctions/ })).toHaveAttribute("href", "/marketplace?type=Auction");
  });

  it("never nests a block element in a paragraph", () => {
    const { container } = render(
      <LandingContent featured={[makeCard()]} auctions={[makeAuctionCard("scheduled")]} categories={categories} categoryCount={48} />,
    );
    expect(container.querySelectorAll("p div, p ul, p ol, p table, p h1, p h2, p p")).toHaveLength(0);
  });
});
