"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, PackageSearch } from "lucide-react";

import { useDB } from "@/hooks/use-db";
import { PageHeader } from "@/components/shared/page-header";
import { ListingCard } from "@/components/shared/listing-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

function MarketplaceContent() {
  const db = useDB();
  const searchParams = useSearchParams();

  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState(searchParams.get("category") ?? "all");
  const [district, setDistrict] = React.useState("all");
  const [type, setType] = React.useState("all");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [organicOnly, setOrganicOnly] = React.useState(false);
  const [sort, setSort] = React.useState("newest");

  const districts = Array.from(new Set(db.listings.map((l) => l.district))).sort();

  let results = db.listings.filter((l) => l.status === "approved");
  if (query)
    results = results.filter(
      (l) =>
        l.title.toLowerCase().includes(query.toLowerCase()) ||
        l.description.toLowerCase().includes(query.toLowerCase())
    );
  if (category !== "all") results = results.filter((l) => l.categoryId === category);
  if (district !== "all") results = results.filter((l) => l.district === district);
  if (type !== "all") results = results.filter((l) => l.sellingType === type);
  if (organicOnly) results = results.filter((l) => l.organic);
  if (maxPrice)
    results = results.filter(
      (l) => l.sellingType === "auction" || l.pricePerUnit <= Number(maxPrice)
    );

  results = [...results].sort((a, b) => {
    if (sort === "price_asc") return a.pricePerUnit - b.pricePerUnit;
    if (sort === "price_desc") return b.pricePerUnit - a.pricePerUnit;
    if (sort === "rating") {
      const ra = db.sellerProfiles.find((s) => s.id === a.sellerId)?.trustScore ?? 0;
      const rb = db.sellerProfiles.find((s) => s.id === b.sellerId)?.trustScore ?? 0;
      return rb - ra;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="container py-8">
      <PageHeader
        title="Marketplace"
        description="Browse approved wholesale listings from verified agricultural sellers across Sri Lanka."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* filters */}
        <Card className="h-fit lg:sticky lg:top-20">
          <CardContent className="space-y-5 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </p>
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Carrots, rice, cinnamon…"
                  className="pl-8"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {db.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>District</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All districts</SelectItem>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Selling type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Direct & auction</SelectItem>
                  <SelectItem value="direct">Direct only</SelectItem>
                  <SelectItem value="auction">Auction only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max price (LKR/unit)</Label>
              <Input
                type="number"
                placeholder="e.g. 500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="organic">Organic only</Label>
              <Switch id="organic" checked={organicOnly} onCheckedChange={setOrganicOnly} />
            </div>
          </CardContent>
        </Card>

        {/* results */}
        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {results.length} listing{results.length === 1 ? "" : "s"} found
            </p>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="price_asc">Price: low → high</SelectItem>
                <SelectItem value="price_desc">Price: high → low</SelectItem>
                <SelectItem value="rating">Seller rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {results.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No listings match your filters"
              description="Try widening the category, district or price range."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  seller={db.sellerProfiles.find((s) => s.id === l.sellerId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <React.Suspense>
      <MarketplaceContent />
    </React.Suspense>
  );
}
