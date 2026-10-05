"use client";

import * as React from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DISTRICTS } from "@/lib/listing-constants";
import { MARKETPLACE_SORTS, activeFilterCount, type MarketplaceFilters } from "@/lib/marketplace-query";
import type { ListingCategoryOption } from "@/types/listing.type";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

/**
 * The filter form. A plain GET form: every choice becomes part of the URL, so a filtered view can
 * be bookmarked, shared and reloaded, and the page itself stays a server component.
 */
export function MarketplaceFilterForm({
  filters,
  categories,
}: {
  filters: MarketplaceFilters;
  categories: ListingCategoryOption[];
}) {
  const [category, setCategory] = React.useState(filters.category ?? "");
  const [district, setDistrict] = React.useState(filters.district ?? "");

  const categoryOptions = React.useMemo(
    () => [
      { value: "", label: "All categories" },
      ...categories.map((c) => ({ value: c.name, label: c.title, hint: c.area })),
    ],
    [categories],
  );
  const districtOptions = React.useMemo(
    () => [{ value: "", label: "All districts" }, ...DISTRICTS.map((d) => ({ value: d, label: d }))],
    [],
  );
  const applied = activeFilterCount(filters);

  return (
    <Card className="h-fit lg:sticky lg:top-20">
      <CardContent className="p-5">
        <form action="/marketplace" method="get" className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {applied > 0 && <span className="text-xs font-normal text-muted-foreground">({applied})</span>}
            </span>
            {applied > 0 && (
              <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                <Link href="/marketplace">Reset</Link>
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="q">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="q" name="q" defaultValue={filters.q} placeholder="Carrots, rice, eggs…" className="pl-8" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Combobox
              id="category"
              name="category"
              value={category}
              onValueChange={setCategory}
              options={categoryOptions}
              placeholder="All categories"
              searchPlaceholder="Search categories"
              emptyText="No category matches."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Combobox
              id="district"
              name="district"
              value={district}
              onValueChange={setDistrict}
              options={districtOptions}
              placeholder="All districts"
              searchPlaceholder="Search districts"
              emptyText="No district matches."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Selling type</Label>
            <select id="type" name="type" defaultValue={filters.type ?? ""} className={SELECT_CLASS}>
              <option value="">Direct and auction</option>
              <option value="Direct">Direct only</option>
              <option value="Auction">Auction only</option>
            </select>
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Price (LKR per unit)</legend>
            <div className="grid grid-cols-2 gap-2">
              <Input
                name="min_price"
                type="number"
                min={0}
                step="any"
                defaultValue={filters.minPrice}
                placeholder="Min"
                aria-label="Minimum price"
              />
              <Input
                name="max_price"
                type="number"
                min={0}
                step="any"
                defaultValue={filters.maxPrice}
                placeholder="Max"
                aria-label="Maximum price"
              />
            </div>
            <p className="text-xs text-muted-foreground">For an auction, the minimum bid.</p>
          </fieldset>

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="organic" value="1" defaultChecked={filters.organic} />
              Organic only
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="in_stock" value="1" defaultChecked={filters.inStock} />
              In stock only
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort">Sort by</Label>
            <select id="sort" name="sort" defaultValue={filters.sort} className={SELECT_CLASS}>
              {MARKETPLACE_SORTS.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full">Apply filters</Button>
        </form>
      </CardContent>
    </Card>
  );
}
