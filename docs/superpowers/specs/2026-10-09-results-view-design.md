# Shared results view & task list redesign — design spec

Date: 2026-10-09 · Status: approved design, pending spec review

## 1. Goal

A task list that is clean, light, concise, quick to scan and easy to filter, and built from a
**shared results kit** that every search in the Montra apps reuses (Tasks, News, Users,
Credit operations search). Filters and results form **one integrated card**.

### Decisions taken

| Topic | Decision |
|---|---|
| "As many tasks as possible" | **Density**: compact one-line rows, filters collapsed into a slim toolbar. Volumes stay in the tens–low hundreds; Tasks and News filter client-side. No virtualization. |
| Layout | **Toolbar + chips**: line 1 title/count + search + `Filters` popover + actions; line 2 toggle chips with counts; line 3 removable active-filter pills (only when any) |
| Architecture | **Building blocks** (approach A): presentational components; each page keeps its own state and data fetching |
| Scope | Kit + Tasks + migrate News, Users, Operations search, as separate plan steps |

### Out of scope

`StockUnitsPage` (stock) and factoring `DocumentsPage` (follow-ups, same pattern) · server-side
paging for tasks · backend changes · changes to `TaskDetailModal`.

## 2. Visual language

- One card (`card border-0 shadow-sm`). Toolbar sits flush on top; a hairline divider separates
  it from the rows. No inner cards, tiles or shadows.
- Bootstrap CSS variables only (`--bs-body-bg`, `--bs-secondary-color`,
  `--bs-border-color-translucent`, `--bs-primary`…) so light/dark themes and app colours keep
  working.
- **Rows** ≈ 44px, single line from `md` up; faint divider between rows; hover tint
  (`--bs-tertiary-bg`); focus-visible ring. A **3px accent bar** on the left carries the row's
  tone (task priority, news category, inactive user, operation stage).
- **Chips**: small pills; neutral when off, tinted (tone or primary-subtle) when on; count in a
  lighter weight after the label.
- Loading = skeleton rows (`placeholder-glow`), never a centered spinner.
- Styles live in `src/platform/styles/results.scss` (imported where `news.scss` is), class
  prefix `app-results-`.

## 3. Shared kit — `src/platform/components/results/`

| Unit | Responsibility | Props / API |
|---|---|---|
| `ResultsPanel` | Card frame. Renders `toolbar`, then exactly one of: skeleton (loading), error alert with Retry, empty state, `children`; then `footer`. | `toolbar: ReactNode`, `footer?: ReactNode`, `status: { isLoading: boolean; isError: boolean; error?: unknown; onRetry?: () => void; isEmpty: boolean; empty: { icon: string; text: string; onClear?: () => void } }`, `skeletonRows?: number` (default 5) |
| `ResultsToolbar` | Line 1. Title (or `titleSlot`, used by dashboard tabs) + count, search input, `Filters` dropdown button with active-count badge, `Sample data` badge, actions. Lines 2–3 passed as `children`. | `title?: string`, `titleSlot?: ReactNode`, `count?: number`, `search?: { value: string; onChange(v: string): void; placeholder: string; label: string }`, `filters?: ReactNode` (popover body), `activeFilterCount?: number`, `isSample?: boolean`, `actions?: ReactNode`, `children?` |
| `FilterChips` | Line 2. Groups of toggle chips separated by a thin vertical divider. Click toggles; **Alt-click selects only that chip**. | `groups: { label: string; options: { value: string; label: string; count?: number; tone?: string }[]; selected: string[]; onChange(next: string[]): void }[]` |
| `ActiveFilters` | Line 3, renders nothing when `items` is empty. Removable pills + "Clear all". | `items: { key: string; label: string; onRemove(): void }[]`, `onClearAll(): void` |
| `ResultList` | `<ul class="list-unstyled app-results-list">` wrapper. | `children`, `label` (aria-label) |
| `ResultRow` | One row; the whole row is a `<button>` or a router `<Link>`. Slots: accent, leading, title, secondary line, meta, trailing, chevron. Meta items are columns from `md` up, wrapped under the title on small screens. | `accent?: string` (tone), `accentLabel?: string` (visually hidden + tooltip), `leading?: ReactNode`, `title: ReactNode`, `secondary?: ReactNode`, `meta?: ReactNode[]`, `trailing?: ReactNode`, and either `onClick` (+ `aria-haspopup`) or `to` |
| `ResultsFooter` | "1–25 of 142" + existing `Pagination`. Hidden when `total` is 0; pagination hidden when one page. | `page`, `pageSize`, `total`, `onPageChange(page)`, `label` |
| `resultsModel.ts` | Pure helpers: `toggleChip(selected, value, all, only)`, `pageRange(page, pageSize, total)` → `{ first, last, pageCount }`, `paginate(items, page, pageSize)`. | — |
| `useUrlFilters` (`src/platform/hooks/`) | Generalised from News `update()`: read params, write changes with `replace`, any change except `page` resets the page. | `const { get, set } = useUrlFilters()` |

Tones map to Bootstrap colours: `danger`, `warning`, `info`, `success`, `secondary`, `primary`.

Accessibility: counts in an `aria-live="polite"` region; chips are `<button aria-pressed>`;
`Filters` is a Bootstrap dropdown with `aria-expanded`; row accent meaning is in
visually-hidden text.

## 4. Tasks (`AssignedTasks`)

- **Toolbar**: `titleSlot` = compact pill tabs when `extraTabs` is given (as today, with the
  task count badge), otherwise "Assigned tasks · n". Search (new, client-side). `Filters`
  popover holds `HierarchySelects` (`allowAll`, profile default as today) + Due from / Due
  until. Sample data badge.
- **Chips**: Priority group (Critical, High, Medium, Low; tones danger/warning/info/secondary)
  with `countByPriority` counts over all tasks. Type group from `TASKS.categories` with
  `countByCategory` over tasks of the selected priorities. `types = null` still means "all,
  including types that appear later".
- **Active filters**: organization / unit / member (only when they differ from the profile
  default), due range, search text. "Clear all" = old `clearFilters` + all priorities + empty
  search.
- **Rows**: accent = priority tone (`accentLabel` = priority); title truncated; meta =
  category, owner, due label (overdue: `text-danger fw-semibold`), 📎 count when documents.
  `onClick` opens `TaskDetailModal` on the **full filtered list** (prev/next unchanged), index
  translated from the page.
- **Order & paging**: `sortTasks`; client-side 25 per page; page back to 1 on any filter change.
- **State** stays in component state (dashboard card, shared with the Insights tab); filters
  survive tab switches as today.
- Removed: `app-filter-tile*`, `app-priority-tile`, `app-type-tile`, `app-task-row` styles and
  the two "Clear…" buttons. `PriorityBadge` stays (used by the modal).
- **Model**: `searchTasks(tasks, query)` in `tasksModel.ts` — case/accent-insensitive match on
  title, owner, category, observation; empty query returns all.

## 5. Migrations

### News (`NewsSearch`)
- URL state `?q=&category=&sort=&page=` kept, via `useUrlFilters`.
- Toolbar "News · n" (with "of total" when filtered), search, sort select as action. Category
  as a chip group with counts (single-select semantics: chip click = only that category,
  clicking the active one clears it).
- Rows: `leading` = `NewsImage` thumb, title with `Highlight`, `secondary` = subtitle or body
  snippet, meta = date + `NewsStatusBadge`, accent from category; `to={/news/:id}`.
- "No news yet" and "No news matches" become `ResultsPanel` empty states. Page size stays 10.

### Users (`UsersPage`)
- Toolbar "Users · total", debounced server search, "New user" primary action.
- Access filter (`USERS_ACCESS.filter.options`) as single-select chips without counts.
- Rows replace the table: `leading` avatar, title name, `secondary` e-mail, meta =
  `USERS_ACCESS.columns[].cell(user)`, trailing Active/Inactive badge + edit link
  (`stopPropagation` kept), accent `secondary` when inactive; `to=/admin/users/:id`.
- Server paging through `ResultsFooter` (`total` from API, page size 10). Flash alert stays
  above the card.

### Operations search (credit `SearchOperationsPage`)
- Toolbar "Operations · n", client-side search over results (number, customer). `Filters`
  popover holds the six request fields; **Apply** runs the existing
  `usePostApiCreditOperationsSearchOperationsMutation`.
- States: before first search → empty state "Set filters and search"; loading from
  `searchingCreditOperations`; mutation error → error state with Retry (re-runs last request).
- Active filters as pills (removing one re-runs the search).
- Rows replace the card grid: accent by stage (`stageOf`), title customer name, meta =
  operation number, financial product, begin date, amount; trailing state badge. Click keeps
  the unsaved-changes confirm + `loadExisting` + stage navigation unchanged.
- Client-side paging, 25 per page.
- Fixes while migrating: correct field labels (no "City"/"Code" mislabels); "Credit Operation
  Step" becomes a select over `CreditOperationStep`; empty numeric inputs store `null`, not
  `NaN`/0; delete commented-out code; delete `apps/credit/styles/searchPage.scss` if unused.

## 6. Testing

- Vitest: `resultsModel.test.ts` (toggle / only / single-select, page range, paginate edges),
  `tasksModel.test.ts` additions for `searchTasks`.
- Each plan step ends with `npm run lint`, `npm test`, `npm run build` (and the other app
  builds for platform changes), plus a browser check of the touched screen in light and dark
  themes and at phone width.

## 7. Plan order

1. Kit (`results/`, `results.scss`, `resultsModel`, `useUrlFilters`) + tests
2. Tasks redesign
3. News migration
4. Users migration
5. Operations search migration
