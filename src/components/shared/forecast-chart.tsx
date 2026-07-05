"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { CategoryForecast } from "@/lib/types";

/**
 * Prophet-style forecast chart: actual history, yhat forecast line and the
 * 90% prediction interval band. Mirrors Figure 3.12 of the interim report.
 */
export function ForecastChart({ forecast, height = 280 }: { forecast: CategoryForecast; height?: number }) {
  const data = forecast.points.map((p) => ({
    ds: p.ds.slice(5), // MM-DD
    actual: p.actual,
    yhat: p.yhat,
    band: [p.yhatLower, p.yhatUpper] as [number, number],
  }));
  const todayIdx = forecast.points.findIndex((p) => p.actual === undefined);
  const todayLabel = todayIdx > 0 ? data[todayIdx - 1].ds : undefined;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 12% 90%)" />
        <XAxis dataKey="ds" tick={{ fontSize: 10 }} interval={13} />
        <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
        <Tooltip
          formatter={(value: number | [number, number], name: string) => {
            if (Array.isArray(value))
              return [`${value[0]} – ${value[1]}`, "90% interval"];
            return [`Rs. ${value}`, name === "actual" ? "Actual" : "Forecast"];
          }}
          labelFormatter={(l) => `Date: ${l}`}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Area
          dataKey="band"
          stroke="none"
          fill="hsl(146 55% 24%)"
          fillOpacity={0.12}
          isAnimationActive={false}
        />
        <Line
          dataKey="actual"
          stroke="hsl(150 12% 30%)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          dataKey="yhat"
          stroke="hsl(146 55% 32%)"
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={false}
          isAnimationActive={false}
        />
        {todayLabel && (
          <ReferenceLine
            x={todayLabel}
            stroke="hsl(38 92% 45%)"
            strokeDasharray="4 4"
            label={{ value: "today", fontSize: 10, fill: "hsl(38 92% 35%)", position: "top" }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
