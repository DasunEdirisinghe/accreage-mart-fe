# ACCREAGE MART — MASTER CONTEXT (paste this in full as your first message in the new Cowork project)

This is my final year project — **Accreage Mart**, an AI-powered agricultural B2B marketplace for Sri Lanka (ITE 3999, BIT External, University of Moratuwa, Reg. E2140034). I'm starting a new Cowork project to build the Frappe backend (and continue the frontend). Here is everything you need to know before doing anything.

FIRST STEP: if this new project is connected to the same folder as before, read `.claude/skills/accreage-mart-context/SKILL.md` right now — it's the canonical, kept-in-sync knowledge base. `AGENTS.md` and `CLAUDE.md` at the project root both point to it too. If this is a *different* folder/project, everything you need is below.

---

## 1. Project summary

Accreage Mart connects wholesale sellers (farmers, cooperatives, producers) directly with institutional buyers (hotels, supermarkets, exporters, processors), removing intermediaries. Core differentiators: auction-based price discovery, AI (Facebook Prophet) price/demand forecasting, review sentiment analysis + dynamic seller trust scores, manual payment-proof workflow (no payment gateway in phase 1).

**Literature-review research gap:** no existing platform (Helaviru–LK, Ninjacart–IN, DeHaat–IN, eNAM–IN, Alibaba/1688–CN) combines auction-based price discovery + AI demand forecasting + trust mechanisms + Sri Lankan relevance in one tool.

**Timeline:** Feb–Dec 2026, interim report submitted at the midpoint, currently moving into full implementation.

---

## 2. Documentation paths (all inside the project root folder)

| Path | Contents | Status |
|---|---|---|
| `01_project_source/Project_Proposal.pdf` | Original project proposal | **FINALIZED — don't edit without asking** |
| `01_project_source/SRS_Software_Requirement_specification.pdf` | SRS v1.0 — the 12 functional modules, requirements, ERD, use-case/activity diagrams | **FINALIZED — don't edit without asking** |
| `04_interim_draft/Accreage_Mart_Interim_Report.docx` | Interim report | **DRAFT, not finalized** — still being refined |
| `05_frontend/accreage-mart-fe/` | Built Next.js frontend (see §4) | Built, git-tracked, production build passes |
| `05_frontend/accreage-mart-fe/README.md` | Frontend-specific setup + Frappe-wiring notes | Reference when wiring backend |
| `06_price_dataset/` | Real HARTI price-scraping + Prophet forecasting pipeline (see §5) | Own git repo, working pipeline with real output |
| `06_price_dataset/README.md` | Full pipeline explanation, data-quality fixes, design decisions | Read directly for detail |
| `06_price_dataset/COMMANDS.md` | Copy-paste commands to run each pipeline stage | Read directly when running scripts |
| `.claude/skills/accreage-mart-context/SKILL.md` | Canonical project knowledge base (this doc is a snapshot of it) | Kept in sync — treat as source of truth |
| `AGENTS.md` / `CLAUDE.md` (project root) | Entry points pointing agents to the SKILL.md | — |

**Important discrepancy to know about:** the interim report describes a *simplified* forecasting prototype (min price / max price / diesel price regressor, MAPE 4.74%, R² 0.78 on a 90-day holdout). Since then, a much more substantial **real** data pipeline has been built in `06_price_dataset/` — see §5. Treat `06_price_dataset` as the authoritative current forecasting data source; the interim report's figures are from an earlier, simpler prototype and haven't been updated to reflect it yet.

---

## 3. Tech stack (authoritative)

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router, TypeScript) — **not** plain React, despite what older docs say |
| Styling | Tailwind CSS 3 + shadcn/ui (hand-written Radix-based components, no CLI) |
| Charts/UX | Recharts, Sonner (toasts), lucide-react (icons) |
| Backend (to build) | Frappe framework (Python) v15+, REST API + frappe.realtime (socket.io) for live chat/bidding |
| Database | MariaDB |
| ML | Facebook Prophet (Python: pandas, prophet, plotly) |
| Infra | Docker, Gunicorn, Nginx, cloud + SSL |
| External services | Send.lk (SMS), Gmail SMTP (email) |

---

## 4. Frontend — full detail (`05_frontend/accreage-mart-fe`)

Frontend-only, git-tracked, production build passes clean (`npm run build`), TypeScript strict mode zero errors. 39 routes. Uses an **interactive in-memory mock data layer** — no backend calls yet. Every data read/write goes through `src/lib/services/*.ts`, and each service function has a comment naming the exact future Frappe endpoint it should be replaced with. This is the wiring contract for the backend build.

### Roles (mock auth, `src/components/providers/auth-provider.tsx`)
Five roles per the SRS: **Public** (guest, browse only), **Buyer**, **Seller**, **Staff**, **Admin**. `useAuth()` exposes `user`, `sellerProfile`, `buyerProfile`, `loginAs(role)`, `loginWithEmail(email)`, `logout()`. Role switcher lives in the site header avatar menu; one-click demo sign-in cards on `/login`. Staff and Admin share `/admin/*` (`allowedRoles={["staff","admin"]}`); Buyer/Seller each have their own single-role area gated by `DashboardShell`.

### Route map

**Public site** (`(site)` layout group, shared header/footer, no auth):
- `/` — landing page: hero (Unsplash background + live-auction teaser), audience marquee, browse-by-category grid, featured listings, "how it works", AI/Prophet promo banner, announcements feed.
- `/marketplace` — full listings browser: search, category/district/selling-type/max-price filters, organic toggle, sort, `ListingCard` grid.
- `/marketplace/[id]` — listing detail: image gallery (`ListingGallery`), price/AI-suggested range, seller card, reviews, order dialog (direct) or auction link.
- `/auctions` — Live / Upcoming / Past tabs.
- `/auctions/[id]` — live auction room: highest bid, AI fair-value estimate, countdown, bid history table, bid form, winner panel.
- `/sellers/[id]` — **public seller profile page** (added after initial build): stats, verified badge, their approved listings, their reviews with AI sentiment badges, message-seller action.
- `/login` — mock email/password + 4 one-click demo role cards.
- `/register` — buyer/seller role picker + business details form (logs you in as the demo role).
- `/forgot-password` — two-step mock reset flow.
- `/about`, `/contact` — static info/contact form pages.

**Buyer area** (`/buyer/*`, role: buyer only):
- `/buyer` — dashboard: stat cards (active orders, live bids, total spend, reviews given), recent orders, auction activity, recommended listings.
- `/buyer/orders` — orders table → `/buyer/orders/[id]` shared `OrderDetailView` (buyer perspective): status timeline, payment-proof upload, post-purchase review form.
- `/buyer/bids` — every bid placed, Leading/Outbid/Won/Lost status.
- `/buyer/chat` — `ChatView` (buyer perspective).
- `/buyer/reviews` — reviews left, with AI sentiment badges.
- `/buyer/inquiries` — shared `InquiriesPanel`: submit + track inquiries.
- `/buyer/profile` — shared `ProfileForm`.

**Seller area** (`/seller/*`, role: seller only):
- `/seller` — dashboard: stat cards, Prophet forecast chart, incoming orders, listing-status table.
- `/seller/listings` — listings table → `/seller/listings/new` create form (mandatory Direct/Auction selling-type, conditional auction fields, "Get AI price suggestion" button calling the mock `suggestPrice` service, submits as "Pending Approval").
- `/seller/orders` — orders table → `/seller/orders/[id]` shared `OrderDetailView` (seller perspective): confirm/decline, review/approve payment proof, mark completed.
- `/seller/auctions` — seller's auctions table.
- `/seller/inventory` — stock table with progress bars, low-stock badges, inline quantity editor.
- `/seller/reports` — revenue/trend stat cards + Prophet forecast chart with commodity picker + transaction table.
- `/seller/chat` — `ChatView` (seller perspective).
- `/seller/profile` — shared `ProfileForm`.

**Admin/Staff area** (`/admin/*`, roles: staff + admin):
- `/admin` — ops dashboard: platform stats + action-queue list with live counts.
- `/admin/approvals` — listing approval queue (Pending/Reviewed tabs, approve or reject-with-feedback).
- `/admin/auctions` — auction approval queue + full auctions table.
- `/admin/payments` — payment-proof review queue + history (approve → order paid + invoice; reject → buyer re-uploads).
- `/admin/users` — all-users table with status management (active/suspended/deactivated).
- `/admin/inquiries` — all inquiries, inline response + resolve/in-progress controls.
- `/admin/reviews` — feedback moderation: AI sentiment badges, flag/unflag, delete.
- `/admin/content` — Pages & Policies (CMS-style, publish toggle) + Announcements tabs.
- `/admin/staff` — staff account table + add-staff dialog + suspend/reactivate.
- `/admin/reports` — platform stats, sales-by-category chart, Prophet forecast chart.

### Shared components to know (don't duplicate — edit these when changing shared behavior)
- `OrderDetailView` — ONE component powers both buyer and seller order-detail pages via a `perspective` prop.
- `ChatView` — ONE component powers both buyer and seller chat pages via a `perspective` prop.
- `InquiriesPanel`, `ProfileForm` — shared across buyer/seller.
- `ForecastChart` — Recharts Prophet-style chart, used on seller dashboard, seller reports, admin reports.
- `ListingCard`, `ListingGallery` (multi-image emoji/gradient placeholder carousel), `RatingStars`, `StatCard`, `PageHeader`, `EmptyState`, `TimeLeft` (countdown, renders after mount to avoid hydration mismatch).
- `DashboardShell` — sidebar + role-guard wrapper for all three dashboard layouts.

### Data layer (`src/lib/`)
- `types.ts` — authoritative domain types mirroring the ERD (`User`, `SellerProfile`, `BuyerProfile`, `Category`, `Listing` [includes optional `gallery?: string[]`], `Auction`, `Bid`, `Order`, `PaymentProof`, `Review`, `ForecastPoint`/`CategoryForecast`, `Inquiry`, `ChatThread`/`ChatMessage`, `AppNotification`, `ContentPage`, `Announcement`). Keep Frappe DocTypes in sync with these shapes.
- `mock-data.ts` — seeded Sri Lankan sample data, dates relative to `Date.now()` so auctions stay live/upcoming/ended correctly.
- `store.ts` — in-memory pub/sub store (`getDB()`, `mutate()`, `subscribe()`), resets on reload (no persistence, by design).
- `hooks/use-db.ts` — `useDB()` subscribes components via `useSyncExternalStore`.
- `services/*.ts` — `listings.ts`, `auctions.ts`, `orders.ts`, `engagement.ts`, `admin.ts`. **This is the only layer pages are allowed to call.** Frappe wiring map:

| Frontend service | Frappe endpoint (to build) |
|---|---|
| `listings.createListing` | `POST /api/resource/Listing` |
| `listings.reviewListing` | `PUT /api/resource/Listing/<id>` (staff) |
| `listings.suggestPrice` | `GET /api/method/accreage.api.suggest_price` (should read from `06_price_dataset` output) |
| `auctions.placeBid` | `POST /api/method/accreage.api.place_bid` + realtime channel |
| `auctions.closeExpiredAuctions` | Frappe scheduled job (server-side) |
| `orders.placeOrder` | `POST /api/resource/Order` |
| `orders.uploadPaymentProof` | `POST /api/method/upload_file` + link to Order |
| `orders.reviewPaymentProof` | `PUT /api/resource/Payment Proof/<id>` |
| auth (`auth-provider.tsx`) | `POST /api/method/login`, session cookie |
| chat, live bids | `frappe.realtime` (socket.io) |

### Hard conventions to preserve
- Never bypass the service layer from a page.
- Page files export only the default component; shared UI lives in `components/shared/`.
- Dynamic routes use `useParams()`, not the params prop; any `useSearchParams()` is wrapped in `<React.Suspense>`.
- Countdown/time UI renders via `<TimeLeft>` (client-only after mount).
- Design tokens: agri-green primary `hsl(146 55% 24%)`, harvest-amber accent `hsl(38 92% 50%)`, warm neutral background, 60-30-10 rule. CSS vars + marquee animation in `src/app/globals.css`.
- Helpers: `formatLKR()`, `formatDate()`, `formatDateTime()`, `timeRemaining()`, `initials()` in `lib/utils.ts`.
- No Google Fonts (system font stack, deliberate).

### Known gaps for backend integration
Real auth session, real file upload (replacing the "type a filename" payment-proof stub), `frappe.realtime` for chat/bidding instead of the local store, real image uploads (config already allows external hosts), a scheduled Frappe job to replace client-side `closeExpiredAuctions`.

---

## 5. Real ML data pipeline (`06_price_dataset`) — READ THIS BEFORE TOUCHING FORECASTING

Its own git repo nested in the project folder, with its own `README.md` and `COMMANDS.md` — read those directly for full detail. Summary:

**What it is:** scrapes real Sri Lankan government wholesale price data from HARTI (Hector Kobbekaduwa Agrarian Research and Training Institute, harti.gov.lk daily "Wholesale Prices" PDF reports) and turns it into Prophet-ready forecasts. This **supersedes** the interim report's simplified min/max/diesel-price-regressor prototype (MAPE 4.74%) — that figure is from an earlier, simpler version; this pipeline is the current, real, authoritative data source.

**Four-stage pipeline** (`scripts/`, all idempotent):
1. `download_pdfs.py` → `PDFs/<year>/<month>/<date>.pdf` — 826 PDFs downloaded, 2024-01-01 to present. Handles HARTI's inconsistent hosting (wrong month folders, filename template changed 2026-04-01) by trying an ordered list of plausible URLs per date.
2. `batch_process_pdfs.py` / `batch_process_pdfs_parallel.py` → `price_data/<item>.json` — per-item price history. Parses two tables: Pettah (rice/subsidiary crops, native min/max/avg) and Peliyagoda (vegetables/fruits, range-only, avg = midpoint). Pages classified by header content, not fixed index; item names normalized to merge OCR/text-wrapping variants; atomic writes; excludes 9 permanently-discontinued/insufficient items (documented with reasons in the README).
3. `prepare_prophet_data.py` → `prophet_data/<item>.csv` — Prophet-format `ds`/`y` plus `item`, `category`, `market`, `unit`, `min_price`, `max_price`, `average_computed` metadata columns.
4. `generate_forecasts.py` → `forecast_report.html` — self-contained interactive Plotly report (~10-15MB), one chart per item, default 30-day forecast, 90% uncertainty interval, hoverable, filterable, "View large" zoom per item.

**Dataset scope:** 65 commodities (after excluding 9 unsuitable ones — see README's exclusion table for exact reasons per item). Suitability originally scored via `prophet_data_sufficiency.xlsx` (Good/Marginal/Not Suitable on non-null count, coverage %, span, max gap).

**Model config:** Prophet defaults (`changepoint_prior_scale=0.05`, additive seasonality) — a tuned variant was tried and reverted per project decision. Uncertainty = Prophet's native `yhat_lower`/`yhat_upper` on the average-price series (no separate min/max model).

**Requirements:** `pdfplumber`, `requests`, `pandas`, `prophet`, `plotly` (`scripts/requirements.txt`); a Python venv already exists at `06_price_dataset/env/`.

**Relevance to the Frappe backend:** this is what the forecasting/`suggest_price` endpoint should ingest — the `prophet_data/*.csv` files and the logic in `generate_forecasts.py` are the starting point for whatever server-side forecasting service gets built for the frontend's `listings.suggestPrice` call.

---

## 6. The 12 SRS modules (functional scope of the whole system)

1. **Listing management** — Direct/Auction selling type (mandatory), Pending Approval workflow, AI price suggestion (seller keeps final control).
2. **Account/profile management** — role-based dashboards, admin activate/suspend/deactivate.
3. **User role management** — 5 roles: Public, Buyer, Seller, Staff, Admin.
4. **Auction management** — staff approval required, live bidding, auto-close + winner notification, bid history.
5. **Order management & payment proof** — pending_confirmation → confirmed → payment_review → paid → completed (or cancelled). Manual payments phase 1: buyer uploads bank-slip proof, seller/staff approve/reject, approval decrements stock + generates invoice.
6. **Predictive pricing & forecasting** — Prophet forecasts + price suggestions (now backed by the real `06_price_dataset` pipeline).
7. **Report management** — sales/revenue, user activity, AI market analysis, dispute tracking.
8. **Reviews & feedback** — verified-purchase only, AI sentiment analysis, flagging/moderation, dynamic trust score.
9. **Inquiry management** — auto-routed by category, status tracking.
10. **Chat** — real-time buyer↔seller messaging (frappe.realtime in production).
11. **Notification management** — email (Gmail SMTP) + SMS (Send.lk) + in-app.
12. **Web content management** — staff-managed policies, guidelines, announcements.

---

## 7. Phase-1 constraints & decisions

- English only (Sinhala/Tamil localization deferred, mention as future work).
- Manual payments with proof upload; no payment gateway.
- Delivery arranged between parties; logistics is an optional add-on.
- B2B only, bulk minimum order quantities.

## 8. Writing/documentation conventions

- Reports follow IEEE referencing, Times New Roman 12pt, University of Moratuwa format.
- Interim report structure: Intro → Literature review (5 systems + gap table) → Project plan & initial design (software/database/ML components, Agile, test plan).
- When citing model performance in documents, flag that the interim report's MAPE 4.74%/R² 0.78 figures are from the earlier simplified prototype, and that `06_price_dataset` is the current real pipeline — update figures from there once its own evaluation is documented.

---

Please read `.claude/skills/accreage-mart-context/SKILL.md` now if available (this document is a snapshot of it plus the frontend/dataset deep-dives), then let's get started.