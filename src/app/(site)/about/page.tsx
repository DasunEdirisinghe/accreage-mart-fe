import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Gavel,
  HandCoins,
  Handshake,
  LineChart,
  ShieldCheck,
  Sprout,
  Target,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "About" };

const STATS = [
  { value: "4.74%", label: "AI price forecast error" },
  { value: "8", label: "Produce categories" },
  { value: "100%", label: "Verified sellers" },
  { value: "24/7", label: "Live auctions & orders" },
];

const VALUES = [
  {
    icon: HandCoins,
    title: "Direct B2B trade",
    text: "No intermediaries. Sellers keep more of the final price; buyers source with certainty.",
    tint: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Gavel,
    title: "Competitive auctions",
    text: "Real-time bidding with automated closing gives fair, transparent price discovery.",
    tint: "bg-sky-100 text-sky-700",
  },
  {
    icon: BrainCircuit,
    title: "AI price forecasting",
    text: "Facebook Prophet forecasts (MAPE 4.74%) power price suggestions and demand insights.",
    tint: "bg-amber-100 text-amber-700",
  },
  {
    icon: ShieldCheck,
    title: "Trust built in",
    text: "Seller verification, verified-purchase reviews and dynamic trust scores.",
    tint: "bg-rose-100 text-rose-700",
  },
  {
    icon: Sprout,
    title: "Made for Sri Lanka",
    text: "Local commodities, LKR pricing, SMS alerts, and Sinhala/Tamil support planned.",
    tint: "bg-lime-100 text-lime-700",
  },
  {
    icon: Users,
    title: "All stakeholders",
    text: "Farmers, institutional buyers, logistics partners and regulators on one platform.",
    tint: "bg-violet-100 text-violet-700",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* hero */}
      <section className="border-b bg-gradient-to-b from-secondary/70 to-background">
        <div className="container max-w-4xl py-16 text-center">
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <Target className="h-3.5 w-3.5" /> Our mission
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Fair, transparent trade for Sri Lankan agriculture
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            An AI-powered B2B agricultural marketplace built to replace opaque, intermediary-heavy
            trade with direct, transparent and intelligent wholesale commerce.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/marketplace">
                Browse marketplace <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Create free account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* mission + stat panel */}
      <section className="container py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px] lg:items-center">
          <div className="space-y-6 leading-relaxed text-muted-foreground">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Why we exist</h2>
            <p>
              Agriculture is a cornerstone of the Sri Lankan economy, yet wholesale trade remains
              constrained by long intermediary chains, severe price volatility, post-harvest loss
              and weak price transparency. Farmers frequently receive a small fraction of the final
              market price, and during harvest gluts many are forced to discard produce entirely.
            </p>
            <p>
              Accreage Mart connects wholesale sellers (farmers, cooperatives and producers)
              directly with institutional buyers such as hotels, supermarkets, exporters and
              processors. The platform combines competitive auction-based price discovery with
              machine-learning demand forecasting, so both sides of every trade can act on real
              market intelligence.
            </p>
          </div>

          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground">
            <CardContent className="space-y-4 p-8">
              <LineChart className="h-8 w-8" />
              <p className="text-4xl font-extrabold">4.74%</p>
              <p className="text-sm text-primary-foreground/85">
                Mean absolute percentage error of our price-forecasting model on a 90-day holdout —
                accurate enough to plan production and time purchases with confidence.
              </p>
            </CardContent>
          </Card>
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

      {/* values */}
      <section className="container py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">
            What makes us different
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight">Built around how agri actually trades</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md">
              <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${f.tint}`}>
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="mb-1.5 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* closing CTA band */}
      <section className="container pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-emerald-600 to-teal-500 px-6 py-14 text-center text-white shadow-lg md:px-12">
          <div className="mx-auto max-w-2xl space-y-4">
            <Handshake className="mx-auto h-10 w-10" />
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Be part of transparent agri-trade
            </h2>
            <p className="text-white/90">
              Whether you grow produce or source it in bulk, Accreage Mart gives you fair prices,
              verified partners and AI-backed insight. Free to join.
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
          </div>
        </div>
      </section>
    </>
  );
}
