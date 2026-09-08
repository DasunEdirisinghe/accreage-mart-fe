import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SellerPendingPage() {
  return (
    <div className="mx-auto max-w-lg py-8">
      <Card className="text-center">
        <CardHeader>
          <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <CardTitle className="text-xl">Verification in progress</CardTitle>
          <CardDescription>
            Thanks for signing up. Our team is reviewing your business details — once you&apos;re
            verified you&apos;ll be able to create listings and take orders. This usually takes a
            day or two.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild variant="outline">
            <Link href="/seller/profile">Review my profile</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/marketplace">Browse the marketplace</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
