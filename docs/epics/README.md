# Epic Management Workflow

Canonical playbook for building Accreage Mart feature-by-feature. **Read this file before
starting or resuming any epic work.** `CLAUDE.md` only carries a pointer to it.

Related: [`../testing.md`](../testing.md) — the test stack and how to write/run tests.

---

## Epic index

| #  | SRS module | Slug | Status |
|----|-----------|------|--------|
| 01 | Module 3 — User Role Management | [01-auth](01-auth/epic.md) | in progress |

> Update this table whenever an epic changes state. Status values:
> `not started` · `planning` · `in progress` · `done`.

---

## What an epic is

- An epic maps to **one of the 12 SRS modules** and is numbered against it for traceability.
- Every epic is **full-stack**: the frontend mock service layer (`src/lib/services/*`,
  `src/lib/types.ts`) **and** the matching Frappe backend (DocTypes, whitelisted endpoints,
  hooks in the `accreage_mart` app) are delivered together. There is no "wire the backend
  later" wave.
- An epic is a folder: `docs/epics/<nn>-<slug>/` containing `epic.md` and `stories.json`.

---

## The epic loop

Do not skip or reorder steps.

1. **Pick an epic** — by SRS module number.
2. **Finalize scope with the user in plain text** — no files written yet. Agree on goal,
   scope, non-goals, and the rough story list.
3. **Write `docs/epics/<nn>-<slug>/epic.md`** from the template below. Get the user's
   sign-off on it.
4. **Write `docs/epics/<nn>-<slug>/stories.json`** from the schema below — one entry per
   story, all `todo`, acceptance criteria filled in.
5. **Per story, in order:**
   1. Set the story `in_progress` in `stories.json`.
   2. Implement it (frontend + backend as the story requires).
   3. Write its tests — see [`../testing.md`](../testing.md).
   4. Run the tests; fix until green.
   5. Confirm `npm run build` is still green.
   6. Tick the story's acceptance criteria, set `status: "done"`, fill `verify`, record the
      `commit`.
   7. **Commit `stories.json` in the same commit as the story's code** so git history and
      state never diverge.
6. When all stories are `done`, set the epic `status` to `done` in both `stories.json` and
   the index table above.

---

## Resuming in a new chat

1. Read this file.
2. Read the current epic's `stories.json`.
3. Continue from the first story whose `status` is not `done` (`in_progress` → finish it;
   `blocked` → resolve the blocker with the user; `todo` → start it).
4. Never assume progress that `stories.json` does not record.

---

## `epic.md` template

```markdown
# Epic <nn>: <name>

- **SRS module:** <module name / number>
- **Status:** planning | in progress | done

## Goal
<one paragraph — the user-facing outcome>

## Scope & non-goals
- In: ...
- Out (this epic): ...

## Affected surface
- Routes: ...
- Services: src/lib/services/<file>.ts (<functions>)
- Types: changes to src/lib/types.ts
- Backend: DocTypes, accreage_mart.api.<mod>.<fn> endpoints, hooks

## Stories
One short paragraph per story — what and why. Acceptance criteria and test files live in
stories.json, not here.

### Story <nn>.1 — <title>
<what & why>

### Story <nn>.2 — <title>
<what & why>

## Backend wiring notes
<DocType fields, migrations the user must run, scheduler hooks>
```

---

## `stories.json` schema

```json
{
  "epic": "03-auctions",
  "srsModule": "Module 4 — Auction Management",
  "status": "in_progress",
  "updated": "2026-09-08",
  "stories": [
    {
      "id": "3.1",
      "title": "Vitest + RTL test harness",
      "status": "done",
      "acceptanceCriteria": [
        { "text": "npm run test executes and passes", "done": true },
        { "text": "store resets between tests", "done": true }
      ],
      "tests": ["tests/setup.ts", "tests/lib/store.test.ts"],
      "verify": { "tests": "pass", "build": "green", "date": "2026-09-08" },
      "commit": "abc1234",
      "notes": ""
    }
  ]
}
```

### Field reference

| Field | Meaning |
|---|---|
| `epic` | Folder name, `<nn>-<slug>`. |
| `srsModule` | Human label of the SRS module this epic delivers. |
| `status` (epic) | `todo` \| `in_progress` \| `done`. Rolls up from stories. |
| `updated` | ISO date of the last edit to this file. |
| `stories[].id` | `<epic-number>.<story-number>`, e.g. `3.2`. |
| `stories[].status` | `todo` \| `in_progress` \| `done` \| `blocked`. |
| `stories[].acceptanceCriteria` | Array of `{ text, done }`. The checkable definition of done. |
| `stories[].tests` | Test file paths added/changed for this story. |
| `stories[].verify` | `{ tests: "pass"\|"fail", build: "green"\|"red", date }` from the last run. |
| `stories[].commit` | Short SHA of the commit that completed the story. |
| `stories[].notes` | Free text — decisions, follow-ups, known gaps. |

### Rules

- `stories.json` is the **only** place acceptance criteria and story state live.
- A story is `done` only when every acceptance criterion is `done: true`, `verify.tests` is
  `pass`, and `verify.build` is `green`.
- Update `updated` on every edit.
- Backend (Frappe) test runs: the **user** runs `bench run-tests`; record the result in
  `verify` from what they report.
