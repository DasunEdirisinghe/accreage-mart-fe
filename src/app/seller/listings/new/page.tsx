"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Gavel, ShoppingCart, ChevronLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { useDB } from "@/hooks/use-db";
import { useAuth } from "@/components/providers/auth-provider";
import { createListing, suggestPrice } from "@/lib/services/listings";
import { cn, formatLKR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function NewListingPage() {
  const db = useDB();
  const router = useRouter();
  const { sellerProfile } = useAuth();

  const [sellingType, setSellingType] = React.useState<"direct" | "auction">("direct");
  const [categoryId, setCategoryId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [unit, setUnit] = React.useState("kg");
  const [price, setPrice] = React.useState("");
  const [qty, setQty] = React.useState("");
  const [minQty, setMinQty] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [district, setDistrict] = React.useState("");
  const [organic, setOrganic] = React.useState(false);
  const [certification, setCertification] = React.useState("");
  // auction fields
  const [minBid, setMinBid] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");

  const [aiRange, setAiRange] = React.useState<{ min: number; max: number } | null>(null);

  if (!sellerProfile) return null;

  const askAI = () => {
    // WIRING LATER: GET /api/method/accreage.api.suggest_price?category=...
    const range = suggestPrice(categoryId || "cat-veg", Number(price) || Number(minBid) || 0);
    setAiRange(range);
    toast.success("AI price suggestion ready", {
      description: "Based on the Prophet forecast of historical wholesale prices.",
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sellingType === "auction" && (!minBid || !startTime || !endTime)) {
      toast.error("Auction details required", {
        description: "Minimum bid, start and end date/time are mandatory for auction listings.",
      });
      return;
    }
    if (sellingType === "auction" && new Date(endTime) <= new Date(startTime)) {
      toast.error("Invalid auction window", { description: "End time must be after start time." });
      return;
    }
    createListing({
      sellerId: sellerProfile.id,
      categoryId: categoryId || "cat-veg",
      title,
      description,
      sellingType,
      unit,
      pricePerUnit: Number(price) || 0,
      quantityAvailable: Number(qty),
      minOrderQty: Number(minQty) || 1,
      location,
      district: district || location,
      organic,
      certification: certification || undefined,
      minBid: minBid ? Number(minBid) : undefined,
      startTime: startTime ? new Date(startTime).toISOString() : undefined,
      endTime: endTime ? new Date(endTime).toISOString() : undefined,
    });
    toast.success("Listing submitted for approval", {
      description: "Platform staff will review it shortly. Status: Pending Approval.",
    });
    router.push("/seller/listings");
  };

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
        <Link href="/seller/listings">
          <ChevronLeft className="h-4 w-4" /> My listings
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create listing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All listings are reviewed by staff before publication (SRS 2.1 — Pending Approval workflow).
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* selling type — mandatory (REQ 2.1-2) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Selling type *</CardTitle>
              <CardDescription>How do you want to sell this lot?</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {(
                [
                  { v: "direct", icon: ShoppingCart, t: "Direct sale", d: "Fixed wholesale price, buyers order directly" },
                  { v: "auction", icon: Gavel, t: "Auction", d: "Competitive bidding for best market price" },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setSellingType(o.v)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-left transition-colors",
                    sellingType === o.v ? "border-primary bg-secondary" : "border-border hover:border-primary/40"
                  )}
                >
                  <o.icon className="mb-1 h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">{o.t}</span>
                  <span className="text-xs text-muted-foreground">{o.d}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* product details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Product details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fresh Carrots — Grade A (Upcountry)" required />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Grade, harvest date, storage, delivery notes…" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {db.categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit *</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["kg", "nut", "bag", "bundle", "unit", "litre"].map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Available quantity *</Label>
                  <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="e.g. 2000" required />
                </div>
                <div className="space-y-2">
                  <Label>Minimum order quantity *</Label>
                  <Input type="number" min={1} value={minQty} onChange={(e) => setMinQty(e.target.value)} placeholder="e.g. 100" required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Location *</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Nuwara Eliya" required />
                </div>
                <div className="space-y-2">
                  <Label>District</Label>
                  <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Nuwara Eliya" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Organic produce</p>
                  <p className="text-xs text-muted-foreground">Certified organic without synthetic inputs</p>
                </div>
                <Switch checked={organic} onCheckedChange={setOrganic} />
              </div>
              {organic && (
                <div className="space-y-2">
                  <Label>Certification (e.g. SLGAP, EU Organic)</Label>
                  <Input value={certification} onChange={(e) => setCertification(e.target.value)} placeholder="Certification name" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* conditional auction fields (REQ 2.1-3) */}
          {sellingType === "auction" && (
            <Card className="border-accent/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gavel className="h-4 w-4 text-accent-foreground" /> Auction details *
                </CardTitle>
                <CardDescription>
                  Required for auction listings. The auction itself also needs staff approval before
                  going live.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Minimum bid (LKR/{unit}) *</Label>
                  <Input type="number" min={1} value={minBid} onChange={(e) => setMinBid(e.target.value)} placeholder="e.g. 300" />
                </div>
                <div className="space-y-2">
                  <Label>Start date & time *</Label>
                  <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End date & time *</Label>
                  <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* pricing sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {sellingType === "direct" ? "Pricing" : "Reference price"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sellingType === "direct" && (
                <div className="space-y-2">
                  <Label>Price per {unit} (LKR) *</Label>
                  <Input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 285" required />
                </div>
              )}

              <Button type="button" variant="secondary" className="w-full" onClick={askAI}>
                <Sparkles className="h-4 w-4" /> Get AI price suggestion
              </Button>

              {aiRange && (
                <div className="space-y-2 rounded-md bg-secondary p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-secondary-foreground">
                    <BrainCircuit className="h-4 w-4 text-primary" /> Prophet forecast range
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {formatLKR(aiRange.min)} – {formatLKR(aiRange.max)}
                    <span className="text-xs font-normal text-muted-foreground"> /{unit}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Based on historical price trends and the diesel-price regressor. You stay in
                    full control of the final price (SRS REQ 2.1-8).
                  </p>
                  {sellingType === "direct" ? (
                    <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => setPrice(String(Math.round((aiRange.min + aiRange.max) / 2)))}>
                      Use midpoint ({formatLKR(Math.round((aiRange.min + aiRange.max) / 2))})
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => setMinBid(String(aiRange.min))}>
                      Use as minimum bid ({formatLKR(aiRange.min)})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="text-sm text-muted-foreground">
                By submitting, you confirm the produce details are accurate and comply with
                marketplace guidelines.
              </p>
              <Button type="submit" className="w-full" size="lg">
                Submit for approval
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </>
  );
}
