# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working style (required)

When the user asks a question, **answer it first in plain text. Do not write or edit code.**
Wait for the user's explicit confirmation to proceed, then implement. This applies even when
the answer seems to obviously imply a code change — surface the plan, get the go-ahead, then code.

## Epic-driven development & testing (required)

All feature work is delivered **one epic at a time**, full-stack (frontend mock layer +
Frappe backend together), each epic following a fixed loop with a per-epic `stories.json`
state file.

- **Before starting or resuming any epic work, read [`docs/epics/README.md`](docs/epics/README.md)** —
  the canonical playbook: epic loop, `epic.md` template, `stories.json` schema, resume guide,
  epic index.
- **Before writing tests for a story, read [`docs/testing.md`](docs/testing.md)** — Vitest +
  React Testing Library, tests in top-level `tests/` mirroring `src/`, what to test and how.

Quick shape: pick an SRS module → finalize scope in plain text → write
`docs/epics/<nn>-<slug>/epic.md` + `stories.json` → per story: implement → test → verify →
`npm run build` green → update `stories.json` in the story's commit. Playwright is not set up;
ask before adding it.

## Two repositories, one project

This is the **frontend** repo. The full project lives at
`/Users/dasunedirisinghe/Documents/private workspace/final year project/project/` and the
**Frappe backend** is a separate app at:

```
/Users/dasunedirisinghe/Documents/frappe_docker/development/frappe-bench/apps/accreage_mart
```

- Frontend work happens **here** (`05_frontend/accreage-mart-fe`).
- Backend work happens in the `frappe_docker` path above. The frontend's `src/lib/services/*`
  and `src/lib/types.ts` are the contract the backend build must follow.

See **"Backend (Frappe)"** near the bottom of this file for how to run and edit backend code.

## Read before working

- `docs/base-context.md` — full project master context (summary of the skill below plus
  frontend/dataset deep-dives).
- `docs/epics/README.md` — epic management workflow (read before any epic/story work).
- `docs/testing.md` — test stack and conventions (read before writing tests).
- `docs/frontend-coding-guide.md` — how backend-wired feature code is shaped (server
  actions, `frappeFetch`, method/tag constants, `useActionState` forms). Follow it when
  writing real code; the mock service layer is legacy.
- `docs/frontend-backend-connection.md` — auth/session (`iron-session`), `middleware.ts`
  route guard, login flow, `frappeFetch` plumbing. The layer under the coding guide.
- `../../.claude/skills/accreage-mart-context/SKILL.md` — canonical, kept-in-sync knowledge
  base: 12 SRS modules, tech stack, route map, code conventions, backend wiring map, the real
  Prophet ML pipeline in `06_price_dataset/`, phase-1 constraints.
- `../../AGENTS.md` / `../../CLAUDE.md` — project-root entry points (both point to the skill).

Do **not** edit finalized docs in `../../01_project_source/` (Proposal, SRS v1.0) without asking.

## Commands

```bash
npm run dev        # dev server, http://localhost:3000
npm run build      # production build — must stay green (TS strict, zero errors)
npm run lint       # next lint (ESLint)
npm run test       # Vitest (added in epic 1, story 1 — see "Testing")
npm run test:watch # Vitest watch mode
```

"Verify" for an epic story means: its Vitest tests pass **and** `npm run build` stays green
**and** the relevant route works in `npm run dev`. See [`docs/testing.md`](docs/testing.md)
for the stack and where tests live. Do not add a different test runner without asking.

## Architecture

Next.js 15 (App Router, TypeScript strict) + Tailwind CSS 3 + shadcn/ui (`new-york`, Radix
primitives, hand-written under `src/components/ui/` — no shadcn CLI). Recharts, Sonner, lucide.
Path alias `@/*` → `src/*`. ~39 routes, all currently frontend-only.

### The mock data layer (central concept)

There is no backend yet. Data flows through one fixed pipeline:

```
page ("use client")  →  useDB() / useAuth()  →  src/lib/services/*.ts  →  src/lib/store.ts
                                                        │                (in-memory pub/sub,
                                                        │                 resets on reload)
                                                seeded by src/lib/mock-data.ts
```

- `src/lib/store.ts` — in-memory pub/sub store: `getDB()`, `mutate()`, `subscribe()`.
- `src/hooks/use-db.ts` — `useDB()` via `useSyncExternalStore`.
- `src/lib/services/` — `listings.ts`, `auctions.ts`, `orders.ts`, `engagement.ts`, `admin.ts`.
  **Pages call only this layer — never import `store.ts` from a page.** Each service file's
  header comment names the Frappe endpoint that will replace its body (signatures stay
  identical so wiring is drop-in). The full map is in the skill's "Backend wiring plan" table.
- `src/lib/types.ts` — authoritative domain types mirroring the SRS ERD. Keep these stable;
  future Frappe DocTypes must match these shapes. Change types here first, then ripple out.
- `src/lib/mock-data.ts` — Sri Lankan seed data with dates **relative to `Date.now()`** so
  auctions stay live/upcoming/ended correctly in demos.

### Routes & roles

Mock auth in `src/components/providers/auth-provider.tsx`: `useAuth()` → `user`,
`sellerProfile`, `buyerProfile`, `loginAs(role)`, `loginWithEmail()`, `logout()`. Five SRS
roles: Public, Buyer, Seller, Staff, Admin. Role switcher is in the site-header avatar menu;
demo sign-in cards on `/login`.

- `src/app/(site)/*` — public site (shared header/footer, no auth): landing, `marketplace`
  (+`[id]`), `auctions` (+`[id]`), `sellers/[id]` (public seller profile), `login`, `register`,
  `forgot-password`, `about`, `contact`.
- `src/app/buyer/*` — buyer only, gated by `DashboardShell`.
- `src/app/seller/*` — seller only, gated by `DashboardShell`.
- `src/app/admin/*` — `allowedRoles={["staff","admin"]}` (Staff and Admin share this area).

### Shared components — edit these, don't duplicate

In `src/components/shared/`. Notably `OrderDetailView` and `ChatView` each power **both**
buyer and seller pages via a `perspective` prop — extend the shared component, never fork it.
Also `ForecastChart` (seller dashboard + seller reports + admin reports), `ListingCard`,
`ListingGallery` (multi-image emoji/gradient carousel), `InquiriesPanel`, `ProfileForm`,
`RatingStars`, `StatCard`, `PageHeader`, `EmptyState`, `TimeLeft`.
`src/components/layout/dashboard-shell.tsx` is the sidebar + role-guard wrapper for all three
dashboards.

## Conventions

- Page files export **only** the default component (Next validates route exports). Shared UI
  goes in `src/components/shared/`.
- Dynamic routes use `useParams()` from `next/navigation`, not the `params` prop.
- Any `useSearchParams()` must be wrapped in `<React.Suspense>` (see marketplace page).
- Countdown / time-relative UI renders through `<TimeLeft>` (client-only after mount) to avoid
  hydration mismatches.
- Design tokens: agri-green primary `hsl(146 55% 24%)`, harvest-amber accent `hsl(38 92% 50%)`,
  warm neutral background, 60-30-10 rule. CSS vars + marquee animation in `src/app/globals.css`.
- Helpers live in `src/lib/utils.ts`: `formatLKR()`, `formatDate()`, `formatDateTime()`,
  `timeRemaining()`, `initials()`, `cn()`. Use them.
- No Google Fonts — system font stack is deliberate (offline-safe).
- Listing visuals are emoji + Tailwind gradient (`image`, `imageGradient` fields).
  `next.config.mjs` already allows Unsplash / placehold.co / Wikimedia image hosts.

## Backend (Frappe)

When the user asks for backend / API / DocType work, it happens in the separate Frappe app,
**not** in this repo.

### Locations

| What | Path |
|---|---|
| App source (edit here) | `/Users/dasunedirisinghe/Documents/frappe_docker/development/frappe-bench/apps/accreage_mart` |
| Bench root (host) | `/Users/dasunedirisinghe/Documents/frappe_docker/development/frappe-bench` |
| Same bench, inside container | `/workspace/development/frappe-bench` (host `~/Documents/frappe_docker` → `/workspace`) |
| Python package root | `apps/accreage_mart/accreage_mart/` (this is where `hooks.py` lives) |

- **App name (dotted path):** `accreage_mart` — e.g. `accreage_mart.api.suggest_price`.
  Note the frontend service comments abbreviate this as `accreage.api.*`; the real module
  path is `accreage_mart.api.*`.
- **Frappe module:** `Accreage Mart` (`modules.txt`). DocTypes live under
  `accreage_mart/accreage_mart/doctype/<snake_name>/`.
- Current state: bench-scaffold only — `hooks.py`, `modules.txt`, `patches.txt`, empty
  `config/`, `templates/`, `public/`. **No DocTypes, no `api/` module, no controllers yet.**

### Running bench — the USER does this, not you

**Do not run `bench` (or `docker exec ... bench`) yourself.** The user runs every bench
command — `migrate`, `build`, `clear-cache`, `run-tests`, the dev server — before testing.
Your job is to write/edit the app source; then tell the user which bench command to run
(e.g. "run `bench --site accreage-mart.localhost migrate` after this DocType change").

For reference, bench lives in the container `frappe_docker_devcontainer-frappe-1` and the
user invokes it as:
`docker exec -w /workspace/development/frappe-bench frappe_docker_devcontainer-frappe-1 bench --site accreage-mart.localhost <command>`

### Environment facts

- Frappe **v15** (bench 5.29.x), Python ≥3.10. Only `frappe` + `accreage_mart` on the site —
  **no ERPNext**.
- Site `accreage-mart.localhost`: `developer_mode=1` (edit DocTypes in the UI and they write
  JSON to the app), `server_script_enabled=1`, `ignore_csrf=1`, CORS allows
  `http://localhost:3000` (this frontend's dev origin).
- Frontend↔backend auth will be `POST /api/method/login` + session cookie; live chat/bids via
  `frappe.realtime` (socket.io on `:9000`).

### Backend code conventions

- **Formatting: ruff, and Frappe house style = real tabs, double quotes, line length 110**
  (`pyproject.toml`). `pre-commit` is configured (ruff + ruff-format + prettier + eslint) —
  install it once with `cd apps/accreage_mart && pre-commit install`.
- Keep DocType field names aligned with `src/lib/types.ts` shapes so the frontend service
  layer wires in without a translation layer.
- Whitelisted endpoints go in `accreage_mart/api/` (create it) as
  `@frappe.whitelist()`-decorated functions; reference them as `accreage_mart.api.<mod>.<fn>`.
- The `suggestPrice` / forecasting endpoint should ingest the real pipeline output in
  `../../06_price_dataset/prophet_data/*.csv` (see the skill) — not the interim report's
  synthetic prototype.
- `closeExpiredAuctions` becomes a `scheduler_events` hook (currently commented out in
  `hooks.py`), replacing the frontend's client-side timer.
- After changing DocTypes, fields, or fixtures: tell the user to run `bench migrate` then
  `bench clear-cache` (they run it, per above).

## Phase-1 constraints

English only (i18n deferred), manual payments with bank-slip proof upload (no gateway),
B2B bulk orders only, delivery arranged between parties.
