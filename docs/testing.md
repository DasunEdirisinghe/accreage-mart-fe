# Testing Guide

How tests are written and run in the Accreage Mart frontend. **Read this before writing tests
for an epic story.** `CLAUDE.md` only carries a pointer to it.

Related: [`epics/README.md`](epics/README.md) — the epic loop that requires these tests.

---

## Stack

| Concern | Tool |
|---|---|
| Test runner | **Vitest** |
| Component testing | **@testing-library/react** + **@testing-library/user-event** |
| DOM | **jsdom** |
| Assertions | Vitest `expect` + **@testing-library/jest-dom** matchers |
| E2E (multi-page flows) | **Not set up.** Add Playwright only when an epic truly needs it, and ask the user first. |

Do not add Jest, Cypress, or another runner without asking.

---

## Where tests live

A **top-level `tests/` directory that mirrors `src/`**. Do **not** co-locate `*.test.ts`
inside `src/`.

```
tests/
  setup.ts                          # global setup: jest-dom, store reset
  lib/
    services/
      listings.test.ts              # ← src/lib/services/listings.ts
      auctions.test.ts
    store.test.ts                   # ← src/lib/store.ts
    utils.test.ts                   # ← src/lib/utils.ts
  components/
    shared/
      ListingCard.test.tsx          # ← src/components/shared/ListingCard.tsx
  app/
    marketplace.test.tsx            # page-level
```

Test file for `src/x/y.ts` → `tests/x/y.test.ts` (or `.test.tsx` for components).

---

## What to test, in priority order

1. **Service layer** (`src/lib/services/*`) — the Frappe contract. Every exported function:
   happy path, empty/not-found, and any filtering/sorting/mutation logic.
2. **Store** (`src/lib/store.ts`) — `getDB` / `mutate` / `subscribe` semantics.
3. **Shared components** (`src/components/shared/*`) — rendering from props, key interactions,
   the `perspective` split on `OrderDetailView` / `ChatView`.
4. **Pages** — only the logic pages own (guards, param handling, empty states). Keep light.

Utilities in `src/lib/utils.ts` (`formatLKR`, `formatDate`, `timeRemaining`, …) get a quick
table-driven test each.

---

## Rules

- **Reset the in-memory store between tests.** The store is module-level singleton state; a
  leak from one test silently corrupts the next. `tests/setup.ts` handles this globally —
  don't rely on test order.
- **Go through the service layer**, never `store.ts` directly, in component/page tests — same
  rule the app follows.
- Mock `useAuth()` for role-gated UI; test each relevant role.
- Time-relative UI (`<TimeLeft>`, countdowns) — freeze time with `vi.useFakeTimers()` /
  `vi.setSystemTime()`.
- Keep `src/lib/types.ts` authoritative — if a test needs a shape that doesn't exist, fix the
  type first, then the test.
- A story is not done until its tests pass **and** `npm run build` is green.

---

## Commands

```bash
npm run test        # run once (CI-style)
npm run test:watch  # watch mode during development
npm run test -- tests/lib/services/auctions.test.ts   # single file
```

---

## Backend (Frappe) tests

Backend tests live in the separate `accreage_mart` app and use Frappe's own test runner.
**The user runs them**, not Claude:

```
docker exec -w /workspace/development/frappe-bench frappe_docker_devcontainer-frappe-1 \
  bench --site accreage-mart.localhost run-tests --app accreage_mart
```

Claude writes the test files; the user runs the command and reports the result, which goes
into the story's `verify` block in `stories.json`.

---

## First-time setup

The Vitest tooling does not exist yet. It is installed as **Epic 1, Story 1**:

- deps: `vitest`, `@vitejs/plugin-react`, `@testing-library/react`,
  `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`
- `vitest.config.ts` with `environment: "jsdom"`, `setupFiles: ["tests/setup.ts"]`, the
  `@/*` → `src/*` alias
- `tests/setup.ts`
- `package.json` scripts: `test`, `test:watch`
- a smoke test (`tests/lib/utils.test.ts`) proving the harness runs

After that story, every subsequent story ships its own tests.
