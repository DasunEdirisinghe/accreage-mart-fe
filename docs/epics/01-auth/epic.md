# Epic 01: Login, Registration, Authentication & Authorization

- **SRS module:** Module 3 — User Role Management (with the auth/session parts of Module 2 — Account/Profile Management)
- **Status:** planning

## Goal

Every person who uses Accreage Mart gets a real account backed by Frappe. A buyer or a seller
signs up on `/register`, receives a branded email, sets a password on `/set-password`, and is
dropped into their own dashboard. Staff and admin accounts are created by an existing admin and
onboard through the same email link — there is no public staff signup. All authenticated users
(buyer, seller, staff, admin) can reset a forgotten password. Once signed in, an encrypted
frontend session cookie plus Next.js middleware decides which area each role may enter; the
mock `auth-provider` and the client-side `DashboardShell` role gate are retired. This epic also
lays the shared Frappe-integration plumbing (`frappe.ts`, `session.ts`, `middleware.ts`,
`methods.ts`, `tags.ts`, `current-user-info.ts`, `app/actions/*`) that every later epic reuses.

## Scope & non-goals

- **In:**
  - Frappe app scaffold: `accreage_mart/api/`, `accreage_mart/utils/`, Role fixtures, `Buyer
    Profile` + `Seller Profile` DocTypes, `after_install` admin seed.
  - Role model: `Buyer` / `Seller` / `Staff` / `Admin` Frappe Roles; every user additionally
    holds `System Manager` (see Decisions); one derived primary role for routing.
  - Unified onboarding: create-inactive → branded keyed email → `/set-password` → activate →
    auto-login.
  - Buyer self-registration, seller self-registration, admin-provisioned staff/admin.
  - Login, logout, forgot-password, resend-activation.
  - `iron-session` cookie, `frappeFetch`, session-desync handling.
  - `middleware.ts` route guard (pure, testable), explainer pages, session-backed identity
    hook, mock-dashboard bridge.
  - Account status enforcement (`invited` / `suspended` / `deactivated`).
  - Minimal admin account-approvals screen (flip `verified` on pending sellers/buyers).
  - Branded transactional email base + logo asset.
  - Vitest + RTL test harness (first story — nothing tests exist before it).
- **Out (this epic):**
  - 2FA / MFA, SSO, social login.
  - Multi-role users (a user is a buyer **or** a seller, never both on one account).
  - Email change, account self-deletion, data export.
  - Mobile-number OTP verification (Send.lk is a later epic).
  - Changing password while logged in from `/buyer/profile` / `/seller/profile` (Epic 02).
  - Real SMTP delivery is **not required to pass this epic** — endpoints return the link in
    dev; wiring Gmail SMTP for delivery is the Notifications epic.
  - Wiring the mock data layer (`src/lib/services/*`, `useDB()`) for orders / listings / etc.
    — each stays mock until its own epic.

## Affected surface

- **Routes (new):** `/set-password`, `/seller/pending`, `/account/suspended`, `/legal/terms`
  (placeholder).
- **Routes (wired):** `/login`, `/register`, `/forgot-password`, `/admin/staff`,
  `/admin/users`; middleware over `/buyer/**`, `/seller/**`, `/admin/**`.
- **Frontend — new real layer:** `src/lib/frappe.ts`, `src/lib/frappe-error.ts`,
  `src/lib/methods.ts`, `src/lib/tags.ts`, `src/lib/session.ts`,
  `src/lib/current-user-info.ts`, `src/lib/route-guard.ts`, `src/middleware.ts`,
  `src/app/actions/auth.ts`, `src/hooks/use-current-user.ts`.
- **Frontend — legacy touched:** `src/components/providers/auth-provider.tsx` (**removed**),
  `src/components/layout/dashboard-shell.tsx` (role gate removed, chrome kept),
  `src/components/layout/site-header.tsx`, `src/components/shared/profile-form.tsx`, and every
  remaining `useAuth` importer (~15 files) → migrated to `useCurrentUser()`. `AuthProvider`
  removed from `src/app/layout.tsx`.
- **Services:** `src/lib/services/admin.ts` — `addStaffUser`, `setUserStatus` gain real
  backends (still same signatures).
- **Types:** `src/lib/types.ts` — `UserStatus` gains `"invited"`.
- **Backend (`accreage_mart`):**
  - DocTypes: `Buyer Profile`, `Seller Profile`.
  - Fixtures: Roles `Buyer` / `Seller` / `Staff` / `Admin`.
  - `accreage_mart/api/auth.py` whitelisted methods:
    - `get_user_info` — authenticated.
    - `register_buyer`, `register_seller` — `allow_guest`, rate-limited.
    - `set_password`, `request_password_reset`, `resend_activation` — `allow_guest`,
      rate-limited.
    - `create_staff` — `Admin` / `Administrator` only.
    - `verify_account` — `Staff` / `Admin` only.
  - Login / logout use Frappe's native `/api/method/login` and `/api/method/logout`.
  - `accreage_mart/utils/profile.py` — profile + primary-role helpers.
  - `hooks.py` — `after_install` (seed `Admin` user + roles), fixtures export.
  - Branded email templates + logo asset under `accreage_mart/public/`.

## Decisions

Defaults chosen so the stories can be written; override any of these before implementation
starts.

1. **`System Manager` on every user** — kept as an explicit project decision. Documented
   accepted risk: `System Manager` bypasses Role Permissions, so any authenticated user can
   reach generic `/api/resource/*` for any DocType, and the dev site has `ignore_csrf=1`.
   Rationale: unblocks the frontend↔Frappe integration for the final-year-project demo without
   per-DocType permission engineering. Later epics may tighten this; this epic does not.
2. **Demo quick-login cards** on `/login` — kept, but rendered only when
   `NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true"`; off in production builds.
3. **Buyer gating** — an activated (email-verified) buyer can transact immediately. Only
   **sellers** are gated on staff `verified`. Buyer `verified` still exists and is shown, but
   does not block.
4. **Admin bootstrap** — `after_install` seeds `admin@accreagemart.lk` as an `Admin`
   (status `invited`; onboards via the email link like anyone else). Frappe's `Administrator`
   also works and is special-cased as admin in the guard.
5. **First staff login** — no forced password change; the invitee sets their own password via
   the invite link, same as a buyer/seller.
6. **Password policy** — min 8 chars, at least one letter and one number, not equal to the
   email / email local-part / full name, and Frappe's native zxcvbn score ≥ 2. No expiry, no
   history, no rotation.
7. **Account approvals** — a minimal admin screen ships in this epic (Story 1.13) because the
   seller pending-gate is otherwise undemonstrable without Frappe desk access.
8. **Primary-role precedence** — `Admin` > `Staff` > `Seller` > `Buyer`; `Administrator` →
   `admin`; a user with only `System Manager` and no persona role → `role: null` → treated as
   public by the guard (cannot enter `/buyer|/seller|/admin`).

## Backend config checklist (the USER runs these)

After Story 1.3's DocType/fixture changes:

```
bench --site accreage-mart.localhost migrate
bench --site accreage-mart.localhost clear-cache
```

Site config for Stories 1.5 / 1.8 (values are a starting point):

```
bench --site accreage-mart.localhost set-config reset_password_link_expiry_duration 3600
bench --site accreage-mart.localhost set-config allow_consecutive_login_attempts 5
bench --site accreage-mart.localhost set-config allow_login_after_fail 60
# SMTP (optional this epic — dev falls back to the returned link):
bench --site accreage-mart.localhost set-config mail_server smtp.gmail.com
bench --site accreage-mart.localhost set-config mail_port 587
bench --site accreage-mart.localhost set-config use_tls 1
bench --site accreage-mart.localhost set-config mail_login <gmail-address>
bench --site accreage-mart.localhost set-config mail_password <app-password>
bench --site accreage-mart.localhost set-config auto_email_id <gmail-address>
```

Frontend `.env.local` (see `.env.example` from Story 1.2):

```
NEXT_PUBLIC_FRAPPE_URL=http://accreage-mart.localhost:8000
SECRET_COOKIE_PASSWORD=<32+ random chars>
NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true
```

## Stories

Acceptance criteria and test files live in `stories.json`. Order: **1.1 → 1.8 in sequence**;
then **1.9 / 1.10 / 1.11** in any order; **1.12 / 1.13** last. A story is not done until its
Vitest tests pass, `npm run build` is green, and (for backend stories) the user has run
`bench run-tests` and reported the result.

### A. Foundations

**Story 1.1 — Vitest + RTL test harness.** Install and configure the test stack exactly as
[`../../testing.md`](../../testing.md) "First-time setup" specifies: `vitest`,
`@vitejs/plugin-react`, `@testing-library/{react,user-event,jest-dom}`, `jsdom`;
`vitest.config.ts` (jsdom, `setupFiles: ["tests/setup.ts"]`, `@/*` alias); `tests/setup.ts`
with jest-dom + store reset; `test` / `test:watch` scripts; a smoke test at
`tests/lib/utils.test.ts`. Nothing else in this epic can be verified until this exists.

**Story 1.2 — Data model & config foundations.** Add `"invited"` to `UserStatus` in
`src/lib/types.ts` and ripple it through the status badge maps in `/admin/users` and
`/admin/staff` (new "Invited" badge, no actions until active). Add `.env.example` documenting
`NEXT_PUBLIC_FRAPPE_URL`, `SECRET_COOKIE_PASSWORD`, `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`. This story
also carries the epic doc's Decisions + accepted-risk + config-checklist sections (already
written here — the story just confirms they are current).

**Story 1.3 — Frappe app scaffold + role & identity model.** Create `accreage_mart/api/`
(package + `auth.py` stubs) and `accreage_mart/utils/`. Ship Role fixtures `Buyer` / `Seller`
/ `Staff` / `Admin`. Create `Buyer Profile` and `Seller Profile` DocTypes whose field names
match `BuyerProfile` / `SellerProfile` in `src/lib/types.ts` (resolve `location` vs `district`:
both fields exist; `location` is free text, `district` is the enum). Implement
`accreage_mart.api.auth.get_user_info` returning `{ user, role, status, verified, profile }`
and handling `Administrator`, role-less users, and profile-less users without erroring. New
users are created `user_type="System User"` with their persona role **plus** `System Manager`.
`after_install` seeds the `Admin` user. Document the endpoint guard matrix in code docstrings.

**Story 1.4 — Frontend Frappe client plumbing.** `src/lib/frappe.ts` — `frappeFetch(method,
{ method, body, next })`: prefixes `NEXT_PUBLIC_FRAPPE_URL` + `/api/method/`, attaches the
`iron-session` `sid` server-side, JSON-encodes, throws
`Error("Frappe request failed: <status> <body>")`, and on a Frappe `401` / `403` signals
"session dead" so callers can clear the cookie and bounce to `/login`. `src/lib/frappe-error.ts`
— `parseFrappeError(raw)` pulls the human message out of `_server_messages` / `exception` /
`message`. `src/lib/methods.ts` — `AUTH_METHODS` enum. `src/lib/tags.ts` — cache-tag enums
(starts with the auth/user tags).

**Story 1.5 — Session + login / logout.** `src/lib/session.ts` — `iron-session` setup,
`SessionData`, `getSession()`, `ClientSession` (omits `frappeSid`). `src/app/actions/auth.ts` —
`login` (zod `usr` / `pwd` → Frappe `login` → parse `set-cookie` `sid` → store in iron-session
→ `getUserInfo` → redirect to role home) and `logout` (Frappe `logout` + destroy session).
Wire `/login` to `useActionState`. Distinct messages for `suspended` / `deactivated` /
`invited` (the last offers "resend activation link"); identical message for wrong-password vs
unknown-email. `?next=` sanitised to same-origin relative paths only. An already-authenticated
user hitting `/login` or `/register` is redirected to their role home. Demo cards render only
under `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`.

**Story 1.6 — Middleware route guard.** `src/lib/route-guard.ts` — a pure
`resolveRoute(session, pathname): { type: "allow" } | { type: "redirect", to }` covering the
public-route set (`isPublic()`), protected prefixes `/buyer` `/seller` `/admin`, role↔prefix
mismatch (→ own home), `suspended` / `deactivated` (→ `/account/suspended`), unauthenticated
(→ `/login?next=`). `src/middleware.ts` is a thin shell calling it. New `/account/suspended`
explainer page. Remove the role-guard branch from `DashboardShell` (keep the sidebar/sheet
chrome and `SiteHeader`).

**Story 1.7 — Session-backed identity (retire the mock auth-provider).**
`src/lib/current-user-info.ts` — `React.cache`d server read of the current user + profile +
primary role. `src/hooks/use-current-user.ts` — `useCurrentUser()` exposing the same shape the
old `useAuth()` did (`user`, `sellerProfile`, `buyerProfile`, `logout`), fed by a
server-rendered initial value so there is no logged-out→logged-in flash in `SiteHeader`.
`avatarColor` is derived from the name, not stored. Migrate every `useAuth` importer to
`useCurrentUser()`; delete `src/components/providers/auth-provider.tsx`; remove `AuthProvider`
from `src/app/layout.tsx`. **Mock-dashboard bridge:** `useCurrentUser()` resolves every real
session to a fixed mock identity per role — `buyer → u-buyer-1`, `seller → u-seller-1`,
`staff → u-staff`, `admin → u-admin` — so unwired `useDB()` dashboards keep rendering. This is
tech debt, tracked, and removed feature-by-feature as later epics wire each area.

### B. Credential lifecycle & branded email (shared by all personas)

**Story 1.8 — Set-password flow + branded transactional email.** Add the Accreage Mart logo
asset (SVG + PNG) under `accreage_mart/public/` and reference it from the frontend too. Build
one parameterised HTML email base (agri-green header band, single 600px column, one
harvest-amber CTA button, footer with support link + key-expiry note) plus a plain-text
alternative, with three variants: **buyer/seller welcome**, **staff invite**, **password
reset**. A `frappe.sendmail` wrapper sends them. `/set-password?key=…` page: password +
confirm, enforcing the Decisions §6 policy, with inline errors via the `FormState` pattern.
Endpoints: `set_password(key, pwd)` (validates key, sets password, flips `status` `invited →
active`, single-use, auto-login) and `request_password_reset(email)` (generic "if an account
exists…" response, `allow_guest`, rate-limited) and `resend_activation(email)` (same generic
response). Key expiry from site config. **Dev fallback:** when no SMTP is configured the
endpoints include the `/set-password` URL in their JSON response and the UI shows a "continue
here" link. Wire the existing `/forgot-password` stub to `request_password_reset`.

### C. Buyer login & registration

**Story 1.9 — Buyer registration.** `accreage_mart.api.auth.register_buyer` creates a `User`
(`status="invited"`, roles `Buyer` + `System Manager`) and a `Buyer Profile`
(`verified=false`), then triggers the welcome email. Wire the `/register` buyer branch to a
`register` server action (zod: full name, business name, email, mobile, district enum, buyer
type enum, terms checkbox — **no password field**). Terms links to a placeholder `/legal/terms`
page. On success the form shows a "check your email" state. Duplicate email: if the existing
account is still `invited`, resend the activation link; otherwise return "an account with this
email already exists — sign in instead". After activation (Story 1.8) the buyer lands on
`/buyer` and can transact immediately (Decisions §3).

### D. Seller login & registration

**Story 1.10 — Seller registration + pending gate.** `register_seller` creates a `User`
(`status="invited"`, roles `Seller` + `System Manager`) and a `Seller Profile`
(`verified=false`, `trustScore=0`), then triggers the welcome email. Wire the `/register`
seller branch (same common fields as buyer, no buyer type, optional short business
description). Extend `resolveRoute` so an activated but **unverified** seller hitting
`/seller/**` (except `/seller/profile`) is redirected to a new minimal `/seller/pending` page
explaining that staff verification is in progress. A verified seller passes straight through.
Seller login lands on `/seller` or `/seller/pending` accordingly.

### E. Staff / Admin login & registration

**Story 1.11 — Staff & admin provisioning.** Confirm (and test) that `/register` never offers
staff or admin. Wire the `/admin/staff` "Add staff member" dialog to
`accreage_mart.api.auth.create_staff` (caller must be `Admin` or `Administrator`; creates a
`User` `status="invited"` with `Staff` or `Admin` + `System Manager`, and triggers the
**staff-invite** email — no temp password is shown). Restrict `/admin/staff` and `/admin/users`
to `Admin` / `Administrator` in `resolveRoute` (a `Staff` user may enter `/admin` and the other
staff pages, but not these two). `Administrator` resolves to `admin` and lands on `/admin`.
Wire `setUserStatus` (suspend / reactivate) to `User.enabled` + the status field.

### F. Close-out

**Story 1.12 — Epic acceptance & manual E2E script.** Add to this `epic.md` a step-by-step
manual test script for the full journey per persona (register → receive link → set password →
auto-login → hit the guard for each area), since Playwright is not set up. Verify Frappe's
Activity Log records login, failed login, password reset, and staff creation (this is the
Module 3 "user activity" hook). Tick every story's acceptance criteria and set the epic to
done.

**Story 1.13 — Account approvals screen.** A minimal admin surface (new
`/admin/approvals` tab or a dedicated `/admin/accounts` page — decide during build, reuse the
existing approvals-queue components) listing `invited`/active but `verified=false`
buyers and sellers, with an "Approve" action calling
`accreage_mart.api.auth.verify_account(user)` (sets `profile.verified=true` and notifies the
user). This is what lifts the Story 1.10 seller gate in a demo.

## Backend wiring notes

- **DocTypes.** `Buyer Profile`: `user` (Link User, unique), `business_name`, `buyer_type`
  (Select: Hotel/Supermarket/Exporter/Processor/Other), `location`, `district` (Select — 25
  Sri Lankan districts), `verified` (Check). `Seller Profile`: `user` (Link User, unique),
  `business_name`, `location`, `district`, `description` (Small Text), `trust_score` (Float,
  default 0), `verified` (Check), `total_sales` (Currency, default 0). Field names are
  `snake_case` on the DocType; the frontend service layer maps to the `camelCase` in
  `types.ts`.
- **Roles.** Exported as fixtures in `hooks.py` so `bench migrate` recreates `Buyer` /
  `Seller` / `Staff` / `Admin` on any site. No `desk_access` restriction is set (users hold
  `System Manager` anyway — Decisions §1).
- **User creation.** Always `frappe.get_doc({"doctype": "User", "user_type": "System User",
  "enabled": 1, "send_welcome_email": 0, ...})` then `add_roles(...)` then generate a
  `reset_password_key` and email the link. `status="invited"` is a custom field on `User`
  (or reuse `User.enabled=0` + a flag — decide in Story 1.3; the frontend only sees the
  `status` string from `get_user_info`).
- **Login cookie bridge.** The `login` server action posts to Frappe `/api/method/login`,
  reads the `Set-Cookie: sid=…` header, and stores `sid` in the encrypted `iron-session`
  cookie. The browser never receives the Frappe `sid`. Confirm the exact header shape against
  the running site during Story 1.5.
- **Migrations the user must run:** see "Backend config checklist" above. After Story 1.3 and
  again after any DocType field change: `bench migrate` then `bench clear-cache`.
- **Scheduler hooks:** none in this epic. (Reset-key expiry is enforced by Frappe on use, not
  by a scheduled job.)
- **Backend tests:** written by Claude under `accreage_mart/accreage_mart/tests/` (or the
  app's test convention); the user runs
  `bench --site accreage-mart.localhost run-tests --app accreage_mart` and reports results
  into each story's `verify` block.
