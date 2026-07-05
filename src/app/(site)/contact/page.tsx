"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ContactPage() {
  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Contact us</h1>
        <p className="mt-2 text-muted-foreground">
          Questions about trading on Accreage Mart? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <CardTitle>Send an inquiry</CardTitle>
            <CardDescription>
              Registered users can also track inquiries from their dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Inquiry sent (demo)", {
                  description: "Our team will get back to you within one business day.",
                });
                (e.target as HTMLFormElement).reset();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="Your name" required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="you@business.lk" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {["General", "Becoming a seller", "Becoming a buyer", "Payments", "Technical issue"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea rows={5} placeholder="How can we help?" required />
              </div>
              <Button type="submit">Send message</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {[
            { icon: Mail, label: "Email", value: "hello@accreagemart.lk" },
            { icon: Phone, label: "Phone", value: "+94 11 234 5678" },
            { icon: MapPin, label: "Office", value: "Colombo 07, Sri Lanka" },
          ].map((c) => (
            <Card key={c.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <c.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-sm font-medium">{c.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
