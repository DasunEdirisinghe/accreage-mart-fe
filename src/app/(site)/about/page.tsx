import { BrainCircuit, Gavel, HandCoins, ShieldCheck, Sprout, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">About Accreage Mart</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          An AI-powered B2B agricultural marketplace for Sri Lanka — built to replace opaque,
          intermediary-heavy trade with direct, transparent and intelligent wholesale commerce.
        </p>
      </div>

      <div className="space-y-6 leading-relaxed text-muted-foreground">
        <p>
          Agriculture is a cornerstone of the Sri Lankan economy, yet wholesale trade remains
          constrained by long intermediary chains, severe price volatility, post-harvest loss and
          weak price transparency. Farmers frequently receive a small fraction of the final market
          price, and during harvest gluts many are forced to discard produce entirely.
        </p>
        <p>
          Accreage Mart connects wholesale sellers — farmers, cooperatives and producers — directly
          with institutional buyers such as hotels, supermarkets, exporters and processors. The
          platform combines competitive auction-based price discovery with machine-learning demand
          forecasting, so both sides of every trade can act on real market intelligence.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: HandCoins, title: "Direct B2B trade", text: "No intermediaries. Sellers keep more of the final price; buyers source with certainty." },
          { icon: Gavel, title: "Competitive auctions", text: "Real-time bidding with automated closing gives fair, transparent price discovery." },
          { icon: BrainCircuit, title: "AI price forecasting", text: "Facebook Prophet forecasts (MAPE 4.74%) power price suggestions and demand insights." },
          { icon: ShieldCheck, title: "Trust built in", text: "Seller verification, verified-purchase reviews and dynamic trust scores." },
          { icon: Sprout, title: "Made for Sri Lanka", text: "Local commodities, LKR pricing, SMS alerts, and Sinhala/Tamil support planned." },
          { icon: Users, title: "All stakeholders", text: "Farmers, institutional buyers, logistics partners and regulators on one platform." },
        ].map((f) => (
          <Card key={f.title}>
            <CardContent className="p-5">
              <f.icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="mb-1 font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-muted-foreground">
        Accreage Mart is a Final Year Project (ITE 3999) — Bachelor of Information Technology,
        University of Moratuwa.
      </p>
    </div>
  );
}
