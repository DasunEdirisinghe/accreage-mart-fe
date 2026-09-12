import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { Commodity, ForecastPoint } from "@/lib/types";
import { formatDate, formatLKR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ForecastChart } from "@/components/shared/forecast-chart";

function fmtMape(v: number | null) {
  return v != null ? `${v.toFixed(2)}%` : "—";
}

function toForecastPoints(commodity: Commodity): ForecastPoint[] {
  return commodity.forecast_days.map((day) => ({
    ds: day.forecast_date,
    yhat: day.predicted_price,
    yhatLower: day.lower_bound,
    yhatUpper: day.upper_bound,
  }));
}

function Field({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** `today` is passed in (not computed here) so the "today" row highlight is deterministic
 * and testable — it's the page's job to supply it. */
export function CommodityDetailView({ commodity, today }: { commodity: Commodity; today: string }) {
  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/commodities">
          <ArrowLeft className="mr-2 size-4" />
          Back to commodities
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {commodity.name}
            <Badge variant={commodity.is_active ? "secondary" : "outline"}>
              {commodity.is_active ? "Active" : "Inactive"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Field label="Category" value={commodity.harti_category} />
            <Field label="Market" value={commodity.market} />
            <Field label="Unit" value={commodity.unit || "—"} />
            <Field
              label="Last evaluated"
              value={commodity.last_evaluated_on ? formatDate(commodity.last_evaluated_on) : "Not yet evaluated"}
            />
            <Field label="MAPE 1–7d" value={fmtMape(commodity.mape_1_7d)} sub={`n=${commodity.sample_size_1_7d}`} />
            <Field label="MAPE 8–14d" value={fmtMape(commodity.mape_8_14d)} sub={`n=${commodity.sample_size_8_14d}`} />
            <Field label="MAPE 15–30d" value={fmtMape(commodity.mape_15_30d)} sub={`n=${commodity.sample_size_15_30d}`} />
          </div>
          <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
            MAPE (Mean Absolute Percentage Error) is the average forecast error: lower is better.
            n is the sample size behind each score, i.e. how many forecast-vs-actual comparisons it's based on.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Forecast chart</CardTitle>
        </CardHeader>
        <CardContent>
          {commodity.forecast_days.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No forecast yet — this commodity hasn&apos;t been evaluated by the pricing pipeline.
            </p>
          ) : (
            <ForecastChart forecast={{ points: toForecastPoints(commodity) }} highlightDate={today} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>30-day forecast</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {commodity.forecast_days.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              No forecast yet — this commodity hasn&apos;t been evaluated by the pricing pipeline.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Predicted</TableHead>
                  <TableHead>Lower bound</TableHead>
                  <TableHead className="pr-4">Upper bound</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commodity.forecast_days.map((day) => {
                  const isToday = day.forecast_date === today;
                  return (
                    <TableRow
                      key={day.forecast_date}
                      data-today={isToday}
                      className={isToday ? "bg-secondary" : undefined}
                    >
                      <TableCell className="pl-4 font-medium">
                        {formatDate(day.forecast_date)}
                        {isToday && <span className="ml-2 text-xs text-muted-foreground">(today)</span>}
                      </TableCell>
                      <TableCell>+{day.horizon_days_ahead}d</TableCell>
                      <TableCell>{formatLKR(day.predicted_price)}</TableCell>
                      <TableCell>{formatLKR(day.lower_bound)}</TableCell>
                      <TableCell className="pr-4">{formatLKR(day.upper_bound)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
