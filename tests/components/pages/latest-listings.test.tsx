import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/marketplace", () => ({ getMarketplace: vi.fn() }));

import { getMarketplace } from "@/app/actions/marketplace";
import { LatestListings } from "@/components/pages/marketplace/latest-listings";
import { makeAuctionCard, makeCard, makeMarketplace } from "../../helpers/marketplace";

const mockGet = vi.mocked(getMarketplace);

beforeEach(() => vi.clearAllMocks());

describe("LatestListings", () => {
  it("shows a placeholder while loading", () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { container } = render(<LatestListings limit={3} />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it("shows the newest real listings and asks for as many as the limit", async () => {
    mockGet.mockResolvedValue(makeMarketplace([makeCard(), makeAuctionCard()]));
    render(<LatestListings limit={2} />);
    expect(await screen.findByRole("heading", { name: "Fresh Carrots" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Embul Kesel lot" })).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith(expect.objectContaining({ sort: "newest", page: 1 }), 2);
  });

  it("links to real listing pages", async () => {
    mockGet.mockResolvedValue(makeMarketplace([makeCard()]));
    render(<LatestListings />);
    expect(await screen.findByRole("link", { name: /Fresh Carrots/ })).toHaveAttribute("href", "/marketplace/LST-00001");
  });

  it("says so when nothing is published yet", async () => {
    mockGet.mockResolvedValue(makeMarketplace([]));
    render(<LatestListings />);
    await waitFor(() => expect(screen.getByText(/No listings are published yet/)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /Open the marketplace/ })).toHaveAttribute("href", "/marketplace");
  });
});
