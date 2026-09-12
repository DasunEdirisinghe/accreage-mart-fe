"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";
import { toast } from "sonner";

import {
  approveAccount,
  rejectAccount,
  type AccountApplication,
  type VerificationStatus,
} from "@/app/actions/accounts";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ReviewMode = "view" | "reject";

export function AccountApplicationsTable({ rows }: { rows: AccountApplication[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [busyEmail, setBusyEmail] = React.useState<string | null>(null);
  const [reviewing, setReviewing] = React.useState<AccountApplication | null>(null);
  const [mode, setMode] = React.useState<ReviewMode>("view");
  const [reason, setReason] = React.useState("");

  const byStatus = (status: VerificationStatus) =>
    rows.filter((r) => r.verificationStatus === status);
  const pendingRows = byStatus("pending");
  const approvedRows = byStatus("approved");
  const rejectedRows = byStatus("rejected");

  const closeDialog = () => {
    setReviewing(null);
    setMode("view");
    setReason("");
  };

  const approve = (email: string) => {
    setBusyEmail(email);
    startTransition(async () => {
      const res = await approveAccount(email);
      setBusyEmail(null);
      if (res.ok) {
        toast.success("Account approved — the applicant has been emailed a login link");
        closeDialog();
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not approve the account");
      }
    });
  };

  const reject = () => {
    if (!reviewing || !reason.trim()) return;
    setBusyEmail(reviewing.email);
    startTransition(async () => {
      const res = await rejectAccount(reviewing.email, reason.trim());
      setBusyEmail(null);
      if (res.ok) {
        toast.success("Account rejected — the applicant has been notified");
        closeDialog();
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not reject the account");
      }
    });
  };

  const renderTable = (list: AccountApplication[], variant: VerificationStatus) => {
    if (list.length === 0) {
      return (
        <EmptyState
          icon={UserCheck}
          title={variant === "pending" ? "Nothing to review" : `No ${variant} accounts yet`}
          description={
            variant === "pending"
              ? "New buyer and seller accounts show up here for verification."
              : "Reviewed accounts will show up here."
          }
        />
      );
    }

    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Business</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Joined</TableHead>
                {variant === "approved" && <TableHead>Approved on</TableHead>}
                {variant === "rejected" && <TableHead>Rejected on</TableHead>}
                {variant === "rejected" && <TableHead>Reason</TableHead>}
                <TableHead className="pr-4 text-right">
                  {variant === "pending" ? "Action" : "Status"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.email}>
                  <TableCell className="pl-4 font-medium">{row.businessName}</TableCell>
                  <TableCell>
                    <div className="text-sm">{row.fullName}</div>
                    <div className="text-xs text-muted-foreground">{row.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {row.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.district}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(row.since)}</TableCell>
                  {(variant === "approved" || variant === "rejected") && (
                    <TableCell className="text-muted-foreground">
                      {row.reviewedOn ? formatDate(row.reviewedOn) : "—"}
                    </TableCell>
                  )}
                  {variant === "rejected" && (
                    <TableCell
                      className="max-w-xs truncate text-sm text-muted-foreground"
                      title={row.rejectionReason}
                    >
                      {row.rejectionReason || "—"}
                    </TableCell>
                  )}
                  <TableCell className="pr-4 text-right">
                    {variant === "pending" ? (
                      <Button size="sm" onClick={() => setReviewing(row)}>
                        Review
                      </Button>
                    ) : (
                      <Badge variant={variant === "approved" ? "success" : "destructive"}>
                        {variant}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingRows.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedRows.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedRows.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          {renderTable(pendingRows, "pending")}
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          {renderTable(approvedRows, "approved")}
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
          {renderTable(rejectedRows, "rejected")}
        </TabsContent>
      </Tabs>

      <Dialog open={!!reviewing} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          {reviewing && mode === "view" && (
            <>
              <DialogHeader>
                <DialogTitle>{reviewing.businessName}</DialogTitle>
                <DialogDescription>
                  Review the application before approving or rejecting.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <Field label="Contact" value={`${reviewing.fullName} · ${reviewing.email}`} />
                <Field label="Mobile" value={reviewing.mobile || "—"} />
                <Field label="Role" value={reviewing.role} className="capitalize" />
                <Field label="District" value={reviewing.district} />
                <Field label="Business description" value={reviewing.description || "—"} />
                <Field label="Applied on" value={formatDate(reviewing.since)} />
              </div>
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => setMode("reject")}
                  disabled={pending && busyEmail === reviewing.email}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => approve(reviewing.email)}
                  disabled={pending && busyEmail === reviewing.email}
                >
                  {pending && busyEmail === reviewing.email ? "Approving…" : "Approve"}
                </Button>
              </DialogFooter>
            </>
          )}

          {reviewing && mode === "reject" && (
            <>
              <DialogHeader>
                <DialogTitle>Reject {reviewing.businessName}</DialogTitle>
                <DialogDescription>
                  A reason is required — it&apos;s emailed to the applicant.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                rows={3}
                placeholder="Reason for rejection…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setMode("view")}>
                  Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={reject}
                  disabled={!reason.trim() || (pending && busyEmail === reviewing.email)}
                >
                  {pending && busyEmail === reviewing.email ? "Rejecting…" : "Reject account"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right font-medium", className)}>{value}</span>
    </div>
  );
}
