"use client";

import { UserRound } from "lucide-react";
import { toast } from "sonner";

import { useDB } from "@/hooks/use-db";
import { setUserStatus } from "@/lib/services/admin";
import { USER_STATUS_BADGE, canManageStatus } from "@/lib/user-status";
import { formatDate, initials, cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserManagementPage() {
  const db = useDB();

  return (
    <>
      <PageHeader
        title="User management"
        description="View, activate, suspend or deactivate buyer and seller accounts (SRS 2.2 REQ-7/8)."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.users.map((u) => {
                const sp = db.sellerProfiles.find((s) => s.userId === u.id);
                const bp = db.buyerProfiles.find((b) => b.userId === u.id);
                return (
                  <TableRow key={u.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={cn(u.avatarColor, "text-xs text-white")}>
                            {initials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                    </TableCell>
                    <TableCell className="max-w-40">
                      <span className="block truncate text-sm">
                        {sp?.businessName ?? bp?.businessName ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={USER_STATUS_BADGE[u.status].variant}>
                        {USER_STATUS_BADGE[u.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      {canManageStatus(u.status) ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <UserRound className="h-3.5 w-3.5" /> Manage
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(["active", "suspended", "deactivated"] as const)
                              .filter((s) => s !== u.status)
                              .map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() => {
                                    setUserStatus(u.id, s);
                                    toast.success(`${u.name} → ${s}`);
                                  }}
                                >
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
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
