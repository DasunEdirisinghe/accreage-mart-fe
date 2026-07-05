"use client";

import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Gavel,
  LineChart,
  ShieldCheck,
  Sprout,
  Store,
  Truck,
  Megaphone,
} from "lucide-react";

import { useDB } from "@/hooks/use-db";
import { formatLKR, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListingCard } from "@/components/shared/listing-card";
import { TimeLeft } from "@/components/shared/time-left";

export default function LandingPage() {
  const db = useDB();
  const featured = db.listings.filter((l) => l.status === "approved").slice(0, 8);
  const liveAuctions = db.auctions.filter((a) => a.status === "live");

  return (
    <>
      {/* hero */}
      <section className="border-b bg-gradient-to-b from-secondary/70 to-background">
        <div className="container grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="space-y-6">
            <Badge variant="secondary" className="gap-1.5">
              <BrainCircuit className="h-3.5 w-3.5" /> AI-powered price forecasting
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Sri Lanka&apos;s wholesale <span className="text-primary">agri-marketplace</span>,
              made transparent.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Accreage Mart connects farmers and wholesale sellers directly with hotels,
              supermarkets, exporters and processors — with competitive auctions, AI price
              suggestions and trusted, verified trade.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/marketplace">
                  Browse marketplace <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Sell your produce</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Verified sellers
              </span>
              <span className="flex items-center gap-2">
                <Gavel className="h-4 w-4 text-primary" /> Live auctions
              </span>
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" /> Optional logistics
              </span>
            </div>
          </div>

          {/* live auction teaser */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
              </span>
              Live auctions now
            </h2>
            {liveAuctions.slice(0, 2).map((a) => {
              const listing = db.listings.find((l) => l.id === a.listingId)!;
              const highest = db.bids
                .filter((b) => b.auctionId === a.id)
                .sort((x, y) => y.amount - x.amount)[0];
              return (
                <Link key={a.id} href={`/auctions/${a.id}`} className="block">
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center gap-4 p-4">
                      <span
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-3xl ${listing.imageGradient}`}
                      >
                        {listing.image}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{listing.title}</p>
                        <p className="text-sm text-muted-foreground">
                          <TimeLeft endTime={a.endTime} /> · {listing.quantityAvailable.toLocaleString()}{" "}
                          {listing.unit} lot
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Highest bid</p>
                        <p className="font-bold text-primary">
                          {highest ? formatLKR(highest.amount) : formatLKR(a.minBid)}
                          <span className="text-xs font-normal">/{listing.unit}</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
            <Button variant="link" asChild className="px-0">
              <Link href="/auctions">
                View all auctions <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* categories */}
      <section className="container py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Browse by category</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {db.categories.map((c) => (
            <Link
              key={c.id}
              href={`/marketplace?category=${c.id}`}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-colors hover:border-primary hover:bg-secondary"
            >
              <span className="text-3xl">{c.icon}</span>
              <span className="text-xs font-medium">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* featured listings */}
      <section className="container pb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Featured listings</h2>
          <Button variant="ghost" asChild>
            <Link href="/marketplace">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              seller={db.sellerProfiles.find((s) => s.id === l.sellerId)}
            />
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="border-y bg-secondary/40">
        <div className="container py-14">
          <h2 className="mb-10 text-center text-2xl font-bold">How Accreage Mart works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Store,
                title: "1. List or discover produce",
                text: "Sellers publish direct or auction listings with quality details. Buyers search and filter by category, price, location and seller rating.",
              },
              {
                icon: BrainCircuit,
                title: "2. Price with AI confidence",
                text: "Prophet-based forecasts suggest fair price ranges from historical market data — sellers stay in control of the final price.",
              },
              {
                icon: Sprout,
                title: "3. Trade with trust",
                text: "Bid in real-time auctions or order directly. Payment proofs, verified reviews and dynamic trust scores keep trade honest.",
              },
            ].map((s) => (
              <div key={s.title} className="flex flex-col items-center text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <s.icon className="h-7 w-7" />
                </span>
                <h3 className="mb-2 font-semibold">{s.title}</h3>
                <p className="max-w-xs text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI strip */}
      <section className="container py-14">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary to-primary/85 text-primary-foreground">
          <CardContent className="grid items-center gap-8 p-8 md:grid-cols-[1fr_auto] md:p-12">
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <LineChart className="h-6 w-6" /> Demand forecasting, built in
              </h2>
              <p className="max-w-2xl text-primary-foreground/85">
                Our Facebook Prophet model forecasts wholesale prices with a mean absolute
                percentage error of just 4.74% — so sellers can plan production and pricing
                with confidence, and buyers can time purchases smartly.
              </p>
            </div>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Get started free</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* announcements */}
      <section className="container pb-16">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Megaphone className="h-5 w-5 text-primary" /> Platform announcements
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {db.announcements.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{a.title}</CardTitle>
                <CardDescription>{formatDate(a.createdAt)}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{a.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
