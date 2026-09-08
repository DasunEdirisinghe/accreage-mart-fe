# Frontend ↔ Backend Connection Architecture

How the Accreage Mart frontend connects to the Frappe backend: session handling, protected
routes, and how a new feature adds a Frappe call. Adapted from a sibling Frappe + Next.js
project to this project's context.

> **Status.** Target architecture — **not built yet**. Today auth is mocked in
> `src/components/providers/auth-provider.tsx` (`useAuth()`, `loginAs(role)`,
> `loginWithEmail()`). That mock is **legacy**; it is replaced by what this document
> describes when the auth epic runs. Until then, treat this as the spec to build to.

Companion docs:
- [`frontend-coding-guide.md`](frontend-coding-guide.md) — how a feature's *code* is shaped
  (server actions, `frappeFetch`, method/tag constants, forms). This doc is the *plumbing*
  underneath it.
- [`epics/README.md`](epics/README.md) — how the work is planned and tracked.

---

## Stack overview

| Piece | Choice |
|---|---|
| Frontend | Next.js 15 App Router, TypeScript strict, Tailwind CSS 3, shadcn/Radix (`new-york`) |
| Auth/session | `iron-session` — an encrypted, `httpOnly` frontend cookie named `accreage_session` |
| Backend | Frappe v15 app `accreage_mart`, site `accreage-mart.localhost` |
| API style | Frappe **whitelisted methods** (`accreage_mart.api.<module>.<fn>`), not generic REST CRUD |
| Backend URL env | `NEXT_PUBLIC_FRAPPE_URL` (e.g. `http://accreage-mart.localhost:8000`) |
| Realtime | `frappe.realtime` (socket.io on `:9000`) for live chat / auction bids |

The browser **never** sees the raw Frappe `sid` cookie. Login happens server-side; the Frappe
`sid` is copied into the encrypted `iron-session` cookie; every authenticated backend call is
made from server code through `frappeFetch`.

CORS on the site already allows `http://localhost:3000` (this frontend's dev origin);
`ignore_csrf=1` on the dev site.

---

## Key files (to create)

Frontend:

| File | Role |
|---|---|
| `src/middleware.ts` | Central route guard for public vs protected routes. (The sibling project calls this `proxy.ts`; in Next.js the file is `middleware.ts`.) |
| `src/lib/session.ts` | `iron-session` setup, `SessionData` type, `getSession()` / `ClientSession` helpers. |
| `src/lib/frappe.ts` | Frappe URL builder + authenticated fetch wrapper (`frappeFetch`). |
| `src/lib/methods.ts` | All whitelisted Frappe method names, as `enum`s. |
| `src/lib/tags.ts` | Cache tag constants for `next.tags` / `revalidateTag`. |
| `src/lib/current-user-info.ts` | Cached (`React.cache`) request for the current user + profile + stage. |
| `src/app/actions/auth.ts` | Login / logout server actions. |
| `src/app/actions/*.ts` | Per-feature server actions (mutations) and server reads. |
| `src/app/buyer/**`, `src/app/seller/**`, `src/app/admin/**` | Authenticated app pages (guarded by middleware, not per-page). |
| `src/app/api/**` | Route handlers for auth-bridge / proxy / file-upload flows that can't be server actions. |

Backend (in the `accreage_mart` app — see repo `CLAUDE.md` → "Backend (Frappe)"):

| File | Role |
|---|---|
| `accreage_mart/api/<feature>.py` | Thin `@frappe.whitelist()` wrappers — parse args, call the controller, return `{ "message": result }`. |
| `accreage_mart/<feature>/controller.py` | Business logic: validation, queries, mutations. |
| `accreage_mart/utils/profile_utils.py` | Default profile / role-scoping helpers (buyer vs seller vs staff). |
| `accreage_mart/api/auth.py` | `get_user_info` endpoint the frontend guard calls. |

> Repo convention: whitelisted endpoints are referenced as `accreage_mart.api.<mod>.<fn>`.
> Keep DocType field names aligned with `src/lib/types.ts`.

---

## Request flow

```text
Browser
  -> Next.js route / page / server action
  -> src/middleware.ts checks whether the route is public
  -> protected route requires accreage_session.frappeSid
  -> server code calls frappeFetch(...)
  -> frappeFetch sends  Cookie: sid=<frappeSid>  to Frappe
  -> Frappe whitelisted method runs as the logged-in user
  -> Frappe returns  { "message": result }
  -> frontend reads data.message
```

New backend calls hit:

```text
/api/method/<method-path>
```

where the method path is one of the constants in `src/lib/methods.ts`, e.g.:

```text
accreage_mart.api.listings.get_list
accreage_mart.api.auctions.place_bid
accreage_mart.api.orders.create
accreage_mart.api.auth.get_user_info
```

---

## Session model

`src/lib/session.ts`:

```ts
export type SessionData = {
    frappeSid?: string;
    user?: {
        name?: string;
        email?: string;
        role?: "buyer" | "seller" | "staff" | "admin";
        currentUserInfo?: CurrentUserInfo | null;
    };
    isLoggedIn: boolean;
    impersonation?: { by: string; readOnly: boolean };
};
```

Behavior:

- Cookie `accreage_session` is `httpOnly`, `sameSite: "lax"`, `secure` in production.
- The browser gets the Next app session cookie — **never** a browser-readable Frappe `sid`.
- Server components, server actions, route handlers, and `middleware.ts` read it via
  `getSession()`.
- `ClientSession` deliberately omits `frappeSid` before any data crosses into a client
  component.

---

## Login flow

`src/app/actions/auth.ts`:

1. Login form posts to a server action.
2. Server action validates `usr` / `pwd` with zod.
3. Calls Frappe `login` via `frappeFetch(AUTH_METHODS.LOGIN, ...)`.
4. Reads Frappe's `set-cookie` header.
5. Extracts `sid`, `user_id`, `full_name`.
6. Saves them into the encrypted `iron-session`.
7. Calls `getCurrentUserInfo()`, stores profile + role + stage in the session.
8. Redirects to the role's home (`/buyer`, `/seller`, or `/admin`).

Logout:

1. Read the local session.
2. If `frappeSid` exists, call Frappe `logout`.
3. Destroy the local `iron-session`.
4. Redirect to `/login`.

---

## Protected routes

Centralized in `src/middleware.ts`. **Do not add per-page auth guards** for normal
authenticated pages — put them under a protected prefix and let middleware handle it. This
replaces the current client-side `DashboardShell` role gate.

### Protected prefixes

- `/buyer/**` — buyer
- `/seller/**` — seller
- `/admin/**` — staff and admin

### Public routes

A `PUBLIC` set + `isPublic(pathname)` helper. Includes:

- `/`, `/about`, `/contact`
- `/marketplace`, `/marketplace/[id]`
- `/auctions`, `/auctions/[id]`
- `/sellers/[id]`
- `/login`, `/register`, `/forgot-password`
- `/api/auth/**`
- static assets and Next internals

Add new public routes to `PUBLIC` or `isPublic()`.

### Guard logic (non-public routes)

1. Read `accreage_session`.
2. No `session.frappeSid` → redirect `/login?next=<original-path>`.
3. Call `getCurrentUserInfo()` against Frappe; store `message` in
   `session.user.currentUserInfo`.
4. Role vs prefix mismatch (e.g. a buyer hitting `/seller/**`) → redirect to the user's own
   home.
5. Seller with an unverified / pending profile → redirect to a pending-approval page.
6. Suspended / inactive account → redirect to a suspended page.
7. Otherwise allow.

> The backend enforces real authorization. Frontend guards are for UX and navigation only.
> Exact stages (pending approval, suspended, onboarding) are defined against the SRS in the
> auth epic — the list above is the shape, not the final set.

---

## frappeFetch

`src/lib/frappe.ts` is the only standard backend fetch helper.

```ts
export const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL!;

export function frappeUrl(path: string) {
    if (path.startsWith("http")) return path;
    const clean = path.startsWith("/") ? path : `/api/method/${path}`;
    return `${FRAPPE_URL}${clean}`;
}

type FrappeFetchInit = Omit<RequestInit, "body"> & {
    body?: Record<string, unknown>;
    next?: { tags?: string[]; revalidate?: number | false };
};

export async function frappeFetch(pathOrMethod: string, init: FrappeFetchInit = {}) {
    const { body, headers, next, ...rest } = init;

    // Server-side only: attach the Frappe sid from the iron-session.
    const session = await getSession();
    const cookie = session.frappeSid ? `sid=${session.frappeSid}` : "";

    const res = await fetch(frappeUrl(pathOrMethod), {
        ...rest,
        headers: {
            "Content-Type": "application/json",
            ...(cookie ? { Cookie: cookie } : {}),
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        next,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Frappe request failed: ${res.status} ${text}`);
    }

    return res;
}
```

Rules:

- **Server-only.** `frappeFetch` reads the session cookie; never import it into a client
  component.
- Callers do `const data = await res.json()` then read `data.message`.
- Errors throw `Error("Frappe request failed: <status> <body>")`; server actions catch and
  run the body through `parseFrappeError()` (see the coding guide).
- Reads pass `next: { tags: [...] }`; mutations call `revalidateTag(...)` after success.

> The snippet above is the intended shape; the exact login `set-cookie` parsing, error
> envelope, and realtime auth are confirmed against the backend when the auth epic builds
> them.

---

## Adding a Frappe call to a new feature — checklist

1. Add the method path constant to `src/lib/methods.ts`.
2. Add cache tag(s) to `src/lib/tags.ts`.
3. Write the server action / read in `src/app/actions/<feature>.ts` using `frappeFetch`
   (validate input with zod; return a `FormState` for mutations; return a safe fallback for
   reads).
4. Build the matching `@frappe.whitelist()` wrapper in `accreage_mart/api/<feature>.py` and
   logic in the controller; keep field names aligned with `src/lib/types.ts`.
5. If the feature adds pages, place them under `/buyer`, `/seller`, or `/admin` so middleware
   guards them — or add a genuinely public route to `isPublic()`.
6. Tests per [`testing.md`](testing.md): mock `frappeFetch` for the action/read; the user
   runs `bench run-tests` for the backend.
