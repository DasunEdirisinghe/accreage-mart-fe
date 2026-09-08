import type { UserStatus } from "@/lib/types";

type BadgeVariant = "success" | "info" | "warning" | "muted";

/**
 * Badge variant + label for each account status, shared by the admin user tables
 * (/admin/users and /admin/staff) so they stay in sync.
 */
export const USER_STATUS_BADGE: Record<UserStatus, { variant: BadgeVariant; label: string }> = {
  invited: { variant: "info", label: "Invited" },
  active: { variant: "success", label: "Active" },
  suspended: { variant: "warning", label: "Suspended" },
  deactivated: { variant: "muted", label: "Deactivated" },
};

/**
 * Status controls (suspend / reactivate / deactivate) only apply once the invitee
 * has activated their account — an "invited" row has nothing for staff to change yet.
 */
export function canManageStatus(status: UserStatus): boolean {
  return status !== "invited";
}
