"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import { toast } from "sonner";

import { useDB } from "@/hooks/use-db";
import { updateInquiry } from "@/lib/services/engagement";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const STATUS_VARIANT = { open: "warning", in_progress: "info", resolved: "success" } as const;

export default function AdminInquiriesPage() {
  const db = useDB();
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});

  return (
    <>
      <PageHeader
        title="Inquiry management"
        description="Inquiries are auto-routed by category. Respond and resolve (SRS 2.9)."
      />
      {db.inquiries.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No inquiries" />
      ) : (
        <div className="space-y-4">
          {db.inquiries.map((i) => {
            const user = db.users.find((u) => u.id === i.userId);
            return (
              <Card key={i.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{i.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.name} ({user?.role}) · {i.id} · {formatDate(i.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{i.category} team</Badge>
                      <Badge variant={STATUS_VARIANT[i.status]}>{i.status.replace("_", " ")}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{i.message}</p>
                  {i.response ? (
                    <div className="rounded-md bg-secondary p-3 text-sm">
                      <p className="mb-1 text-xs font-semibold">Response sent</p>
                      <p>{i.response}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        rows={2}
                        placeholder="Write a response…"
                        value={drafts[i.id] ?? ""}
                        onChange={(e) => setDrafts((s) => ({ ...s, [i.id]: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={!drafts[i.id]?.trim()}
                          onClick={() => {
                            updateInquiry(i.id, "resolved", drafts[i.id]);
                            toast.success("Response sent & inquiry resolved");
                          }}
                        >
                          Send & resolve
                        </Button>
                        {i.status === "open" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              updateInquiry(i.id, "in_progress");
                              toast.info("Marked in progress");
                            }}
                          >
                            Mark in progress
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
