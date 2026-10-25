# Shared Results View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a shared results kit and rebuild Tasks, News, Users and Credit operations search on it.

**Architecture:** Presentational components in `src/platform/components/results/` plus pure helpers in
`resultsModel.ts`; each page keeps its own state and fetching and composes the kit.

**Tech Stack:** React 19, TypeScript, Bootstrap 5 SCSS, RTK Query, react-router 7, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-09-results-view-design.md`

## Global Constraints

- Bootstrap CSS variables only for colours (themes and dark mode must keep working); new styles in `src/platform/styles/results.scss`, imported in `montra.scss` after `news`; class prefix `app-results-`.
- Popovers use the existing `useDropdown` hook (`@platform/hooks/useDropdown`), no Bootstrap JS.
- Tasks: 25 rows per page; News: 10; Users: 10 (server); Operations: 25.
- Priority tones keep the existing colours: Low green, Medium yellow, High orange, Critical red.
- Every task ends with `npm run lint`, `npm test`, `npm run build` passing.

## Review Focus

- A page number beyond the last page after filters shrink the list → clamp to the last page (`pageRange` test).
- Deselecting every chip in a group → empty state, never a crash or "all" (`toggleChip` test).
- Search with accents/case (`"Joao"` vs `"João"`) → matches (`searchTasks` test).
- Opening a task from page 2 → the modal shows that task, prev/next walks the full filtered list (manual check, Task 2).
- Empty numeric filter in Operations → `null`, never `NaN` (`toSearchRequest` test).

---

### Task 1: Results kit

**Files:**
- Create: `src/platform/components/results/resultsModel.ts`, `resultsModel.test.ts`, `ResultsPanel.tsx`, `ResultsToolbar.tsx`, `FilterChips.tsx`, `ActiveFilters.tsx`, `ResultList.tsx` (exports `ResultList`, `ResultRow`), `ResultsFooter.tsx`, `SkeletonRows.tsx`
- Create: `src/platform/hooks/useUrlFilters.ts`, `src/platform/styles/results.scss`
- Modify: `src/platform/styles/montra.scss` (import `results`)

**Interfaces (Produces):**
- `toggleChip(selected: string[], value: string, only: boolean): string[]` — only → `[value]`; else add/remove.
- `pageRange(page: number, pageSize: number, total: number): { page: number; pageCount: number; first: number; last: number }` — page clamped to `[1, pageCount]`, `pageCount ≥ 1`, `first = 0` when total is 0.
- `paginate<T>(items: T[], page: number, pageSize: number): T[]` — uses clamped page.
- `type Tone = "primary" | "secondary" | "success" | "info" | "warning" | "orange" | "danger"`.
- Component props exactly as spec §3; `ResultRow` takes `onClick` or `to`.
- `useUrlFilters(): { get(key: string): string; set(changes: Record<string, string | null>): void }`.

- [ ] Step 1: tests — `toggleChip(["a","b"],"a",false) → ["b"]`; `(["b"],"a",false) → ["b","a"]`; `(["a","b"],"b",true) → ["b"]`; `pageRange(5,10,23) → {page:3,pageCount:3,first:21,last:23}`; `pageRange(1,10,0) → {page:1,pageCount:1,first:0,last:0}`; `paginate([1..23],3,10) → [21,22,23]`.
- [ ] Step 2: run `npx vitest run src/platform/components/results` → FAIL.
- [ ] Step 3: implement model, components, hook, SCSS.
- [ ] Step 4: tests pass; lint + build pass.
- [ ] Step 5: commit `feat(results): shared results kit`.

### Task 2: Tasks redesign

**Files:** Modify `src/platform/features/tasks/components/AssignedTasks.tsx`, `tasksModel.ts`, `tasksModel.test.ts`, `src/platform/styles/news.scss` (remove tile/row/compact-filter styles).

**Interfaces:** Consumes Task 1. Produces `searchTasks(tasks: Task[], query: string): Task[]` (uses `fold` from news model) and `PRIORITY_TONES: Record<Priority, Tone>` (Low success, Medium warning, High orange, Critical danger).

- [ ] Step 1: tests — empty query returns all; `"joao"` matches owner `"João Silva"`; matches observation text; non-match returns `[]`.
- [ ] Step 2: run → FAIL. Step 3: implement + rewrite component per spec §4. Step 4: pass, lint, build. Step 5: commit.

### Task 3: News migration

**Files:** Modify `src/platform/features/news/components/NewsSearch.tsx`. Consumes `useUrlFilters`, kit. Category chips single-select (click active = clear). Rows: `leading` thumb, `secondary` subtitle/snippet. Commit.

### Task 4: Users migration

**Files:** Modify `src/platform/features/users/pages/UsersPage.tsx`. Access filter chips (single-select), server paging via `ResultsFooter`. Commit.

### Task 5: Operations search migration

**Files:** Modify `src/apps/credit/features/search/pages/SearchOperationsPage.tsx`; Create `src/apps/credit/features/search/searchModel.ts` + `searchModel.test.ts`; Delete `src/apps/credit/styles/searchPage.scss` and its import in `montra-app.scss`.

**Interfaces:** `toSearchRequest(form: SearchForm): CreditOperationSearchRequest` where `SearchForm` is `Record<field, string>`; blank → `null`, numeric fields → `Number`, `credOperStep` → `CreditOperationStep | undefined`. `activeSearchFilters(form): {key, label}[]`.

- [ ] Step 1: tests — blank channel → `credOperChannelId: null`; `"12"` → `12`; step `""` → `undefined`. Step 2: FAIL. Step 3: implement + page. Step 4: pass, lint, build. Step 5: commit.
