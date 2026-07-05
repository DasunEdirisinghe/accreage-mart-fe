"use client";

import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { initials, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

/** Shared profile editor for buyers and sellers (SRS 2.2). */
export function ProfileForm() {
  const { user, sellerProfile, buyerProfile } = useAuth();
  if (!user) return null;

  const businessName = sellerProfile?.businessName ?? buyerProfile?.businessName ?? "";
  const verified = sellerProfile?.verified ?? buyerProfile?.verified ?? false;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <Card className="h-fit">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <Avatar className="h-20 w-20">
            <AvatarFallback className={cn(user.avatarColor, "text-2xl text-white")}>
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{businessName}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="capitalize">{user.role}</Badge>
            {verified && (
              <Badge variant="success">
                <ShieldCheck className="mr-1 h-3 w-3" /> Verified
              </Badge>
            )}
          </div>
          {sellerProfile && (
            <p className="text-sm text-muted-foreground">
              Trust score <span className="font-bold text-primary">{sellerProfile.trustScore.toFixed(1)}</span> / 5.0
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business details</CardTitle>
            <CardDescription>Keep your trading information up to date.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Profile updated (demo)");
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full name</Label>
                  <Input defaultValue={user.name} />
                </div>
                <div className="space-y-2">
                  <Label>Business name</Label>
                  <Input defaultValue={businessName} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" defaultValue={user.email} />
                </div>
                <div className="space-y-2">
                  <Label>Phone (SMS alerts)</Label>
                  <Input defaultValue={user.phone} />
                </div>
              </div>
              {sellerProfile && (
                <div className="space-y-2">
                  <Label>Business description</Label>
                  <Textarea defaultValue={sellerProfile.description} rows={3} />
                </div>
              )}
              <Button type="submit">Save changes</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notification preferences</CardTitle>
            <CardDescription>Email via Gmail SMTP · SMS via Send.lk (production)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Order status updates", desc: "Email + SMS on every status change", def: true },
              { label: "Auction alerts", desc: "Outbid notices and closing reminders", def: true },
              { label: "Market trend digests", desc: "Weekly AI price forecast summary", def: false },
              { label: "New listing alerts", desc: "Matching your saved categories", def: false },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
                <Switch defaultChecked={p.def} />
              </div>
            ))}
            <Separator />
            <p className="text-xs text-muted-foreground">
              Subscription-based notifications per SRS Notification Management module.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
