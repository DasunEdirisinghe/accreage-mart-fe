"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { setAccountStatus, type ManagedAccount } from "@/app/actions/admin-accounts";
import { USER_STATUS_BADGE, canManageStatus } from "@/lib/user-status";
import { formatDate, initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Status = "active" | "suspended" | "deactivated";
const STATUSES: Status[] = ["active", "suspended", "deactivated"];

export function AccountManageTable({
  rows,
  showBusiness = false,
  emptyDescription,
}: {
  rows: ManagedAccount[];
  showBusiness?: boolean;
  emptyDescription: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  const change = async (email: string, status: Status) => {
    setBusy(email);
    const res = await setAccountStatus(email, status);
    setBusy(null);
    if (res.ok) {
      toast.success(`Account ${status}`);
      router.refresh();
    } else {
      toast.error(res.error ?? "Could not update the account");
    }
  };

  if (rows.length === 0) {
    return <EmptyState icon={Users} title="No accounts yet" description={emptyDescription} />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Account</TableHead>
              <TableHead>Role</TableHead>
              {showBusiness && <TableHead>Business</TableHead>}
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.email}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {initials(row.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {row.role ?? "—"}
                  </Badge>
                </TableCell>
                {showBusiness && (
                  <TableCell className="max-w-40">
                    <span className="block truncate text-sm">{row.businessName ?? "—"}</span>
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground">{formatDate(row.since)}</TableCell>
                <TableCell>
                  <Badge variant={USER_STATUS_BADGE[row.status].variant}>
                    {USER_STATUS_BADGE[row.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  {canManageStatus(row.status) ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={busy === row.email}>
                          {busy === row.email ? "Saving…" : "Manage"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {STATUSES.filter((s) => s !== row.status).map((s) => (
                          <DropdownMenuItem key={s} onClick={() => change(row.email, s)}>
                            Set {s}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-xs text-muted-foreground">Awaiting activation</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
