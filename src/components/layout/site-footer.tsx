import Link from "next/link";
import { Leaf } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-bold">Accreage Mart</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Sri Lanka&apos;s AI-powered B2B agricultural marketplace. Transparent trade between
            wholesale sellers and institutional buyers.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Marketplace</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/marketplace" className="hover:text-foreground">Browse listings</Link></li>
            <li><Link href="/auctions" className="hover:text-foreground">Live auctions</Link></li>
            <li><Link href="/register" className="hover:text-foreground">Become a seller</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground">About us</Link></li>
            <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>hello@accreagemart.lk</li>
            <li>+94 11 234 5678</li>
            <li>Colombo, Sri Lanka</li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>© 2026 Accreage Mart.</p>
          <p>English • සිංහල (soon) • தமிழ் (soon)</p>
        </div>
      </div>
    </footer>
  );
}
