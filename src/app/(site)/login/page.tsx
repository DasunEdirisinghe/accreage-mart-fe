"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, ShoppingBasket, Store, ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const DEMO_ACCOUNTS = [
  { role: "buyer" as const, icon: ShoppingBasket, label: "Buyer", desc: "Cinnamon Hotels — procurement" },
  { role: "seller" as const, icon: Store, label: "Seller", desc: "Nuwara Fresh Farms" },
  { role: "staff" as const, icon: ShieldCheck, label: "Staff", desc: "Listing & payment review" },
  { role: "admin" as const, icon: UserCog, label: "Admin", desc: "Full platform control" },
];

const HOME: Record<string, string> = { buyer: "/buyer", seller: "/seller", staff: "/admin", admin: "/admin" };

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, loginAs } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // WIRING LATER: POST /api/method/login with usr/pwd
    if (loginWithEmail(email)) {
      toast.success("Signed in");
      router.push("/");
    } else {
      toast.error("No account found", {
        description: "In this demo, use one of the quick sign-in options below.",
      });
    }
  };

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="h-6 w-6" />
          </span>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your Accreage Mart account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@business.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">demo quick sign-in</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.role}
                onClick={() => {
                  loginAs(a.role);
                  router.push(HOME[a.role]);
                }}
                className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-secondary"
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <a.icon className="h-4 w-4 text-primary" /> {a.label}
                </span>
                <span className="text-xs text-muted-foreground">{a.desc}</span>
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            New to Accreage Mart?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
