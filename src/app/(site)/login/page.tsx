"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Leaf, ShoppingBasket, Store, ShieldCheck, UserCog } from "lucide-react";

import { demoLogin, login, resendActivation, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const DEMO_ACCOUNTS = [
  { role: "buyer" as const, icon: ShoppingBasket, label: "Buyer", desc: "Demo Hotels, procurement" },
  { role: "seller" as const, icon: Store, label: "Seller", desc: "Demo Fresh Farms" },
  { role: "staff" as const, icon: ShieldCheck, label: "Staff", desc: "Listing & payment review" },
  { role: "admin" as const, icon: UserCog, label: "Admin", desc: "Full platform control" },
];

const DEMO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";

const initialState: LoginState = {};

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginCard />
    </React.Suspense>
  );
}

function LoginCard() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [state, formAction, pending] = React.useActionState(login, initialState);
  const [resend, setResend] = React.useState<"idle" | "sending" | "sent">("idle");

  const handleResend = async () => {
    if (!state.inputs?.usr) return;
    setResend("sending");
    await resendActivation(state.inputs.usr);
    setResend("sent");
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
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div className="space-y-2">
              <Label htmlFor="usr">Email</Label>
              <Input
                id="usr"
                name="usr"
                type="email"
                placeholder="you@business.lk"
                defaultValue={state.inputs?.usr}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pwd">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input id="pwd" name="pwd" type="password" placeholder="••••••••" required />
            </div>

            {state.error && (
              <div className="space-y-2">
                <p className="text-sm text-destructive" role="alert">
                  {state.error}
                </p>
                {state.canResendActivation && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resend !== "idle"}
                    className="text-sm font-medium text-primary hover:underline disabled:opacity-60"
                  >
                    {resend === "idle" && "Resend the setup link"}
                    {resend === "sending" && "Sending…"}
                    {resend === "sent" && "Sent — check your email"}
                  </button>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {DEMO_LOGIN_ENABLED && (
            <>
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">demo quick sign-in</span>
                <Separator className="flex-1" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.role}
                    type="button"
                    onClick={() => demoLogin(a.role)}
                    className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-secondary"
                  >
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <a.icon className="h-4 w-4 text-primary" /> {a.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{a.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}

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
