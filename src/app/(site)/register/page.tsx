"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, ShoppingBasket, Leaf } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = React.useState<"buyer" | "seller">("buyer");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Real registration (create account -> email a set-password link) lands in
    // Stories 1.9 / 1.10.
    toast.success("Almost there", {
      description: "Check your email for a link to set your password and finish signing up.",
    });
    router.push("/login");
  };

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
          <form onSubmit={submit} className="space-y-4">
            {/* role selection */}
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
                    role === r.value
                      ? "border-primary bg-secondary"
                      : "border-border hover:border-primary/40"
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
                <Label>Full name</Label>
                <Input placeholder="A. B. Perera" required />
              </div>
              <div className="space-y-2">
                <Label>Business name</Label>
                <Input placeholder="Perera Farms (Pvt) Ltd" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="you@business.lk" required />
              </div>
              <div className="space-y-2">
                <Label>Mobile (for SMS alerts)</Label>
                <Input type="tel" placeholder="+94 7X XXX XXXX" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>District</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Colombo", "Nuwara Eliya", "Jaffna", "Matale", "Kurunegala", "Anuradhapura", "Galle", "Badulla"].map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" required />
              </div>
            </div>
            {role === "buyer" && (
              <div className="space-y-2">
                <Label>Buyer type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select buyer type" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Hotel", "Supermarket", "Exporter", "Processor", "Other"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Accounts are verified by platform staff before full trading access is granted
              (regulatory verification & trust scoring).
            </p>
            <Button type="submit" className="w-full" size="lg">
              Create account
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
