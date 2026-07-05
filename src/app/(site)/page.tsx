"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  ChevronDown,
  Gavel,
  Handshake,
  LineChart,
  ShieldCheck,
  ShoppingCart,
  Sprout,
  Star,
  Store,
  Tag,
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
      <section className="relative overflow-hidden border-b">
        {/* background image */}
        <Image
          src="https://plus.unsplash.com/premium_photo-1663945779273-ebc45569fb9f?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* readability overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/95 via-background/5 to-background/50" />
        <div className="absolute inset-0 bg-gradient-to-t opacity-80 from-background to-transparent" />
        <div className="container relative grid grid-cols-1 items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
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
              supermarkets, exporters and processors, with competitive auctions, AI price
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

      {/* audience marquee */}
      <section className="border-b bg-primary py-5 text-primary-foreground">
        <div className="container mb-3 text-center text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
          Built for how fresh produce trades in Sri Lanka
        </div>
        <div className="marquee-pause group relative flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-3 pr-3">
            {AUDIENCES.concat(AUDIENCES).map((a, i) => (
              <span
                key={i}
                className="flex items-center gap-2 whitespace-nowrap rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium"
              >
                <span className="text-base">{a.icon}</span>
                {a.label}
              </span>
            ))}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              seller={db.sellerProfiles.find((s) => s.id === l.sellerId)}
            />
          ))}
        </div>
      </section>

      {/* buy / sell split CTA */}
      <section className="container pb-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* buyers */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 p-8 text-white shadow-lg md:p-10">
            <div className="absolute -right-6 -top-6 opacity-20 transition-transform duration-300 group-hover:scale-110">
              <ShoppingCart className="h-28 w-28" />
            </div>
            <div className="relative space-y-3">
              <Badge className="border-0 bg-white/20 text-white hover:bg-white/25">For buyers</Badge>
              <h3 className="text-2xl font-bold">Source produce at wholesale</h3>
              <p className="max-w-sm text-white/90">
                Hotels, supermarkets and exporters, browse verified listings, compare prices and
                order directly from farms across Sri Lanka.
              </p>
              <Button size="lg" variant="secondary" className="mt-2 text-orange-700" asChild>
                <Link href="/marketplace">
                  Browse marketplace <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* sellers */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-green-700 to-green-800 p-8 text-white shadow-lg md:p-10">
            <div className="absolute -right-6 -top-6 opacity-20 transition-transform duration-300 group-hover:scale-110">
              <Sprout className="h-28 w-28" />
            </div>
            <div className="relative space-y-3">
              <Badge className="border-0 bg-white/20 text-white hover:bg-white/25">For sellers</Badge>
              <h3 className="text-2xl font-bold">Sell your harvest for more</h3>
              <p className="max-w-sm text-white/90">
                List directly or run live auctions, get AI-backed fair price suggestions, and reach
                institutional buyers looking for bulk supply.
              </p>
              <Button size="lg" variant="secondary" className="mt-2 text-green-800" asChild>
                <Link href="/register">
                  Start selling today <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="border-y bg-secondary/40">
        <div className="container py-14">
          <h2 className="mb-10 text-center text-2xl font-bold">How Accreage Mart works</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: Store,
                title: "1. List or discover produce",
                text: "Sellers publish direct or auction listings with quality details. Buyers search and filter by category, price, location and seller rating.",
              },
              {
                icon: BrainCircuit,
                title: "2. Price with AI confidence",
                text: "Prophet-based forecasts suggest fair price ranges from historical market data. Sellers stay in control of the final price.",
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

      {/* stats band */}
      <section className="bg-gradient-to-r from-primary via-emerald-700 to-primary py-12 text-primary-foreground">
        <div className="container grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold sm:text-5xl">{s.value}</p>
              <p className="mt-2 text-sm font-medium text-primary-foreground/80">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* why us */}
      <section className="container py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">
            Why Accreage Mart
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight">
            Trade that respects how agri actually works
          </h2>
          <p className="mt-3 text-muted-foreground">
            Most marketplaces bolt farming onto a generic store. Accreage Mart is built around
            wholesale produce from the ground up.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_US.map((w) => (
            <div
              key={w.title}
              className={`rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md`}
            >
              <span
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${w.tint}`}
              >
                <w.icon className="h-6 w-6" />
              </span>
              <h3 className="mb-1.5 font-semibold">{w.title}</h3>
              <p className="text-sm text-muted-foreground">{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI forecasting band */}
      <section className="bg-gradient-to-r from-primary to-primary/85 py-16 text-primary-foreground">
        <div className="container mx-auto max-w-3xl text-center">
          <Badge className="mb-4 border-0 bg-white/20 text-white hover:bg-white/25">
            <LineChart className="mr-1 h-3.5 w-3.5" /> AI forecasting
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Demand forecasting, built in
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/85">
            Our Facebook Prophet model forecasts wholesale prices with a mean absolute percentage
            error of just 4.74%, so sellers can plan production and pricing with confidence, and
            buyers can time purchases smartly.
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link href="/register">Get started free</Link>
          </Button>
        </div>
      </section>

      {/* testimonials */}
      <section className="border-y bg-secondary/40">
        <div className="container py-16">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">
              From the field
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">Trusted by buyers and sellers alike</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="flex flex-col rounded-2xl border bg-card p-6">
                <blockquote className="flex-1 text-sm text-foreground/90">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-white ${t.color}`}
                  >
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Representative of feedback from platform users. Names shortened on request.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <Badge variant="secondary" className="mb-3">
              FAQ
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">Questions, answered</h2>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* join now banner */}
      <section className="container pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center text-white shadow-lg md:px-12 md:py-16">
          {/* background image */}
          <Image
            src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1920&q=80"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          {/* readability overlay */}
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative mx-auto max-w-2xl space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to trade smarter?
            </h2>
            <p className="text-white/90">
              Join Accreage Mart today, free to sign up. Verified sellers, live auctions and
              AI-backed pricing, all in one place.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button size="lg" variant="secondary" className="text-primary" asChild>
                <Link href="/register">
                  Create free account <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/60 bg-transparent text-white hover:bg-white/15 hover:text-white"
                asChild
              >
                <Link href="/contact">Talk to us</Link>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-4 text-sm text-white/85">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Verified sellers
              </span>
              <span className="flex items-center gap-2">
                <Gavel className="h-4 w-4" /> Live auctions
              </span>
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4" /> AI fair pricing
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* announcements */}
      <section className="container pb-16">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Megaphone className="h-5 w-5 text-primary" /> Platform announcements
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

/* ------------------------------ page data ------------------------------ */

const AUDIENCES = [
  { icon: "🏨", label: "Hotels & resorts" },
  { icon: "🛒", label: "Supermarkets" },
  { icon: "🌍", label: "Exporters" },
  { icon: "🏭", label: "Food processors" },
  { icon: "🍽️", label: "Restaurants" },
  { icon: "🤝", label: "Farmer co-operatives" },
  { icon: "📦", label: "Wholesalers" },
  { icon: "🚜", label: "Independent farmers" },
];

const STATS = [
  { value: "4.74%", label: "AI price forecast error" },
  { value: "8", label: "Produce categories" },
  { value: "100%", label: "Verified sellers" },
  { value: "24/7", label: "Live auctions & orders" },
];

const WHY_US = [
  {
    icon: BrainCircuit,
    title: "AI-backed fair pricing",
    text: "Prophet forecasts suggest fair price ranges from real market data. You stay in control.",
    tint: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: BadgeCheck,
    title: "Verified & trusted trade",
    text: "Verified sellers, payment proofs and dynamic trust scores keep every deal honest.",
    tint: "bg-amber-100 text-amber-700",
  },
  {
    icon: Gavel,
    title: "Live competitive auctions",
    text: "Run or join real-time auctions so quality lots reach the buyers who value them most.",
    tint: "bg-sky-100 text-sky-700",
  },
  {
    icon: Handshake,
    title: "Direct farm-to-buyer",
    text: "Cut out middlemen, sellers earn more, buyers source fresher, everyone wins.",
    tint: "bg-rose-100 text-rose-700",
  },
  {
    icon: Truck,
    title: "Optional logistics",
    text: "Add delivery to any order when you need it, or arrange your own pickup. Your call.",
    tint: "bg-violet-100 text-violet-700",
  },
  {
    icon: Star,
    title: "Verified reviews",
    text: "Real ratings from completed trades help you pick partners you can rely on.",
    tint: "bg-yellow-100 text-yellow-700",
  },
  {
    icon: LineChart,
    title: "Insights & reports",
    text: "Track prices, orders and demand trends with clear dashboards and exportable reports.",
    tint: "bg-teal-100 text-teal-700",
  },
  {
    icon: Tag,
    title: "Free to get started",
    text: "No signup or listing fees. Create an account and start trading in minutes.",
    tint: "bg-lime-100 text-lime-700",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We used to call five suppliers to price a single order. Now I compare verified listings and lock a fair rate in minutes.",
    name: "Buyer",
    role: "Procurement Lead · City hotel group",
    color: "bg-amber-500",
  },
  {
    quote:
      "The auction brought real competition for my harvest. The AI price suggestion helped me set a starting bid I felt confident about.",
    name: "Seller",
    role: "Vegetable farmer · Nuwara Eliya",
    color: "bg-emerald-600",
  },
  {
    quote:
      "Trust scores and payment proofs mean we can source in bulk without the usual risk. It changed how we buy for export.",
    name: "Exporter",
    role: "Sourcing Manager · Produce exporter",
    color: "bg-sky-600",
  },
];

const FAQS = [
  {
    q: "How does the AI price forecasting work?",
    a: "We use a Facebook Prophet model trained on historical wholesale prices (with diesel price as a regressor) to forecast fair daily price ranges. Sellers get a suggestion but always set the final price themselves.",
  },
  {
    q: "How are sellers verified?",
    a: "Sellers submit business details that staff review before listings go live. Verified reviews and a dynamic trust score then build over time based on completed, honest trades.",
  },
  {
    q: "How do payments work?",
    a: "In the current phase, buyers pay sellers directly and upload a payment proof for the order. There's no card gateway yet. This keeps things simple and transparent while trust is established.",
  },
  {
    q: "What's the difference between direct listings and auctions?",
    a: "Direct listings sell at a set price, first come first served. Auctions let multiple buyers bid on a lot in real time, so competitive produce reaches the highest-value buyer.",
  },
  {
    q: "Who can join Accreage Mart?",
    a: "Wholesale sellers such as farmers and co-operatives, and institutional buyers like hotels, supermarkets, restaurants, processors and exporters. Signing up is free.",
  },
];

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="overflow-hidden rounded-xl border bg-card">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium transition-colors hover:bg-secondary/50"
            >
              {f.q}
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-primary transition-transform ${isOpen ? "rotate-180" : ""
                  }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
