import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CommoditiesList } from "@/components/shared/commodities-list";
import { SCROLLABLE_TABLE_CONTAINER_CLASS, STICKY_TABLE_HEADER_CLASS } from "@/components/ui/table";
import type { CommodityOverview } from "@/lib/types";

const rows: CommodityOverview[] = [
  {
    name: "Rice - Nadu 1",
    harti_category: "Rice",
    market: "Pettah",
    is_active: true,
    last_evaluated_on: "2026-09-01",
    mape_1_7d: 4.5,
  },
  {
    name: "Up Country Vegetable - Carrot",
    harti_category: "Vegetables",
    market: "Peliyagoda",
    is_active: false,
    last_evaluated_on: null,
    mape_1_7d: null,
  },
];

describe("CommoditiesList", () => {
  it("lists commodities with their category, market, status and MAPE", () => {
    render(<CommoditiesList commodities={rows} />);
    expect(screen.getByText("Rice - Nadu 1")).toBeInTheDocument();
    expect(screen.getByText("Pettah")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("4.50%")).toBeInTheDocument();
  });

  it("shows placeholders for a commodity never evaluated yet", () => {
    render(<CommoditiesList commodities={rows} />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByText("Not yet evaluated")).toBeInTheDocument();
  });

  it("links each row to its detail page, URL-encoding the name", () => {
    render(<CommoditiesList commodities={rows} />);
    const link = screen.getByRole("link", { name: "Rice - Nadu 1" });
    expect(link).toHaveAttribute("href", "/admin/commodities/Rice%20-%20Nadu%201");
  });

  it("shows an empty state when there are no commodities", () => {
    render(<CommoditiesList commodities={[]} />);
    expect(screen.getByText(/no commodities yet/i)).toBeInTheDocument();
  });

  it("scrolls within itself via the shared scrollable-table recipe, not the whole page", () => {
    render(<CommoditiesList commodities={rows} />);
    const table = screen.getByRole("table");
    // The Table primitive wraps <table> in a div carrying the scroll/max-height classes.
    expect(table.parentElement).toHaveClass(...SCROLLABLE_TABLE_CONTAINER_CLASS.split(" "));
    const headerRow = screen.getByRole("columnheader", { name: "Commodity" });
    const thead = headerRow.closest("thead")!;
    expect(thead).toHaveClass(...STICKY_TABLE_HEADER_CLASS.split(" "));
  });
});
