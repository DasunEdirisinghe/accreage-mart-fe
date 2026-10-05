"use client";

import * as React from "react";
import { AlertTriangle, Gavel, Info, Loader2, ShoppingCart } from "lucide-react";

import { createListing, updateListing } from "@/app/actions/listings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/pages/listings/image-uploader";
import { LocationPicker } from "@/components/pages/listings/location-picker";
import { PriceSuggestionBox } from "@/components/pages/listings/price-suggestion-box";
import {
  DISTRICTS,
  MAX_AUCTION_HOURS,
  MIN_AUCTION_HOURS,
  MIN_START_GAP_HOURS,
  TITLE_MAX,
  UNITS,
} from "@/lib/listing-constants";
import type { EditRestriction } from "@/lib/listing-edit";
import { hoursBetween, siteNow, validateAuctionTimes } from "@/lib/listing-time";
import { cn } from "@/lib/utils";
import type {
  ListingCategoryOption,
  ListingFormState,
  ListingFormValues,
  SellingType,
} from "@/types/listing.type";

const EMPTY: ListingFormValues = {
  selling_type: "Direct",
  category: "",
  title: "",
  description: "",
  unit: "kg",
  quantity_available: "",
  price_per_unit: "",
  min_order_qty: "",
  low_stock_level: "",
  district: "",
  location: "",
  latitude: "",
  longitude: "",
  organic: false,
  certification: "",
  images: [],
  min_bid: "",
  start_time: "",
  end_time: "",
  auction_terms_acknowledged: false,
};

const OPEN: EditRestriction = {
  canEdit: true,
  termsLocked: false,
  lotLocked: false,
  termsChangeSendsToReview: false,
};

interface ListingFormProps {
  mode: "create" | "edit";
  categories: ListingCategoryOption[];
  initial?: ListingFormValues;
  /** Required in edit mode. */
  listingName?: string;
  restriction?: EditRestriction;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

export function ListingForm({
  mode,
  categories,
  initial = EMPTY,
  listingName,
  restriction = OPEN,
}: ListingFormProps) {
  const action = React.useMemo(
    () => (mode === "edit" && listingName ? updateListing.bind(null, listingName) : createListing),
    [mode, listingName],
  );
  const [state, formAction, pending] = React.useActionState<ListingFormState, FormData>(action, {});
  const [values, setValues] = React.useState<ListingFormValues>(initial);

  const set = <K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const onText =
    (key: keyof ListingFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      set(key, event.target.value as never);

  const errors = state.errors ?? {};
  const first = (key: keyof ListingFormValues) => errors[key]?.[0];

  const isAuction = values.selling_type === "Auction";
  const editing = mode === "edit";
  const minStart = React.useMemo(() => siteNow(), []);

  const timeIssues =
    isAuction && values.start_time && values.end_time && !restriction.termsLocked
      ? validateAuctionTimes(values.start_time, values.end_time)
      : {};
  const duration =
    values.start_time && values.end_time ? hoursBetween(values.start_time, values.end_time) : null;

  const categoryOptions = React.useMemo(
    () => categories.map((c) => ({ value: c.name, label: c.title, hint: c.area })),
    [categories],
  );
  const districtOptions = DISTRICTS.map((d) => ({ value: d, label: d }));

  const typeOptions: { value: SellingType; icon: typeof Gavel; title: string; text: string }[] = [
    { value: "Direct", icon: ShoppingCart, title: "Direct sale", text: "Fixed wholesale price, buyers order directly" },
    { value: "Auction", icon: Gavel, title: "Auction", text: "Buyers bid; the highest bid wins the whole lot" },
  ];

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      <input type="hidden" name="selling_type" value={values.selling_type} />
      <input type="hidden" name="images" value={JSON.stringify(values.images)} />
      <input type="hidden" name="organic" value={values.organic ? "on" : ""} />

      <div className="space-y-6">
        {restriction.banner && (
          <div
            role="status"
            className={cn(
              "flex gap-2 rounded-md border p-3 text-sm",
              restriction.banner.tone === "warning"
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-primary/30 bg-secondary text-secondary-foreground",
            )}
          >
            {restriction.banner.tone === "warning" ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{restriction.banner.text}</p>
          </div>
        )}
        {state.message && (
          <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {state.message}
          </div>
        )}

        {/* selling type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Selling type *</CardTitle>
            <CardDescription>
              {editing ? "The selling type can't be changed after a listing is created." : "How do you want to sell this lot?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={editing}
                aria-pressed={values.selling_type === option.value}
                onClick={() => set("selling_type", option.value)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-left transition-colors disabled:cursor-not-allowed",
                  values.selling_type === option.value
                    ? "border-primary bg-secondary"
                    : "border-border hover:border-primary/40 disabled:opacity-50",
                )}
              >
                <option.icon className="mb-1 h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">{option.title}</span>
                <span className="text-xs text-muted-foreground">{option.text}</span>
              </button>
            ))}
            <FieldError message={first("selling_type")} />
          </CardContent>
        </Card>

        {/* product */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Product details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Combobox
                id="category"
                name="category"
                value={values.category}
                onValueChange={(value) => set("category", value)}
                options={categoryOptions}
                placeholder="Select a category"
                searchPlaceholder="Search categories"
                emptyText="No category matches."
                invalid={Boolean(first("category"))}
              />
              <FieldError message={first("category")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={values.title}
                onChange={onText("title")}
                maxLength={TITLE_MAX}
                placeholder="e.g. Fresh Carrots, Grade A (Upcountry)"
              />
              <FieldError message={first("title")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                value={values.description}
                onChange={onText("description")}
                placeholder="Grade, harvest date, storage, delivery notes…"
              />
              <FieldError message={first("description")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                {restriction.lotLocked && <input type="hidden" name="unit" value={values.unit} />}
                <select
                  id="unit"
                  name={restriction.lotLocked ? undefined : "unit"}
                  value={values.unit}
                  onChange={onText("unit")}
                  disabled={restriction.lotLocked}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                <FieldError message={first("unit")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity_available">
                  {isAuction ? "Lot quantity *" : "Available quantity *"}
                </Label>
                <Input
                  id="quantity_available"
                  name="quantity_available"
                  type="number"
                  min={0}
                  step="any"
                  value={values.quantity_available}
                  onChange={onText("quantity_available")}
                  readOnly={restriction.lotLocked}
                  placeholder="e.g. 2000"
                />
                {isAuction && (
                  <p className="text-xs text-muted-foreground">The winner takes the whole lot.</p>
                )}
                <FieldError message={first("quantity_available")} />
              </div>
            </div>

            {!isAuction && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min_order_qty">
                    Minimum order quantity <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="min_order_qty"
                    name="min_order_qty"
                    type="number"
                    min={0}
                    step="any"
                    value={values.min_order_qty}
                    onChange={onText("min_order_qty")}
                    placeholder="Defaults to 1"
                  />
                  <FieldError message={first("min_order_qty")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="low_stock_level">
                    Low-stock alert level <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="low_stock_level"
                    name="low_stock_level"
                    type="number"
                    min={0}
                    step="any"
                    value={values.low_stock_level}
                    onChange={onText("low_stock_level")}
                    placeholder="Email me when stock drops below this"
                  />
                  <FieldError message={first("low_stock_level")} />
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="district">District *</Label>
                <Combobox
                  id="district"
                  name="district"
                  value={values.district}
                  onValueChange={(value) => set("district", value)}
                  options={districtOptions}
                  placeholder="Select a district"
                  searchPlaceholder="Search districts"
                  emptyText="No district matches."
                  invalid={Boolean(first("district"))}
                />
                <FieldError message={first("district")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  value={values.location}
                  onChange={onText("location")}
                  placeholder="e.g. Nuwara Eliya town, Market Road"
                />
                <FieldError message={first("location")} />
              </div>
            </div>
            <LocationPicker
              latitude={values.latitude}
              longitude={values.longitude}
              onChange={(latitude, longitude) => setValues((c) => ({ ...c, latitude, longitude }))}
              error={first("latitude")}
            />

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="organic" className="text-sm font-medium">Organic produce</Label>
                <p className="text-xs text-muted-foreground">Grown without synthetic inputs</p>
              </div>
              <Switch id="organic" checked={values.organic} onCheckedChange={(checked) => set("organic", checked)} />
            </div>
            {values.organic && (
              <div className="space-y-2">
                <Label htmlFor="certification">Certification details *</Label>
                <Input
                  id="certification"
                  name="certification"
                  value={values.certification}
                  onChange={onText("certification")}
                  placeholder="Certifying body and certificate number"
                />
                <FieldError message={first("certification")} />
              </div>
            )}

            <ImageUploader
              images={values.images}
              onChange={(images) => set("images", images)}
              error={first("images")}
            />
          </CardContent>
        </Card>

        {/* auction terms */}
        {isAuction && (
          <Card className="border-accent/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gavel className="h-4 w-4 text-accent-foreground" /> Auction terms *
              </CardTitle>
              <CardDescription>Times are Sri Lanka time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="min_bid">Minimum bid (LKR per {values.unit}) *</Label>
                  <Input
                    id="min_bid"
                    name="min_bid"
                    type="number"
                    min={0}
                    step="any"
                    value={values.min_bid}
                    onChange={onText("min_bid")}
                    readOnly={restriction.termsLocked}
                    placeholder="e.g. 300"
                  />
                  <FieldError message={first("min_bid")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_time">Starts *</Label>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="datetime-local"
                    min={minStart}
                    value={values.start_time}
                    onChange={onText("start_time")}
                    readOnly={restriction.termsLocked}
                  />
                  <FieldError message={first("start_time") ?? timeIssues.start_time} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">Ends *</Label>
                  <Input
                    id="end_time"
                    name="end_time"
                    type="datetime-local"
                    value={values.end_time}
                    onChange={onText("end_time")}
                    readOnly={restriction.termsLocked}
                  />
                  <FieldError message={first("end_time") ?? timeIssues.end_time} />
                </div>
              </div>
              {duration !== null && duration > 0 && (
                <p className="text-xs text-muted-foreground">Duration: {Math.round(duration * 10) / 10} hours</p>
              )}

              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="mb-1 font-semibold">Auction rules</p>
                <ul className="list-disc space-y-1 pl-5 text-xs">
                  <li>An auction must start at least {MIN_START_GAP_HOURS} hours from now, so staff can review it.</li>
                  <li>It must run for {MIN_AUCTION_HOURS} to {MAX_AUCTION_HOURS} hours (up to 2 days).</li>
                  <li>
                    <strong>Once an auction has started, you cannot stop it without contacting staff.</strong> Once any
                    bid has been placed, not even staff can stop it.
                  </li>
                </ul>
                {!editing && (
                  <label className="mt-3 flex items-start gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      name="auction_terms_acknowledged"
                      checked={values.auction_terms_acknowledged}
                      onChange={(event) => set("auction_terms_acknowledged", event.target.checked)}
                      className="mt-0.5"
                    />
                    <span>I understand these rules.</span>
                  </label>
                )}
                <FieldError message={first("auction_terms_acknowledged")} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* sidebar */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAuction ? "Reference price" : "Pricing"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAuction && (
              <div className="space-y-2">
                <Label htmlFor="price_per_unit">Price per {values.unit} (LKR) *</Label>
                <Input
                  id="price_per_unit"
                  name="price_per_unit"
                  type="number"
                  min={0}
                  step="any"
                  value={values.price_per_unit}
                  onChange={onText("price_per_unit")}
                  placeholder="e.g. 285"
                />
                <FieldError message={first("price_per_unit")} />
              </div>
            )}
            {isAuction && (
              <p className="text-xs text-muted-foreground">
                Set the minimum bid in the auction terms. The AI reference below can guide it.
              </p>
            )}
          </CardContent>
        </Card>

        <PriceSuggestionBox
          category={values.category}
          unit={values.unit}
          sellingType={values.selling_type}
          onUse={(value) => set(isAuction ? "min_bid" : "price_per_unit", String(value))}
        />

        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="text-sm text-muted-foreground">
              {editing
                ? restriction.termsChangeSendsToReview
                  ? "Saving changes to the auction terms sends this listing back for staff review."
                  : "Saving updates your listing."
                : "By submitting, you confirm the details are accurate. Staff review every listing before it is published."}
            </p>
            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Submit for approval"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
