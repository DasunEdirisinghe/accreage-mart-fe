/**
 * Every Frappe method path the frontend calls, as enums.
 * No method string is written inline anywhere else — add a constant here first.
 * See docs/frontend-coding-guide.md.
 */

export enum AUTH_METHODS {
  /** Frappe native session login — POST usr/pwd, returns a Set-Cookie: sid=... */
  LOGIN = "login",
  /** Frappe native logout — clears the server session for the current sid. */
  LOGOUT = "logout",
  /** Current user + primary role + profile + status. Authenticated. */
  GET_USER_INFO = "accreage_mart.api.auth.get_user_info",
  /** Self-service buyer sign-up. Guest, rate-limited. */
  REGISTER_BUYER = "accreage_mart.api.auth.register_buyer",
  /** Self-service seller sign-up. Guest, rate-limited. */
  REGISTER_SELLER = "accreage_mart.api.auth.register_seller",
  /** Set the password behind an emailed key and activate the account. Guest. */
  SET_PASSWORD = "accreage_mart.api.auth.set_password",
  /** Whether a set-password link is still usable. Guest. */
  CHECK_RESET_KEY = "accreage_mart.api.auth.check_reset_key",
  /** Whether an email belongs to a pending (invited) account. Guest. */
  ACCOUNT_HINT = "accreage_mart.api.auth.account_hint",
  /** Send a password-reset link. Guest, rate-limited, generic response. */
  REQUEST_PASSWORD_RESET = "accreage_mart.api.auth.request_password_reset",
  /** Re-send the activation link for an account still in "invited". Guest. */
  RESEND_ACTIVATION = "accreage_mart.api.auth.resend_activation",
  /** Admin provisions a Staff/Admin account (emails an invite). Admin only. */
  CREATE_STAFF = "accreage_mart.api.auth.create_staff",
  /** Real staff / member account rows for the admin tables. Admin only. */
  LIST_ACCOUNTS = "accreage_mart.api.auth.list_accounts",
  /** Activate / suspend / deactivate an account. Admin only. */
  SET_ACCOUNT_STATUS = "accreage_mart.api.auth.set_account_status",
  /** Every buyer/seller application (Pending/Approved/Rejected). Staff/Admin only. */
  ACCOUNT_APPLICATIONS = "accreage_mart.api.auth.account_applications",
  /** Approves an application, mints a set-password link, emails the applicant. Staff/Admin only. */
  VERIFY_ACCOUNT = "accreage_mart.api.auth.verify_account",
  /** Rejects an application with a reason, emails the applicant. Staff/Admin only. */
  REJECT_ACCOUNT = "accreage_mart.api.auth.reject_account",
}
