"use client";

import * as React from "react";
import Link from "next/link";
import { KeyRound, MailCheck } from "lucide-react";

import { requestPasswordReset, type ResetRequestState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ResetRequestState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = React.useActionState(requestPasswordReset, initialState);

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
            {state.sent ? <MailCheck className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
          </span>
          <CardTitle className="text-xl">
            {state.sent ? "Check your email" : "Reset password"}
          </CardTitle>
          <CardDescription>
            {state.sent
              ? "If an account exists for that address, we've sent a link to set a new password."
              : "Enter your registered email and we'll send you a link to set a new password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.sent ? (
            <div className="space-y-4">
              {state.devLink && (
                <p className="rounded-md bg-muted p-3 text-xs break-all">
                  Dev (no email configured):{" "}
                  <Link href={state.devLink.replace(/^https?:\/\/[^/]+/, "")} className="text-primary underline">
                    open the set-password link
                  </Link>
                </p>
              )}
              <Button className="w-full" asChild>
                <Link href="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@business.lk" required />
              </div>
              {state.error && (
                <p className="text-sm text-destructive" role="alert">
                  {state.error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Sending…" : "Send reset link"}
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
