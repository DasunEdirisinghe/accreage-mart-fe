import { DISTRICTS } from "@/lib/listing-constants";
import type { SellingType } from "@/types/listing.type";

export const MARKETPLACE_SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

export type MarketplaceSort = (typeof MARKETPLACE_SORTS)[number]["value"];

export interface MarketplaceFilters {
  q?: string;
  /** A Category name (the backend id), as the landing page links it. */
  category?: string;
  district?: string;
  type?: SellingType;
  organic?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  /** A seller's public id (the public seller page). */
  seller?: string;
  sort: MarketplaceSort;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined =>
  (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

const price = (value: string | undefined): number | undefined => {
  if (value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
};

/** Read the page's URL query into filters; anything unknown or invalid is dropped. */
export function parseMarketplaceParams(params: RawParams): MarketplaceFilters {
  const type = first(params.type);
  const district = first(params.district);
  const sort = first(params.sort);
  return {
    q: first(params.q),
    category: first(params.category),
    district: DISTRICTS.find((d) => d === district),
    type: type === "Direct" || type === "Auction" ? type : undefined,
    organic: first(params.organic) === "1" || undefined,
    inStock: first(params.in_stock) === "1" || undefined,
    minPrice: price(first(params.min_price)),
    maxPrice: price(first(params.max_price)),
    seller: first(params.seller),
    sort: MARKETPLACE_SORTS.find((s) => s.value === sort)?.value ?? "newest",
    page: Math.max(1, Math.floor(Number(first(params.page))) || 1),
  };
}

/** The same filters, as a URL query string (defaults left out so URLs stay short). */
export function marketplaceHref(
  filters: Partial<MarketplaceFilters>,
  basePath = "/marketplace",
): string {
  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.category) query.set("category", filters.category);
  if (filters.district) query.set("district", filters.district);
  if (filters.type) query.set("type", filters.type);
  if (filters.organic) query.set("organic", "1");
  if (filters.inStock) query.set("in_stock", "1");
  if (filters.minPrice !== undefined) query.set("min_price", String(filters.minPrice));
  if (filters.maxPrice !== undefined) query.set("max_price", String(filters.maxPrice));
  if (filters.seller) query.set("seller", filters.seller);
  if (filters.sort && filters.sort !== "newest") query.set("sort", filters.sort);
  if (filters.page && filters.page > 1) query.set("page", String(filters.page));
  const text = query.toString();
  return `${basePath}${text ? `?${text}` : ""}`;
}

/** The body for api.marketplace.list_marketplace. */
export function toBackendQuery(filters: MarketplaceFilters, pageSize?: number): Record<string, unknown> {
  return {
    search: filters.q,
    category: filters.category,
    district: filters.district,
    selling_type: filters.type,
    organic: filters.organic ? 1 : undefined,
    in_stock: filters.inStock ? 1 : undefined,
    min_price: filters.minPrice,
    max_price: filters.maxPrice,
    seller: filters.seller,
    sort: filters.sort,
    page: filters.page,
    page_size: pageSize,
  };
}

/** How many filters (other than sort and page) are applied. */
export function activeFilterCount(filters: MarketplaceFilters): number {
  return [
    filters.q,
    filters.category,
    filters.district,
    filters.type,
    filters.organic,
    filters.inStock,
    filters.minPrice,
    filters.maxPrice,
  ].filter((value) => value !== undefined && value !== false && value !== "").length;
}
