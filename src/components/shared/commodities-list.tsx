import Link from "next/link";
import { Sprout } from "lucide-react";

import type { CommodityOverview } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  SCROLLABLE_TABLE_CONTAINER_CLASS,
  STICKY_TABLE_HEADER_CLASS,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function fmtMape(v: number | null) {
  return v != null ? `${v.toFixed(2)}%` : "—";
}

export function CommoditiesList({ commodities }: { commodities: CommodityOverview[] }) {
  if (commodities.length === 0) {
    return (
      <EmptyState
        icon={Sprout}
        title="No commodities yet"
        description="Commodities are created by the price-ingestion pipeline, not from this page."
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table containerClassName={SCROLLABLE_TABLE_CONTAINER_CLASS}>
          <TableHeader className={STICKY_TABLE_HEADER_CLASS}>
            <TableRow>
              <TableHead className="pl-4">Commodity</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last evaluated</TableHead>
              <TableHead className="pr-4 text-right">MAPE (1–7d)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commodities.map((commodity) => (
              <TableRow key={commodity.name}>
                <TableCell className="pl-4 font-medium">
                  <Link
                    href={`/admin/commodities/${encodeURIComponent(commodity.name)}`}
                    className="hover:underline"
                  >
                    {commodity.name}
                  </Link>
                </TableCell>
                <TableCell>{commodity.harti_category}</TableCell>
                <TableCell>{commodity.market}</TableCell>
                <TableCell>
                  <Badge variant={commodity.is_active ? "secondary" : "outline"}>
                    {commodity.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {commodity.last_evaluated_on ? formatDate(commodity.last_evaluated_on) : "Not yet evaluated"}
                </TableCell>
                <TableCell className="pr-4 text-right">{fmtMape(commodity.mape_1_7d)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
