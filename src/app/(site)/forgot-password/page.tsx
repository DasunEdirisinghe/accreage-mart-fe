"use client";

import * as React from "react";
import Link from "next/link";
import { KeyRound, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
            {sent ? <MailCheck className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
          </span>
          <CardTitle className="text-xl">{sent ? "Check your email" : "Reset password"}</CardTitle>
          <CardDescription>
            {sent
              ? "If an account exists for that address, a reset link has been sent (demo — no email actually sent)."
              : "Enter your registered email and we'll send you a reset link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <Button className="w-full" asChild>
              <Link href="/login">Back to sign in</Link>
            </Button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true); // WIRING LATER: frappe.core.doctype.user.user.reset_password
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@business.lk" required />
              </div>
              <Button type="submit" className="w-full">
                Send reset link
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
