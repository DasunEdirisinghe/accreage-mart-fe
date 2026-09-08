"use client";

import * as React from "react";
import Link from "next/link";
import { Store, ShoppingBasket, Leaf, MailCheck } from "lucide-react";

import { register, type RegisterState } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara",
  "Hambantota", "Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa",
  "Ampara", "Trincomalee", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle",
];
const BUYER_TYPES = ["Hotel", "Supermarket", "Exporter", "Processor", "Other"];

const initialState: RegisterState = {};

export default function RegisterPage() {
  const [role, setRole] = React.useState<"buyer" | "seller">("buyer");
  const [state, formAction, pending] = React.useActionState(register, initialState);

  if (state.sent) {
    return (
      <div className="container flex min-h-[80vh] items-center justify-center py-10">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
              <MailCheck className="h-6 w-6" />
            </span>
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent a link to set your password and finish signing up.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.devLink && (
              <p className="rounded-md bg-muted p-3 text-xs break-all">
                Dev (no email configured):{" "}
                <Link
                  href={state.devLink.replace(/^https?:\/\/[^/]+/, "")}
                  className="text-primary underline"
                >
                  open the set-password link
                </Link>
              </p>
            )}
            <Button asChild className="w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="h-6 w-6" />
          </span>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Join Sri Lanka&apos;s AI-powered wholesale agricultural marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="role" value={role} />

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: "buyer", icon: ShoppingBasket, title: "I'm a buyer", desc: "Hotels, supermarkets, exporters, processors" },
                  { value: "seller", icon: Store, title: "I'm a seller", desc: "Farmers, producers, wholesale suppliers" },
                ] as const
              ).map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-left transition-colors",
                    role === r.value ? "border-primary bg-secondary" : "border-border hover:border-primary/40"
                  )}
                >
                  <r.icon className="mb-1 h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">{r.title}</span>
                  <span className="text-xs text-muted-foreground">{r.desc}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" placeholder="A. B. Perera" defaultValue={state.inputs?.fullName} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Business name</Label>
                <Input id="businessName" name="businessName" placeholder="Perera Farms (Pvt) Ltd" defaultValue={state.inputs?.businessName} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@business.lk" defaultValue={state.inputs?.email} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile (for SMS alerts)</Label>
                <Input id="mobile" name="mobile" type="tel" placeholder="+94 7X XXX XXXX" defaultValue={state.inputs?.mobile} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>District</Label>
                <Select name="district" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {role === "buyer" && (
                <div className="space-y-2">
                  <Label>Buyer type</Label>
                  <Select name="buyerType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select buyer type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUYER_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {role === "seller" && (
              <div className="space-y-2">
                <Label htmlFor="description">About your business (optional)</Label>
                <Input id="description" name="description" placeholder="Upcountry vegetable farm, wholesale supply since 2005" />
              </div>
            )}

            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <Checkbox name="terms" className="mt-0.5" />
              <span>
                I agree to the{" "}
                <Link href="/legal/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>
                . Accounts are verified by platform staff before full trading access is granted.
              </span>
            </label>

            {state.error && (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending ? "Creating…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
