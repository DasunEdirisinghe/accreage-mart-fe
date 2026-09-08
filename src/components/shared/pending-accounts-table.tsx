"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";
import { toast } from "sonner";

import { approveAccount, type PendingAccount } from "@/app/actions/accounts";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PendingAccountsTable({ rows }: { rows: PendingAccount[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [busy, setBusy] = React.useState<string | null>(null);

  const approve = (email: string) => {
    setBusy(email);
    startTransition(async () => {
      const res = await approveAccount(email);
      setBusy(null);
      if (res.ok) {
        toast.success("Account verified");
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not verify the account");
      }
    });
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={UserCheck}
        title="Nothing to review"
        description="New buyer and seller accounts show up here for verification."
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
              <TableHead className="pr-4 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
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
                <TableCell className="pr-4 text-right">
                  <Button
                    size="sm"
                    onClick={() => approve(row.email)}
                    disabled={pending && busy === row.email}
                  >
                    {pending && busy === row.email ? "Verifying…" : "Verify"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
