# Accreage Mart — Frontend

Next.js frontend for **Accreage Mart**, the AI-powered agricultural B2B marketplace for Sri Lanka
(Final Year Project, ITE 3999 — University of Moratuwa).

Frontend-only build with an **interactive in-memory mock data layer**. Every module from the SRS
is navigable: listings with staff approval, live auctions with bidding, orders with payment-proof
workflow, Prophet-style forecast dashboards, reviews with AI sentiment, inquiries, chat, and full
admin/staff panels.

## Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS 3 + shadcn/ui (Radix primitives)
- Recharts (forecast & report charts)
- Sonner (toasts)

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Demo accounts

Use the **quick sign-in cards on /login**, or the role switcher in the avatar menu (top-right)
to jump between Buyer / Seller / Staff / Admin instantly.

## Where things live

```
src/
  app/
    (site)/        public pages: landing, marketplace, auctions, auth, about, contact
    buyer/         buyer dashboard: orders, bids, chat, reviews, inquiries, profile
    seller/        seller dashboard: listings (+create with AI price), orders, auctions,
                   inventory, reports & forecasts, chat, profile
    admin/         staff/admin: approvals, auction review, payment review, users,
                   inquiries, feedback moderation, web content, staff, reports
  components/
    ui/            shadcn/ui primitives
    shared/        listing card, forecast chart, chat view, order detail, etc.
    layout/        site header/footer, dashboard shell (sidebar + role guard)
  lib/
    types.ts       domain types mirroring the ERD (keep in sync with Frappe DocTypes)
    mock-data.ts   Sri Lankan seed data (relative dates keep auctions "live")
    store.ts       in-memory interactive store (pub/sub)
    services/      listings / auctions / orders / engagement / admin
  hooks/use-db.ts  React subscription to the store
```

## Wiring the Frappe backend later

The UI never touches the store directly — it goes through `src/lib/services/*`. To wire the
backend, replace each service function body with a Frappe REST call and keep the signature:

| Service | Mock today | Frappe later |
|---|---|---|
| `listings.createListing` | store mutation | `POST /api/resource/Listing` |
| `listings.suggestPrice` | forecast lookup | `GET /api/method/accreage.api.suggest_price` |
| `auctions.placeBid` | store mutation | `POST /api/method/accreage.api.place_bid` + realtime |
| `orders.placeOrder` | store mutation | `POST /api/resource/Order` |
| `orders.uploadPaymentProof` | store mutation | `POST /api/method/upload_file` + link |
| auth (`auth-provider.tsx`) | role switcher | `POST /api/method/login`, session cookie |
| chat / live bids | store polling | `frappe.realtime` (socket.io) |

Then swap `useDB()` reads for data-fetching hooks (SWR / React Query) per page.

Notes:
- Store state resets on full page reload (by design — no persistence).
- `next.config.mjs` already allows Unsplash/placehold image hosts if you replace emoji
  visuals with real photos.
