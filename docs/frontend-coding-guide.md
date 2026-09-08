# Frontend Coding Guide

How to write real (Frappe-wired) frontend code in this repo. Adapted from a sibling Frappe +
Next.js project to Accreage Mart's context. **Follow this when implementing features** — it is
independent of the epic workflow ([`epics/README.md`](epics/README.md)), which governs *how
work is planned and tracked*; this governs *how the code is shaped*.

> **Status.** This is the **target architecture for backend-wired features**. The current
> mock layer (`src/lib/services/*` → `src/lib/store.ts` → `src/lib/mock-data.ts`, consumed via
> `useDB()`) is **legacy** and is replaced feature-by-feature as each feature is wired to
> Frappe. Do not add new features to the mock layer; build them per this guide. Untouched
> mock features keep working until their epic reaches them.

---

## Layering

```
Server Component (page / list container)
  └─ src/app/actions/<feature>.ts        server actions + server-side reads ('use server')
       └─ src/lib/frappe.ts              the one Frappe fetch wrapper (frappeFetch)
            └─ Frappe:  accreage_mart.api.<module>.<fn>

Client Component (forms, interactive UI)
  └─ useActionState(<server action>)     forms
  └─ props from the Server Component     data in
```

- **Server Components fetch.** Pages and list containers are Server Components that call a
  server action / server read directly and pass data down as props.
- **Client Components interact.** `"use client"` only where you need state, effects, or
  events (forms, filters, dialogs, charts). They receive data via props and mutate via
  server actions.
- **No client-side data store for wired features.** No `useDB()`, no in-memory store. Server
  cache + `revalidateTag` is the state model.

---

## Directory layout

```
src/
  app/
    actions/
      <feature>.ts              # server actions + server reads for one feature
    <route>/page.tsx            # Server Component; calls actions/, renders containers
  lib/
    frappe.ts                   # single Frappe fetch wrapper
    methods.ts                  # ALL backend method path constants
    tags.ts                     # ALL cache tag constants
    frappe-error.ts             # parseFrappeError()
    filter-parser.ts            # parseFilterParams() for list queries
    types.ts                    # authoritative domain types (SRS ERD) — keep as-is
    utils.ts                    # formatLKR, formatDate, timeRemaining, cn, ...
  types/
    <feature>.type.ts           # backend response shapes for one feature
  components/
    pages/
      <feature>/
        <Feature>ListContainer.tsx   # Server Component: fetch + layout
        <Feature>List.tsx            # presentational table/list
        New<Feature>Form.tsx         # client form via useActionState
    shared/                     # cross-feature UI (existing; ForecastChart, ListingGallery, ...)
    ui/                         # shadcn primitives (existing)
    data-table/                 # generic table shell
  hooks/                        # shared hooks
```

### File responsibilities

| File | Holds |
|---|---|
| `src/lib/frappe.ts` | One fetch wrapper: base URL, session cookie, error normalisation, `next` cache options passthrough. Nothing else calls `fetch` to Frappe. |
| `src/lib/methods.ts` | Every backend method path, as `enum`s. No method string is written anywhere else. |
| `src/lib/tags.ts` | Every `revalidateTag` / `next.tags` cache tag, as `enum`s. |
| `src/lib/types.ts` | **Authoritative domain types** mirroring the SRS ERD. Unchanged role — edit here first, ripple out. Future Frappe DocTypes must match these shapes. |
| `src/types/<feature>.type.ts` | The *response envelope / row shape* a feature's endpoints return, when it differs from or narrows the domain type. Import domain types from `lib/types.ts`; don't re-declare them. |
| `src/app/actions/<feature>.ts` | `'use server'`. Server actions (mutations) and server reads for one feature. Validation (zod), `frappeFetch`, `revalidateTag`, `redirect`. |
| `src/components/pages/<feature>/` | That feature's UI. |
| `src/components/shared/` | UI used by more than one feature (existing rule — extend, never fork). |
| `src/components/ui/` | shadcn primitives (hand-written, `new-york`). |

**Do not inline backend method strings** in components or actions. Add a constant first.

```ts
// src/lib/methods.ts
export enum LISTING_METHODS {
    GET_LIST = "accreage_mart.api.listings.get_list",
    GET = "accreage_mart.api.listings.get",
    CREATE = "accreage_mart.api.listings.create",
    UPDATE = "accreage_mart.api.listings.update",
}
```

```ts
// src/lib/tags.ts
export enum LISTING_TAGS {
    LIST = "listing:list",
    GET = "listing:get",
}
```

---

## Server action example

`src/app/actions/listings.ts`

```ts
'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { frappeFetch } from '@/lib/frappe';
import { parseFrappeError } from '@/lib/frappe-error';
import { parseFilterParams } from '@/lib/filter-parser';
import { LISTING_METHODS } from '@/lib/methods';
import { LISTING_TAGS } from '@/lib/tags';
import type { Listing } from '@/lib/types';

export type ListingFormState = {
    success?: boolean;
    message?: string;
    errors?: {
        title?: string[];
        cropType?: string[];
        quantityKg?: string[];
        pricePerKgLKR?: string[];
    };
    inputs?: {
        title?: string;
        cropType?: string;
        quantityKg?: string;
        pricePerKgLKR?: string;
    };
};

export async function createListing(prevState: ListingFormState, formData: FormData) {
    const schema = z.object({
        title: z.string().min(1, 'Title is required'),
        cropType: z.string().min(1, 'Crop type is required'),
        quantityKg: z.coerce.number().positive('Quantity must be greater than 0'),
        pricePerKgLKR: z.coerce.number().positive('Price must be greater than 0'),
    });

    const rawData = {
        title: formData.get('title') as string,
        cropType: formData.get('cropType') as string,
        quantityKg: formData.get('quantityKg') as string,
        pricePerKgLKR: formData.get('pricePerKgLKR') as string,
    };

    const validatedFields = schema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            inputs: rawData,
        };
    }

    let newListingName = '';

    try {
        const res = await frappeFetch(LISTING_METHODS.CREATE, {
            method: 'POST',
            body: { payload: JSON.stringify(validatedFields.data) },
        });

        const data = await res.json();
        newListingName = data.message.name;

        revalidateTag(LISTING_TAGS.LIST, 'max');
        revalidateTag(LISTING_TAGS.GET, 'max');
    } catch (e: any) {
        const jsonMatch = e.message?.match(/Frappe request failed: \d+ ([\s\S]*)/);
        const message = jsonMatch
            ? parseFrappeError(jsonMatch[1])
            : 'Something went wrong. Please try again later';

        return { success: false, message, inputs: rawData };
    }

    redirect(`/seller/listings/${newListingName}`);
}

export async function getListingList(params: any): Promise<Listing[]> {
    try {
        const { filterArgs } = parseFilterParams(params, {
            orderBy: { field: 'T0.creation', order: 'desc' },
        });

        const res = await frappeFetch(`${LISTING_METHODS.GET_LIST}?args=${filterArgs}`, {
            method: 'GET',
            next: { tags: [LISTING_TAGS.LIST] },
        });

        const data = await res.json();
        return (data.message || []) as Listing[];
    } catch {
        return [];
    }
}
```

### Conventions in that example

- **Reads return a safe fallback** (`[]`, `null`) on error — the page renders an empty state,
  it does not throw.
- **Mutations return a `FormState`** with `errors` (field-level, from zod) or `message`
  (server error, via `parseFrappeError`) plus `inputs` to repopulate the form. On success they
  `revalidateTag` then `redirect`.
- `redirect()` is called **outside** the `try/catch` (it throws by design).
- Validated data (`validatedFields.data`, coerced types) goes to the backend, not the raw
  strings.
- Money is stored/sent as a number; format with `formatLKR()` only at display time.

---

## Form example

`src/components/pages/listings/NewListingForm.tsx`

```tsx
'use client';

import { X } from 'lucide-react';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';

import { createListing, type ListingFormState } from '@/app/actions/listings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialState: ListingFormState = { errors: {}, message: '' };

export function NewListingForm() {
    const [state, formAction, pending] = useActionState<ListingFormState, FormData>(
        createListing,
        initialState,
    );

    useEffect(() => {
        const hasErrors = state?.errors && Object.keys(state.errors).length > 0;
        const hasMessage = !!state?.message;

        if (!hasErrors && hasMessage) {
            toast.error(state.message ?? 'Something went wrong. Please try again later.', {
                className:
                    'bg-destructive-subtle border border-destructive/20 text-destructive-subtle-foreground rounded-lg py-4 px-6',
                icon: (
                    <div className="bg-destructive rounded-full p-0.5">
                        <X className="text-white size-3" />
                    </div>
                ),
                duration: 4000,
            });
        }
    }, [state]);

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={state?.inputs?.title} />
                {state?.errors?.title && (
                    <p className="text-destructive text-sm">{state.errors.title[0]}</p>
                )}
            </div>

            {/* cropType, quantityKg, pricePerKgLKR — same pattern */}

            <Button type="submit" disabled={pending}>
                {pending ? 'Creating…' : 'Create listing'}
            </Button>
        </form>
    );
}
```

### Form conventions

- One `useActionState` per form. `pending` drives the submit button's disabled/label state.
- Field errors render inline under each field from `state.errors.<field>[0]`.
- Server-level errors surface as a Sonner `toast.error` in a `useEffect` on `state`.
- Inputs use `defaultValue={state?.inputs?.<field>}` so a failed submit keeps what the user
  typed.
- Native `<form action={formAction}>` — no `onSubmit`, no manual `preventDefault`.

---

## General rules

- Path alias `@/*` → `src/*`. Use it in imports; no deep relative chains.
- Page files still export **only** the default component.
- Dynamic routes: `useParams()` in client components; `params` prop in Server Component pages.
- `useSearchParams()` stays wrapped in `<React.Suspense>`.
- Time-relative UI renders through `<TimeLeft>`.
- Formatting follows the repo's Prettier / ESLint — run `npm run lint`; `npm run build` must
  stay green.
- Every wired feature ships tests per [`testing.md`](testing.md): server actions and reads
  first (mock `frappeFetch`), then components.

---

## To build once, then reuse

These support files don't exist yet. Create them in the first epic that wires a feature, then
every feature reuses them:

- `src/lib/frappe.ts` — `frappeFetch(methodPath, { method, body, next })`: prefixes the
  Frappe base URL + `/api/method/`, sends the session cookie (`credentials: 'include'`),
  JSON-encodes the body, throws `Error("Frappe request failed: <status> <body>")` on non-2xx,
  passes `next` (tags / revalidate) through to `fetch`.
- `src/lib/frappe-error.ts` — `parseFrappeError(raw)`: pulls the human message out of a Frappe
  error payload (`_server_messages` / `exception` / `message`).
- `src/lib/filter-parser.ts` — `parseFilterParams(params, defaults)`: turns list query params
  (search, filters, sort, pagination) into the `args` string the Frappe list endpoints expect.
- `src/lib/methods.ts`, `src/lib/tags.ts` — start empty, grow per feature.

Their exact shapes are confirmed with the backend when the first endpoint is built.
