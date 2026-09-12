import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CommodityDetailView } from "@/components/shared/commodity-detail-view";
import type { Commodity } from "@/lib/types";

const baseCommodity: Commodity = {
  name: "Rice - Nadu 1",
  harti_category: "Rice",
  market: "Pettah",
  unit: "kg",
  is_active: true,
  mape_1_7d: 4.5,
  mape_8_14d: 6.2,
  mape_15_30d: 9.1,
  sample_size_1_7d: 12,
  sample_size_8_14d: 12,
  sample_size_15_30d: 12,
  last_evaluated_on: "2026-09-01",
  forecast_days: [
    { forecast_date: "2026-09-12", horizon_days_ahead: 1, predicted_price: 210, lower_bound: 190, upper_bound: 230 },
    { forecast_date: "2026-09-13", horizon_days_ahead: 2, predicted_price: 212, lower_bound: 192, upper_bound: 232 },
  ],
};

describe("CommodityDetailView", () => {
  it("renders every commodity field", () => {
    render(<CommodityDetailView commodity={baseCommodity} today="2026-09-12" />);
    expect(screen.getByText("Rice - Nadu 1")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
    expect(screen.getByText("Pettah")).toBeInTheDocument();
    expect(screen.getByText("kg")).toBeInTheDocument();
    expect(screen.getByText("4.50%")).toBeInTheDocument();
    expect(screen.getByText("6.20%")).toBeInTheDocument();
    expect(screen.getByText("9.10%")).toBeInTheDocument();
  });

  it("renders the forecast table with a row per forecast day", () => {
    render(<CommodityDetailView commodity={baseCommodity} today="2026-09-12" />);
    expect(screen.getAllByText(/^Rs\./).length).toBeGreaterThanOrEqual(6); // 2 rows x 3 price cols
  });

  it("marks today's row and only today's row", () => {
    const { container } = render(<CommodityDetailView commodity={baseCommodity} today="2026-09-12" />);
    const todayRows = container.querySelectorAll('[data-today="true"]');
    expect(todayRows).toHaveLength(1);
    expect(todayRows[0]).toHaveTextContent("(today)");
  });

  it("renders no highlighted row when today isn't in the forecast window", () => {
    const { container } = render(<CommodityDetailView commodity={baseCommodity} today="2020-01-01" />);
    expect(container.querySelectorAll('[data-today="true"]')).toHaveLength(0);
  });

  it("renders an empty-state message, not an error, when there's no forecast yet", () => {
    const noForecast: Commodity = { ...baseCommodity, forecast_days: [] };
    render(<CommodityDetailView commodity={noForecast} today="2026-09-12" />);
    // Once in the chart card, once in the raw-table card — both must fall back cleanly.
    expect(screen.getAllByText(/no forecast yet/i)).toHaveLength(2);
  });

  it("renders a forecast chart section after the general info card, before the raw table", () => {
    render(<CommodityDetailView commodity={baseCommodity} today="2026-09-12" />);
    const generalInfoTitle = screen.getByText("Rice - Nadu 1");
    const chartTitle = screen.getByText("Forecast chart");
    const tableTitle = screen.getByText("30-day forecast");
    expect(
      generalInfoTitle.compareDocumentPosition(chartTitle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(chartTitle.compareDocumentPosition(tableTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("does not render a chart when there's no forecast yet", () => {
    const noForecast: Commodity = { ...baseCommodity, forecast_days: [] };
    const { container } = render(<CommodityDetailView commodity={noForecast} today="2026-09-12" />);
    expect(container.querySelector(".recharts-wrapper")).not.toBeInTheDocument();
  });

  it("shows placeholders for a commodity never evaluated yet", () => {
    const unevaluated: Commodity = {
      ...baseCommodity,
      mape_1_7d: null,
      mape_8_14d: null,
      mape_15_30d: null,
      last_evaluated_on: null,
      forecast_days: [],
    };
    render(<CommodityDetailView commodity={unevaluated} today="2026-09-12" />);
    expect(screen.getByText("Not yet evaluated")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });
});
