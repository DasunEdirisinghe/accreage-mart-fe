"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { roleHome } from "@/lib/auth-routes";
import { frappeFetch, frappeLogin, frappeLogout } from "@/lib/frappe";
import { AUTH_METHODS } from "@/lib/methods";
import { sanitizeNext } from "@/lib/next-param";
import { getSession, type PrimaryRole } from "@/lib/session";

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

interface UserInfo {
  user: { id: string; email: string; fullName: string };
  role: PrimaryRole | null;
  status: "invited" | "active" | "suspended" | "deactivated";
}

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
    return { error: GENERIC_CREDENTIALS_ERROR, inputs: { usr } };
  }

  const session = await getSession();
  session.frappeSid = result.sid;

  let info: UserInfo;
  try {
    const res = await frappeFetch(AUTH_METHODS.GET_USER_INFO, { cache: "no-store" });
    info = ((await res.json()) as { message: UserInfo }).message;
  } catch {
    session.destroy();
    return { error: "Could not sign you in. Please try again.", inputs: { usr } };
  }

  if (info.status !== "active") {
    await frappeLogout(result.sid);
    session.destroy();

    if (info.status === "invited") {
      return {
        error: "This account hasn't been activated yet — check your email for the setup link.",
        canResendActivation: true,
        inputs: { usr },
      };
    }
    if (info.status === "suspended") {
      return {
        error: "This account is suspended. Please contact Accreage Mart support.",
        inputs: { usr },
      };
    }
    return { error: "This account has been deactivated.", inputs: { usr } };
  }

  session.user = {
    id: info.user.id,
    email: info.user.email,
    fullName: info.user.fullName,
    role: info.role,
  };
  session.isLoggedIn = true;
  await session.save();

  redirect(sanitizeNext(next) ?? roleHome(info.role));
}

export async function logout(): Promise<void> {
  const session = await getSession();
  if (session.frappeSid) {
    await frappeLogout(session.frappeSid);
  }
  session.destroy();
  redirect("/login");
}
