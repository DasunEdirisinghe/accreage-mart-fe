"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { roleHome } from "@/lib/auth-routes";
import { frappeFetch, frappeLogin, frappeLogout } from "@/lib/frappe";
import { frappeErrorMessage } from "@/lib/frappe-error";
import { AUTH_METHODS } from "@/lib/methods";
import { sanitizeNext } from "@/lib/next-param";
import { getSession, type PrimaryRole } from "@/lib/session";

interface UserInfo {
  user: { id: string; email: string; fullName: string };
  role: PrimaryRole | null;
  status: "invited" | "active" | "suspended" | "deactivated";
  verified: boolean;
}

/**
 * Store the Frappe `sid`, load the account, and — if it's active — persist the
 * frontend session. Returns the account info so the caller can gate / redirect.
 */
async function loadSession(sid: string): Promise<UserInfo> {
  // Pass the sid explicitly — the session cookie hasn't been saved yet, so
  // frappeFetch can't read it from storage.
  const res = await frappeFetch(AUTH_METHODS.GET_USER_INFO, { cache: "no-store", sid });
  const info = ((await res.json()) as { message: UserInfo }).message;

  if (info.status === "active") {
    const session = await getSession();
    session.frappeSid = sid;
    session.user = {
      id: info.user.id,
      email: info.user.email,
      fullName: info.user.fullName,
      role: info.role,
      sellerPending: info.role === "seller" && !info.verified,
    };
    session.isLoggedIn = true;
    await session.save();
  }
  return info;
}

async function statusError(sid: string, status: UserInfo["status"], usr: string): Promise<LoginState> {
  await frappeLogout(sid);
  (await getSession()).destroy();

  if (status === "invited") {
    return {
      error: "This account hasn't been activated yet — check your email for the setup link.",
      canResendActivation: true,
      inputs: { usr },
    };
  }
  if (status === "suspended") {
    return {
      error: "This account is suspended. Please contact Accreage Mart support.",
      inputs: { usr },
    };
  }
  return { error: "This account has been deactivated.", inputs: { usr } };
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export interface LoginState {
  error?: string;
  /** The account exists but is still "invited" — offer to resend the setup link. */
  canResendActivation?: boolean;
  inputs?: { usr?: string };
}

const GENERIC_CREDENTIALS_ERROR = "Invalid email or password.";

const loginSchema = z.object({
  usr: z.string().min(1).email(),
  pwd: z.string().min(1),
  next: z.string().optional(),
});

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const usrRaw = (formData.get("usr") as string | null)?.trim() ?? "";
  const parsed = loginSchema.safeParse({
    usr: usrRaw,
    pwd: formData.get("pwd"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "Enter your email and password.", inputs: { usr: usrRaw } };
  }

  const { usr, pwd, next } = parsed.data;

  const result = await frappeLogin(usr, pwd);
  if (!result.ok || !result.sid) {
    // A pending account can't have a usable password yet — point the person at
    // the activation link instead of a dead-end "wrong password".
    if (await isPendingAccount(usr)) {
      return {
        error: "This account hasn't been activated yet — check your email for the setup link.",
        canResendActivation: true,
        inputs: { usr },
      };
    }
    return { error: GENERIC_CREDENTIALS_ERROR, inputs: { usr } };
  }

  let info: UserInfo;
  try {
    info = await loadSession(result.sid);
  } catch {
    (await getSession()).destroy();
    return { error: "Could not sign you in. Please try again.", inputs: { usr } };
  }

  if (info.status !== "active") {
    return statusError(result.sid, info.status, usr);
  }

  redirect(sanitizeNext(next) ?? roleHome(info.role));
}

// ---------------------------------------------------------------------------
// Demo quick sign-in (dev only)
// ---------------------------------------------------------------------------

const DEMO_EMAIL: Record<PrimaryRole, string> = {
  buyer: "buyer@demo.accreagemart.lk",
  seller: "seller@demo.accreagemart.lk",
  staff: "staff@demo.accreagemart.lk",
  admin: "admin@demo.accreagemart.lk",
};

export async function demoLogin(role: PrimaryRole): Promise<void> {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== "true") {
    redirect("/login");
  }

  const result = await frappeLogin(DEMO_EMAIL[role], "demo1234");
  if (!result.ok || !result.sid) {
    redirect("/login?error=demo");
  }

  const info = await loadSession(result.sid);
  redirect(roleHome(info.role));
}

// ---------------------------------------------------------------------------
// Set password / activate (behind an emailed key)
// ---------------------------------------------------------------------------

export interface SetPasswordState {
  error?: string;
}

const setPasswordSchema = z
  .object({
    key: z.string().min(1),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[A-Za-z]/, "Include a letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string().min(1),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Those passwords don't match",
    path: ["confirm"],
  });

export async function setPassword(
  _prev: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const parsed = setPasswordSchema.safeParse({
    key: formData.get("key"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { key, password } = parsed.data;

  let email: string;
  try {
    const res = await frappeFetch(AUTH_METHODS.SET_PASSWORD, {
      method: "POST",
      body: { key, new_password: password },
      auth: false,
    });
    email = ((await res.json()) as { message: { email: string } }).message.email;
  } catch (error) {
    return { error: frappeErrorMessage(error) };
  }

  // Sign the person in with the password they just chose.
  const result = await frappeLogin(email, password);
  let info: UserInfo | null = null;
  if (result.ok && result.sid) {
    try {
      info = await loadSession(result.sid);
    } catch {
      info = null;
    }
  }

  // redirect() throws by design — keep it out of the try/catch above.
  if (info && info.status === "active") {
    redirect(roleHome(info.role));
  }
  redirect("/login?set=1");
}

// ---------------------------------------------------------------------------
// Forgot password / resend activation
// ---------------------------------------------------------------------------

export interface ResetRequestState {
  sent?: boolean;
  error?: string;
  /** Dev only — the site has no SMTP configured. */
  devLink?: string;
}

const emailSchema = z.string().min(1).email();

export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  if (!emailSchema.safeParse(email).success) {
    return { error: "Enter a valid email address." };
  }

  try {
    const res = await frappeFetch(AUTH_METHODS.REQUEST_PASSWORD_RESET, {
      method: "POST",
      body: { email },
      auth: false,
    });
    const message = ((await res.json()) as { message: { dev_link?: string } }).message;
    return { sent: true, devLink: message.dev_link };
  } catch {
    // Never leak a failure here — the response is deliberately generic.
    return { sent: true };
  }
}

async function isPendingAccount(email: string): Promise<boolean> {
  try {
    const res = await frappeFetch(AUTH_METHODS.ACCOUNT_HINT, {
      method: "POST",
      body: { email },
      auth: false,
    });
    return Boolean(((await res.json()) as { message: { invited?: boolean } }).message.invited);
  } catch {
    return false;
  }
}

/** Whether a set-password link still works — used by the /set-password page on load. */
export async function checkResetKey(key: string): Promise<boolean> {
  if (!key) return false;
  try {
    const res = await frappeFetch(
      `${AUTH_METHODS.CHECK_RESET_KEY}?key=${encodeURIComponent(key)}`,
      { auth: false, cache: "no-store" },
    );
    return Boolean(((await res.json()) as { message: { valid: boolean } }).message.valid);
  } catch {
    return false;
  }
}

export async function resendActivation(email: string): Promise<ResetRequestState> {
  try {
    const res = await frappeFetch(AUTH_METHODS.RESEND_ACTIVATION, {
      method: "POST",
      body: { email },
      auth: false,
    });
    const message = ((await res.json()) as { message: { dev_link?: string } }).message;
    return { sent: true, devLink: message.dev_link };
  } catch {
    return { sent: true };
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export interface RegisterState {
  error?: string;
  sent?: boolean;
  devLink?: string;
  inputs?: Record<string, string>;
}

const registerSchema = z
  .object({
    role: z.enum(["buyer", "seller"]),
    fullName: z.string().min(2, "Enter your full name"),
    businessName: z.string().min(2, "Enter your business name"),
    email: z.string().email("Enter a valid email"),
    mobile: z.string().min(6, "Enter a mobile number"),
    district: z.string().min(1, "Select a district"),
    buyerType: z.string().optional(),
    description: z.string().optional(),
    terms: z.string().optional(),
  })
  .refine((d) => d.terms === "on", { message: "Please accept the terms to continue", path: ["terms"] })
  .refine((d) => d.role !== "buyer" || Boolean(d.buyerType), {
    message: "Select a buyer type",
    path: ["buyerType"],
  });

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const raw = {
    role: formData.get("role"),
    fullName: (formData.get("fullName") as string | null)?.trim() ?? "",
    businessName: (formData.get("businessName") as string | null)?.trim() ?? "",
    email: (formData.get("email") as string | null)?.trim() ?? "",
    mobile: (formData.get("mobile") as string | null)?.trim() ?? "",
    district: formData.get("district") ?? "",
    buyerType: formData.get("buyerType") ?? undefined,
    description: formData.get("description") ?? undefined,
    terms: formData.get("terms") ?? undefined,
  };

  const parsed = registerSchema.safeParse(raw);
  const inputs = {
    fullName: raw.fullName,
    businessName: raw.businessName,
    email: raw.email,
    mobile: raw.mobile,
  };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again.", inputs };
  }

  const d = parsed.data;
  const method = d.role === "buyer" ? AUTH_METHODS.REGISTER_BUYER : AUTH_METHODS.REGISTER_SELLER;
  const body =
    d.role === "buyer"
      ? {
          full_name: d.fullName,
          business_name: d.businessName,
          email: d.email,
          mobile: d.mobile,
          district: d.district,
          buyer_type: d.buyerType,
        }
      : {
          full_name: d.fullName,
          business_name: d.businessName,
          email: d.email,
          mobile: d.mobile,
          district: d.district,
          description: d.description ?? "",
        };

  try {
    const res = await frappeFetch(method, { method: "POST", body, auth: false });
    const message = ((await res.json()) as { message: { dev_link?: string } }).message;
    return { sent: true, devLink: message.dev_link };
  } catch (error) {
    return { error: frappeErrorMessage(error), inputs };
  }
}

// ---------------------------------------------------------------------------
// Staff / admin provisioning (admin only)
// ---------------------------------------------------------------------------

export interface CreateStaffState {
  error?: string;
  created?: { email: string; devLink?: string };
}

const createStaffSchema = z.object({
  fullName: z.string().min(2, "Enter a name"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["Staff", "Admin"]),
});

export async function createStaff(
  _prev: CreateStaffState,
  formData: FormData,
): Promise<CreateStaffState> {
  const parsed = createStaffSchema.safeParse({
    fullName: (formData.get("fullName") as string | null)?.trim() ?? "",
    email: (formData.get("email") as string | null)?.trim() ?? "",
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  try {
    const res = await frappeFetch(AUTH_METHODS.CREATE_STAFF, {
      method: "POST",
      body: {
        full_name: parsed.data.fullName,
        email: parsed.data.email,
        role: parsed.data.role,
      },
    });
    const message = ((await res.json()) as { message: { email: string; dev_link?: string } }).message;
    return { created: { email: message.email, devLink: message.dev_link } };
  } catch (error) {
    return { error: frappeErrorMessage(error) };
  }
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logout(): Promise<void> {
  const session = await getSession();
  if (session.frappeSid) {
    await frappeLogout(session.frappeSid);
  }
  session.destroy();
  redirect("/login");
}
