"use client";

import * as React from "react";
import Link from "next/link";
import { KeyRound, TriangleAlert } from "lucide-react";

import { setPassword, type SetPasswordState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SetPasswordState = {};

export function SetPasswordClient({
  valid,
  requestKey,
}: {
  valid: boolean;
  requestKey: string;
}) {
  const [state, formAction, pending] = React.useActionState(setPassword, initialState);

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-10">
      <Card className="w-full max-w-md">
        {valid ? (
          <>
            <CardHeader className="text-center">
              <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                <KeyRound className="h-6 w-6" />
              </span>
              <CardTitle className="text-xl">Set your password</CardTitle>
              <CardDescription>
                Choose a password to finish setting up your Accreage Mart account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={formAction} className="space-y-4">
                <input type="hidden" name="key" value={requestKey} />
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input id="password" name="password" type="password" placeholder="••••••••" required />
                  <p className="text-xs text-muted-foreground">
                    At least 8 characters, with a letter and a number.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input id="confirm" name="confirm" type="password" placeholder="••••••••" required />
                </div>

                {state.error && (
                  <p className="text-sm text-destructive" role="alert">
                    {state.error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Saving…" : "Set password & sign in"}
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                <TriangleAlert className="h-6 w-6" />
              </span>
              <CardTitle className="text-xl">Link expired</CardTitle>
              <CardDescription>
                This set-password link is invalid or has already been used. Request a fresh one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/forgot-password">Request a new link</Link>
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
