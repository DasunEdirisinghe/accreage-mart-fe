"use client";

import * as React from "react";
import { HelpCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { useDB } from "@/hooks/use-db";
import { submitInquiry } from "@/lib/services/engagement";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const STATUS_VARIANT = { open: "warning", in_progress: "info", resolved: "success" } as const;

export function InquiriesPanel({ userId }: { userId: string }) {
  const db = useDB();
  const [open, setOpen] = React.useState(false);
  const [subject, setSubject] = React.useState("");
  const [category, setCategory] = React.useState<"Product" | "Order" | "Payment" | "Platform" | "Other">("Product");
  const [message, setMessage] = React.useState("");

  const mine = db.inquiries.filter((i) => i.userId === userId);

  const submit = () => {
    submitInquiry(userId, subject, category, message);
    toast.success("Inquiry submitted", {
      description: "It has been routed to the relevant team. You'll be notified of updates.",
    });
    setOpen(false);
    setSubject("");
    setMessage("");
  };

  return (
    <>
      <PageHeader
        title="Inquiries"
        description="Submit questions about products, orders or payments and track their status."
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New inquiry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit an inquiry</DialogTitle>
              <DialogDescription>
                Inquiries are automatically routed to the right team based on category.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Product", "Order", "Payment", "Platform", "Other"] as const).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your question or issue…" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={!subject.trim() || !message.trim()}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {mine.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No inquiries" description="Questions you submit will appear here with live status tracking." />
      ) : (
        <div className="space-y-4">
          {mine.map((i) => (
            <Card key={i.id}>
              <CardContent className="p-5">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{i.subject}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{i.category}</Badge>
                    <Badge variant={STATUS_VARIANT[i.status]}>{i.status.replace("_", " ")}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{i.id} · {formatDate(i.createdAt)}</p>
                <p className="mt-2 text-sm text-muted-foreground">{i.message}</p>
                {i.response && (
                  <div className="mt-3 rounded-md bg-secondary p-3 text-sm">
                    <p className="mb-1 text-xs font-semibold text-secondary-foreground">Staff response</p>
                    <p className="text-secondary-foreground">{i.response}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
