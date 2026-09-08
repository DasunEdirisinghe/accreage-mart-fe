"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Plus } from "lucide-react";
import { toast } from "sonner";

import { createStaff, type CreateStaffState } from "@/app/actions/auth";
import { useDB } from "@/hooks/use-db";
import { setUserStatus } from "@/lib/services/admin";
import { USER_STATUS_BADGE, canManageStatus } from "@/lib/user-status";
import { formatDate, initials, cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const initialCreateState: CreateStaffState = {};

export default function StaffManagementPage() {
  const db = useDB();
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = React.useActionState(createStaff, initialCreateState);

  React.useEffect(() => {
    if (state.created) toast.success(`Invite sent to ${state.created.email}`);
  }, [state.created]);

  const staff = db.users.filter((u) => ["staff", "admin"].includes(u.role));

  return (
    <>
      <PageHeader
        title="Staff management"
        description="Administrators can create and manage staff accounts (SRS 2.3 REQ-7)."
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Add staff member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add staff member</DialogTitle>
              <DialogDescription>
                They&apos;ll get an email with a link to set their password. Staff review listings,
                auctions, payments and inquiries; admins have full control.
              </DialogDescription>
            </DialogHeader>

            {state.created ? (
              <div className="space-y-3">
                <p className="text-sm">
                  Account created for <span className="font-medium">{state.created.email}</span> — an
                  invite has been sent.
                </p>
                {state.created.devLink && (
                  <p className="rounded-md bg-muted p-3 text-xs break-all">
                    Dev link:{" "}
                    <Link
                      href={state.created.devLink.replace(/^https?:\/\/[^/]+/, "")}
                      className="text-primary underline"
                    >
                      {state.created.devLink}
                    </Link>
                  </p>
                )}
                <DialogFooter>
                  <Button onClick={() => setOpen(false)}>Done</Button>
                </DialogFooter>
              </div>
            ) : (
              <form action={formAction} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" name="fullName" placeholder="Staff member name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffEmail">Email</Label>
                  <Input id="staffEmail" name="email" type="email" placeholder="name@accreagemart.lk" required />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select name="role" defaultValue="Staff" required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Staff">Staff (operations)</SelectItem>
                      <SelectItem value="Admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {state.error && <p className="text-sm text-destructive">{state.error}</p>}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={pending}>
                    {pending ? "Creating…" : "Create account"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Staff member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Since</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={cn(u.avatarColor, "text-xs text-white")}>
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">
                      <ShieldCheck className="mr-1 h-3 w-3" /> {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={USER_STATUS_BADGE[u.status].variant}>
                      {USER_STATUS_BADGE[u.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {!canManageStatus(u.status) ? (
                      <span className="text-xs text-muted-foreground">Awaiting activation</span>
                    ) : u.status === "active" ? (
                      <Button size="sm" variant="outline" onClick={() => { setUserStatus(u.id, "suspended"); toast.info(`${u.name} suspended`); }}>
                        Suspend
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => { setUserStatus(u.id, "active"); toast.success(`${u.name} reactivated`); }}>
                        Reactivate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
