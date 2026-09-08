"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createStaff, type CreateStaffState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialState: CreateStaffState = {};

export function AddStaffDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = React.useActionState(createStaff, initialState);

  React.useEffect(() => {
    if (state.created) {
      toast.success(`Invite sent to ${state.created.email}`);
      router.refresh();
    }
  }, [state.created, router]);

  return (
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
  );
}
