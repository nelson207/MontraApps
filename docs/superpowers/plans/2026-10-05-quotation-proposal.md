# Quotation & Proposal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Quotation and Proposal as one shared wizard with a clear operation lifecycle, server-rule + date validation, a refreshed UI, and an insurance step on proposals.

**Architecture:** Pure logic (dates, field rules, step validation, insurance rules, session resolution, reducers) lives in small unit-tested modules under `src/features/credoper/`. One `CredOperWizardPage` renders either stage from a step configuration; `useCredOperSession` decides new / open / continue. Insurances are stored on the operation (`CredOperDraft.insurances`) and loaded from placeholder endpoints with a dev-only sample fallback.

**Tech Stack:** React 19, TypeScript, Vite 8, Redux Toolkit + RTK Query, react-router-dom 7 (`BrowserRouter`), Bootstrap 5.3 SCSS + Bootstrap Icons, Vitest (new, dev-only).

**Spec:** `docs/superpowers/specs/2026-10-05-quotation-proposal-design.md`

## Global Constraints

- **Do not commit to git** (user instruction). Every task ends with verification, not a commit.
- Field set of each screen stays the same (Customer, Financial data, Interventions, Summary); only Insurances is new (proposal only).
- Labels in English; theme colours via existing CSS variables (`--app-primary`, `--app-primary-text`, …); Bootstrap utilities first.
- Dates compared as calendar days in local time, format `yyyy-MM-dd`.
- Dev-only sample fallbacks use `shouldUseSample`/`isMissingEndpoint` from `src/services/api/devFallback.ts`; production never shows sample data.
- Do not edit `src/services/api/generated/*` (codegen output). Placeholder endpoints use `emptySplitApi.injectEndpoints`.
- Lists use `SelectField`/`SearchableSelect` (searchable everywhere).
- Leave `src/app/routes/ProtectedRoute.tsx` untouched (user's auth bypass); its TS6192 error is pre-existing.
- Intervention types: `credOperIntervType` 2 = second holder, 4 = guarantor, anything else = customer.

## Review Focus

1. **Missing `correlationID`** on interventions/assets (server sends `""` or nothing) would make insurance links collide → `ensureRefs` assigns stable client refs on start/load (Task 3 test).
2. **API dates with a time part** (`"2026-10-05T00:00:00"`) must compare as `2026-10-05`, not fail or shift by timezone (Task 1 test).
3. **Age boundary:** a holder turning 18 **today** is adult; a Feb-29 birthday on a non-leap year counts from Mar 1 (Task 1 test).
4. **Required field holding `0` or `false`** counts as filled; only `null`/`undefined`/`""`/whitespace is empty (Task 2 test).
5. **Save response without `insurances`** (backend not updated yet) must not wipe the user's insurances (Task 4 test).

---

## File Structure

```
src/features/credoper/
  model/credOperDraft.ts          CredOperDraft + Insurance types, refs, role/name/asset helpers
  validation/localDate.ts         todayLocal, toLocalDate, compare, ageOn
  validation/dateRules.ts         notAfterToday, notBeforeToday, isAdult (messages)
  validation/fieldRules.ts        fieldRule, isEmptyValue, requiredError, FieldErrors
  validation/stepValidation.ts    validateCustomer/Financial/Interventions/Insurances/All
  insurance/insuranceRules.ts     validateInsurance, isDuplicate, brokenLink
  insurance/insuranceApi.ts       types + protections endpoints (dev sample fallback)
  insurance/sampleInsurance.ts    sample types & protections
  insurance/components/           InsurancesStep, InsuranceCard, CreditProtectionDialog, CarInsuranceDialog
  session/resolveEntry.ts         pure entry decision (new / use stored / prompt / fallback)
  session/useCredOperSession.ts   hook: fetch new, apply defaults, dirty prompt, beforeunload
  wizard/steps.ts                 StepId, step lists per stage (+ validate fns)
  wizard/stepComponents.tsx       StepId → component map
  components/OperationField.tsx   applies fieldRule (hide / readOnly / required / error)
  components/wizard/              OperationHeader, Stepper, WizardActions, SummaryPanel, DiscardPrompt
  components/steps/               CustomerStep, FinancialStep, InterventionsStep, SummaryStep
  pages/CredOperWizardPage.tsx    replaces QuotationPage + ProposalPage
  credoperSlice.ts                + isDirty, startNew, loadExisting, markSaved, insurance reducers
src/components/ui/InputField.tsx  + invalidMessage
src/styles/credoper.scss          wizard / panel / insurance styles (imported in montra.scss)
vitest.config.ts                  test config (node env, @ alias)
```

Removed: `pages/QuotationPage.tsx`, `pages/ProposalPage.tsx`, `components/WizardHeader.tsx`, `components/forms/CreditDetail.tsx` (→ SummaryPanel), `components/forms/CreditSummary.tsx` (→ SummaryStep), `components/InterventionsTabs.tsx` (→ InterventionsStep). Existing field forms (`CustomerDetail`, `FinancialData`, `Intervention*Form`) are kept and restyled in place.

---

### Task 1: Test runner + local date rules

**Files:**
- Create: `vitest.config.ts`, `src/features/credoper/validation/localDate.ts`, `src/features/credoper/validation/dateRules.ts`
- Modify: `package.json` (devDependency `vitest`, script `"test": "vitest run"`)
- Test: `src/features/credoper/validation/dateRules.test.ts`

**Interfaces:**
- Produces:
  - `type LocalDate = string` (`yyyy-MM-dd`)
  - `todayLocal(now?: Date): LocalDate`
  - `toLocalDate(value: string | null | undefined): LocalDate | null` — first 10 chars when they match `\d{4}-\d{2}-\d{2}`, else null
  - `ageOn(birth: LocalDate, today: LocalDate): number`
  - `notAfterToday(value, today, label): string | null` → `"{label} can't be in the future."`
  - `notBeforeToday(value, today, label): string | null` → `"{label} has expired."`
  - `isAdult(birth, today): string | null` → `"Must be at least 18 years old."`; birth after today → `"Birth date can't be in the future."`
  - `ADULT_AGE = 18`

- [ ] **Step 1:** `npm i -D vitest` ; add `"test": "vitest run"`; create `vitest.config.ts` with `test.environment = "node"`, `test.include = ["src/**/*.test.ts"]`, and the same `@` → `./src` alias as `vite.config.ts` (no React plugins).
- [ ] **Step 2: Write the failing tests** in `dateRules.test.ts`:

```ts
const today = "2026-10-05";
it("toLocalDate drops a time part", () => expect(toLocalDate("2026-10-05T00:00:00")).toBe("2026-10-05"));
it("toLocalDate rejects garbage", () => expect(toLocalDate("05/10/2026")).toBeNull());
it("registration today is fine, tomorrow is not", () => {
  expect(notAfterToday("2026-10-05", today, "Registration date")).toBeNull();
  expect(notAfterToday("2026-10-06", today, "Registration date")).toBe("Registration date can't be in the future.");
});
it("document valid today is fine, yesterday expired", () => {
  expect(notBeforeToday("2026-10-05", today, "Document")).toBeNull();
  expect(notBeforeToday("2026-10-04", today, "Document")).toBe("Document has expired.");
});
it("turns 18 today → adult", () => expect(isAdult("2008-10-05", today)).toBeNull());
it("turns 18 tomorrow → not adult", () => expect(isAdult("2008-10-06", today)).toBe("Must be at least 18 years old."));
it("Feb 29 birthday counts from Mar 1 on non-leap years", () => {
  expect(ageOn("2008-02-29", "2026-02-28")).toBe(17);
  expect(ageOn("2008-02-29", "2026-03-01")).toBe(18);
});
it("future birth date", () => expect(isAdult("2026-10-06", today)).toBe("Birth date can't be in the future."));
it("empty values are not this module's concern", () => expect(notAfterToday(null, today, "X")).toBeNull());
```

- [ ] **Step 3:** Run `npx vitest run src/features/credoper/validation/dateRules.test.ts` → FAIL (modules missing).
- [ ] **Step 4:** Implement both files. `todayLocal` builds `yyyy-MM-dd` from local `getFullYear/getMonth/getDate`; comparisons are string comparisons of `LocalDate`.
- [ ] **Step 5:** Run the same command → PASS. Run `npm run build` → succeeds (vitest config must not break the app build).

---

### Task 2: Server field rules + `OperationField`

**Files:**
- Create: `src/features/credoper/validation/fieldRules.ts`, `src/features/credoper/components/OperationField.tsx`
- Modify: `src/components/ui/InputField.tsx`, `src/components/ui/fieldProps.ts` (add `invalidMessage?: string | null` to `InputFieldProps`, render `.is-invalid` + `.invalid-feedback d-block` like `SelectField`)
- Test: `src/features/credoper/validation/fieldRules.test.ts`

**Interfaces:**
- Produces:
  - `type FieldMeta = { jsonName?: string | null; isRequired?: boolean; isVisible?: boolean; isReadOnly?: boolean }`
  - `type FieldRule = { visible: boolean; required: boolean; readOnly: boolean }`
  - `fieldRule(metadata: FieldMeta[] | null | undefined, jsonName: string): FieldRule` — default `{ visible: true, required: false, readOnly: false }`
  - `isEmptyValue(value: unknown): boolean` — true only for `null`, `undefined`, `""`, whitespace-only strings
  - `requiredError(rule: FieldRule, value: unknown): string | null` → `"This field is required."` when `rule.visible && rule.required && isEmptyValue(value)`
  - `type FieldErrors = Record<string, string>` (key = field path, e.g. `"customerName"`, `"assets.0.equipment.registrationDate"`)
  - `<OperationField rule={FieldRule} error?: string | null>{(props: { required: boolean; disabled: boolean; invalidMessage: string | null }) => ReactNode}</OperationField>` — renders nothing when `!rule.visible`; render-prop passes props for the wrapped field.
- Replaces: `src/utils/fieldMetadata.ts` (`getFieldMetadata`) — migrate its one caller (`CustomerDetail`) and delete the file.

- [ ] **Step 1: Write the failing tests:**

```ts
it("no metadata → visible, optional, editable", () =>
  expect(fieldRule(null, "customerName")).toEqual({ visible: true, required: false, readOnly: false }));
it("reads the matching jsonName", () =>
  expect(fieldRule([{ jsonName: "customerName", isRequired: true, isVisible: true, isReadOnly: false }], "customerName").required).toBe(true));
it("0 and false are values", () => {
  const rule = { visible: true, required: true, readOnly: false };
  expect(requiredError(rule, 0)).toBeNull();
  expect(requiredError(rule, false)).toBeNull();
  expect(requiredError(rule, "  ")).toBe("This field is required.");
});
it("hidden required field is never an error", () =>
  expect(requiredError({ visible: false, required: true, readOnly: false }, null)).toBeNull());
```

- [ ] **Step 2:** `npx vitest run src/features/credoper/validation/fieldRules.test.ts` → FAIL.
- [ ] **Step 3:** Implement `fieldRules.ts`, `OperationField`, `InputField.invalidMessage`; switch `CustomerDetail` from `getFieldMetadata` to `fieldRule`; delete `src/utils/fieldMetadata.ts`.
- [ ] **Step 4:** Tests PASS; `npx tsc -b` shows only the pre-existing ProtectedRoute error; `npx eslint src/components/ui src/features/credoper` clean for touched files.

---

### Task 3: Operation draft model

**Files:**
- Create: `src/features/credoper/model/credOperDraft.ts`
- Test: `src/features/credoper/model/credOperDraft.test.ts`

**Interfaces:**
- Produces:
  - `Insurance`, `CreditProtectionInsurance`, `CarInsurance`, `CarDriver` — exactly as spec §5 (`id: string`, `kind`, `insuranceTypeId`, `interventionRef` / `assetRef`, `driver`, `protectionIds`)
  - `type CredOperDraft = CredOperDto & { insurances: Insurance[] }`
  - `type Stage = "quotation" | "proposal"`; `STEP_OF_STAGE: Record<Stage, number> = { quotation: 1, proposal: 2 }`; `stageOf(op: CredOperDto): Stage` (`credOperStep === 2` → proposal)
  - `type CredOperInput = CredOperDto & { insurances?: Insurance[] }` (server payloads may or may not carry insurances)
  - `ensureRefs(op: CredOperInput): CredOperDraft` — adds `insurances: op.insurances ?? []`; gives every intervention and asset without a non-empty `correlationID` a new one (`crypto.randomUUID()`); keeps existing ones unchanged
  - `interventionRole(i: CredOperIntervDto): "customer" | "secondHolder" | "guarantor"`; `ROLE_LABELS`
  - `interventionName(i): string` — `entity.fullName`, else `person.firstName + lastName`, else `"Unnamed"`
  - `customerOf(op): CredOperIntervDto | undefined` — first intervention with role customer
  - `assetLabel(a: CredOperAssetDto): string` — equipment description, else licence plate, else `"Vehicle {n}"`

- [ ] **Step 1: Write the failing tests:** `ensureRefs` keeps an existing `correlationID`, assigns distinct refs to two interventions with `""`, adds `insurances: []` when missing and keeps them when present; `interventionRole({ credOperIntervType: 4 })` → `"guarantor"`, `2` → `"secondHolder"`, `null` → `"customer"`; `interventionName` fallbacks.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.

---

### Task 4: Slice — lifecycle, dirty state, insurances

**Files:**
- Modify: `src/features/credoper/credoperSlice.ts`, `src/app/store.ts` (`selectCredoper` returns `CredOperDraft | null`; add `selectCredoperIsDirty`)
- Test: `src/features/credoper/credoperSlice.test.ts`

**Interfaces:**
- Consumes: `CredOperDraft`, `Insurance`, `ensureRefs` (Task 3)
- Produces (actions): `startNew(op: CredOperInput)`, `loadExisting(op: CredOperInput)` (both run `ensureRefs`, `isDirty = false`), `markSaved(op: CredOperInput)` (keeps current `insurances` when `op.insurances` is undefined; `isDirty = false`), `addInsurance(ins)`, `updateInsurance({ id, changes })`, `removeInsurance(id)`, `setInsurances(list)`; state gains `isDirty: boolean`. Every existing edit reducer (`patchCredoper`, `updateAssetAt`, conditions/assets add/remove, `setCredOperStep`) and the insurance reducers set `isDirty = true`. `setCredoper` stays for calculate results (sets data via `ensureRefs`, does **not** change `isDirty`).

- [ ] **Step 1: Write the failing tests:** start → `isDirty` false; `patchCredoper` → true; `markSaved` → false; **`markSaved` with a response lacking `insurances` keeps the 1 existing insurance**; `markSaved` with `insurances: []` replaces them; `removeInsurance` removes by id; `updateInsurance` merges changes.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS; `npx tsc -b` no new errors (fix callers typed against `CredOperDto` only where TS requires).

---

### Task 5: Step validation

**Files:**
- Create: `src/features/credoper/validation/stepValidation.ts`
- Test: `src/features/credoper/validation/stepValidation.test.ts`

**Interfaces:**
- Consumes: `fieldRule`, `requiredError`, `FieldErrors` (Task 2); date rules (Task 1); `CredOperDraft`, `interventionRole` (Task 3); `validateInsurances` (Task 6 — add the import when Task 6 lands; until then `validateInsurancesStep` returns `{}`)
- Produces:
  - `validateCustomer(op, today): FieldErrors` — operation metadata for `customerName`, `customerVAT` (`customerVAT.legalDocNumber`), `customerEmail` (+ email format `"Enter a valid e-mail address."`), `customerPhone`, `customerLandLine`; hierarchy fields `creditIntermediaryStructNode`, `showRoomStructNode`, `salePersonStructNode`
  - `validateFinancial(op, today): FieldErrors` — asset 0 equipment fields via equipment `metadataResponse` (`equipmentTypeId`, `equipmentCategoryId`, `equipmentStateId`, `licencePlate`, `registrationDate` + `notAfterToday(…, "Registration date")`, `description`), operation `credOperClassification`, `financialProduct`, `amount`, condition 0 `term`
  - `validateInterventions(op, today): FieldErrors` — per intervention (key prefix `interventions.{correlationID}.`): person `birthDate` (`isAdult` for every role), legal doc 0 `validDate` (`notBeforeToday(…, "Identification document")`), required person/entity fields from their metadata
  - `validateInsurancesStep(op, today): FieldErrors`
  - `firstErrorKey(errors: FieldErrors): string | undefined`

- [ ] **Step 1: Write the failing tests:** required `customerName` empty → error key `"customerName"`; registration date tomorrow → `"assets.0.equipment.registrationDate"`; guarantor aged 17 → `"interventions.{ref}.person.birthDate"` with the adult message; expired legal doc → error; hidden required field (`isVisible: false`) → no error; valid sample operation → `{}`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement (field paths exactly as listed). **Step 4:** PASS.

---

### Task 6: Insurance rules + API

**Files:**
- Create: `src/features/credoper/insurance/insuranceRules.ts`, `insuranceApi.ts`, `sampleInsurance.ts`
- Modify: `src/features/credoper/validation/stepValidation.ts` (`validateInsurancesStep` uses `validateInsurance`)
- Test: `src/features/credoper/insurance/insuranceRules.test.ts`

**Interfaces:**
- Consumes: `Insurance`, `CredOperDraft`, `customerOf` (Task 3); `notBeforeToday` (Task 1); `isEmptyValue` (Task 2)
- Produces:
  - `validateInsurance(ins: Insurance, op: CredOperDraft, today: LocalDate): FieldErrors` — keys `insurances.{id}.{field}`:
    - broken link → key `…link`, message `"The insured person no longer exists."` / `"The insured vehicle no longer exists."`
    - `insuranceTypeId` missing → `"Select an insurance type."`
    - car: `driver.licenseExpiryDate` empty → required message; expired → `"Driver license has expired."`; when `!mainDriverIsCustomer`: `driver.name`, `driver.licenseNumber` required; `protectionIds.length === 0` → `"Select at least one protection."`
  - `isDuplicate(candidate: Insurance, all: Insurance[]): boolean` — same `kind` + `insuranceTypeId` + same `interventionRef`/`assetRef`, different `id`
  - `validateInsurances(op, today): FieldErrors` — merge of all, plus duplicate error key `insurances.{id}.duplicate` → `"This insurance type is already added for this person/vehicle."`
  - API (`emptySplitApi.injectEndpoints`, dev sample via `shouldUseSample`):
    - `useGetInsuranceTypesQuery(kind: "CreditProtection" | "Car")` → `GET /api/Insurances/Types?kind=` → `InsuranceType[] = { id: number; name: string; description: string }`
    - `useGetInsuranceProtectionsQuery(typeId: number)` → `GET /api/Insurances/Types/{typeId}/Protections` → `InsuranceProtection[] = { id; name; description; mandatory: boolean }`
  - Sample: 3 credit-protection types; 3 car types, each with 4–6 protections, at least one `mandatory`.

- [ ] **Step 1: Write the failing tests:** car insurance with expired license → licence error; not-customer driver without name → `driver.name` error; no protections → protections error; credit protection pointing at a removed intervention → link error; two identical credit protections → duplicate on the later one only; complete valid car insurance → `{}`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS (and Task 5 tests still PASS).

---

### Task 7: Session lifecycle

**Files:**
- Create: `src/features/credoper/session/resolveEntry.ts`, `src/features/credoper/session/useCredOperSession.ts`
- Modify: `src/features/search/pages/SearchOperationsPage.tsx` (`handleResultClick`: `dispatch(loadExisting(result))`, navigate to `/proposal` when `stageOf(result) === "proposal"` else `/quotation`, with `state: { intent: "open" }`)
- Test: `src/features/credoper/session/resolveEntry.test.ts`

**Interfaces:**
- Consumes: `startNew`, `loadExisting`, `selectCredoperIsDirty` (Task 4); `stageOf`, `STEP_OF_STAGE` (Task 3); `applyWorkContextDefaults`, `useWorkContext` (existing `features/workContext`); `useGetApiCreditOperationsGetNewCredOperQuery` (generated)
- Produces:
  - `type EntryIntent = "new" | "open" | "continue"`; `type SessionNavState = { intent?: EntryIntent }`
  - `resolveEntry({ intent, stored, isDirty }: { intent: EntryIntent; stored: CredOperDraft | null; isDirty: boolean }): "startNew" | "useStored" | "promptDiscard" | "fallbackNew"`
    - `new` + dirty stored → `promptDiscard`; `new` otherwise → `startNew`; `open`/`continue` + stored → `useStored`; `open`/`continue` + none → `fallbackNew`
  - `useCredOperSession(stage: Stage)` → `{ operation: CredOperDraft | null; status: "loading" | "ready" | "error" | "prompt"; error: unknown; retry(): void; notice: string | null; discardAndStartNew(): void; continueEditing(): void }`
    - fetches `GetNewCredOper` with `{ includeCustomer: stage === "proposal" }` **without cache reuse** (`refetchOnMountOrArgChange: true`, start only when decision is `startNew`/`fallbackNew`), waits for working context (`isReady || isError`), dispatches `startNew(applyWorkContextDefaults({ ...dto, credOperStep: STEP_OF_STAGE[stage] }, selection))`
    - `fallbackNew` sets `notice = "The operation you opened isn't available anymore, so a new one was started."`
    - `continueEditing` navigates to the stored operation's stage route with intent `open` when it differs from `stage`
    - registers `beforeunload` (`e.preventDefault()`) while `isDirty`
    - the intent is read once per mount (React Router `location.key`), so re-renders don't restart

- [ ] **Step 1: Write the failing tests** for the four `resolveEntry` rules above (one `it` each).
- [ ] **Step 2:** FAIL. **Step 3:** Implement both files + Search change. **Step 4:** PASS; `npx tsc -b` clean apart from ProtectedRoute.

---

### Task 8: Wizard shell (page, steps, stepper, header, actions, summary panel, routes)

**Files:**
- Create: `src/features/credoper/wizard/steps.ts`, `wizard/stepComponents.tsx`, `components/wizard/OperationHeader.tsx`, `Stepper.tsx`, `WizardActions.tsx`, `SummaryPanel.tsx`, `DiscardPrompt.tsx`, `pages/CredOperWizardPage.tsx`, `src/styles/credoper.scss`
- Modify: `src/app/modules.ts` (`/quotation` and `/proposal` → one lazy `CredOperWizardPage` per stage via small wrappers `QuotationRoute`/`ProposalRoute` exporting `<CredOperWizardPage stage="…" />`), `src/styles/montra.scss` (`@import "credoper";`)
- Delete: `pages/QuotationPage.tsx`, `pages/ProposalPage.tsx`, `components/WizardHeader.tsx`, `components/forms/CreditDetail.tsx`
- Test: `src/features/credoper/wizard/steps.test.ts`

**Interfaces:**
- Consumes: Tasks 3–7 (`useCredOperSession`, `markSaved`, validation fns, `Stage`)
- Produces:
  - `type StepId = "customer" | "financial" | "interventions" | "insurances" | "summary"`
  - `type StepDef = { id: StepId; label: string; icon: string; validate: (op: CredOperDraft, today: LocalDate) => FieldErrors }`
  - `STEPS: Record<Stage, StepDef[]>` — quotation `[customer, financial, summary]`, proposal `[customer, financial, interventions, insurances, summary]`; labels `"Customer"`, `"Financial data"`, `"Interventions"`, `"Insurances"`, `"Summary"`; icons `bi-person`, `bi-cash-coin`, `bi-people`, `bi-shield-check`, `bi-clipboard-check`; `summary.validate` returns `{}`
  - `validateStages(steps: StepDef[], op, today): { errors: FieldErrors; firstInvalidStep?: StepId }`
  - `STEP_COMPONENTS: Record<StepId, ComponentType<StepProps>>`, `type StepProps = { errors: FieldErrors; showErrors: boolean; goTo(step: StepId): void }` (Task 8 maps all five to the existing forms / a placeholder for insurances; Tasks 9–10 replace them)
  - Page behaviour: header (`"New quotation"` / `"Quotation #{credOperNumber}"` / `"Proposal #{credOperNumber}"`, badge *Draft* / *Saved* / *Unsaved changes*, line `intermediary › supplier › vendor · {entryDate}` using `nodeFromId`), stepper (desktop numbered + states; mobile `"Step {n} of {total} · {label}"` + `progress` bar), Next validates current step (errors shown only after Next/Save/Convert), Save/Convert validate all and `goTo(firstInvalidStep)` then focus `[aria-invalid=true]`, Save → `SaveCredOper` → `markSaved`, Convert (quotation Summary only; enabled when `id != null && !isDirty`) → `QuotationToProposal` → `loadExisting` → navigate `/proposal` `{ intent: "continue" }`; server errors via `getApiErrorMessage` in an alert inside the action bar; session `status: "error"` (GetNewCredOper failed) renders an error card with **Retry** (`retry()`) instead of the steps; `status: "loading"` renders `PageLoader`; `notice` renders a dismissible info alert under the header
  - `SummaryPanel`: English labels `"Financed amount"`, `"Monthly payment"`, `"TAN"`, `"TAEG"`, `"Term"`; Calculate → `CalculateOperations` → `setCredoper`; shows `"Values changed — recalculate"` when amount/term/initial entry/product differ from the values at the last successful calculation (snapshot kept in component state)
  - `DiscardPrompt`: modal using the `NewsPreviewModal` pattern; buttons `"Continue editing"` / `"Discard and start new"`

- [ ] **Step 1: Write the failing tests** for `steps.ts`: quotation has 3 steps in order; proposal has 5 with `insurances` 4th; `validateStages` returns `firstInvalidStep: "financial"` when only a financial error exists.
- [ ] **Step 2:** FAIL. **Step 3:** Implement shell, delete old files, update routes. **Step 4:** PASS; `npm run build` succeeds; `npx eslint src/features/credoper src/app` clean.
- [ ] **Step 5: Browser check** (headless Edge against the running dev server, mocks for `GetNewCredOper`): `/quotation` shows "New quotation", 3 steps, Draft badge; Next on empty required customer name (mock metadata `isRequired`) shows the error and stays; `/proposal` shows 5 steps; no page errors.

---

### Task 9: Restyle Customer, Financial, Interventions and Summary steps

**Files:**
- Create: `components/steps/CustomerStep.tsx`, `FinancialStep.tsx`, `InterventionsStep.tsx`, `SummaryStep.tsx`
- Modify: `components/forms/CustomerDetail.tsx`, `FinancialData.tsx`, `InterventionPersonForm.tsx`, `InterventionLegalDocForm.tsx`, `InterventionDetailsForm.tsx`, `InterventionAddressForm.tsx` (wrap fields in `OperationField`, pass `invalidMessage` from `errors` when `showErrors`, add `aria-invalid`), `wizard/stepComponents.tsx`
- Delete: `components/InterventionsTabs.tsx`, `components/forms/CreditSummary.tsx`

**Interfaces:**
- Consumes: `StepProps`, `FieldErrors` keys from Task 5, `OperationField` (Task 2), role helpers (Task 3)
- Produces: the four step components registered in `STEP_COMPONENTS`. Sections: Customer → *Commercial network* (`OperationHierarchyFields`), *Customer*; Financial → *Vehicle*, *Financing*; Interventions → person cards (role badge, name, Edit, Remove — remove disabled for the customer) + "Add guarantor" (existing `GetNewIntervGuarantor`) + the existing `InterventionsSection` sub-wizard for the selected person; Summary → read-only groups per step with `Edit` buttons calling `goTo`, and an issues list (`errors` → message + link to its step).

- [ ] **Step 1:** Implement the four steps and form changes (same fields as today — verify by listing labels before/after: Customer 6 + 3 hierarchy, Financial 13).
- [ ] **Step 2:** `npm test` all PASS; `npm run build` OK; eslint clean for touched files.
- [ ] **Step 3: Browser check:** fill a quotation end to end with mocks; registration date tomorrow blocks Next with `"Registration date can't be in the future."`; Summary lists issues and Edit jumps to the step; Save sends the operation (mock `SaveCredOper` echoes it with `id: 501, credOperNumber: 501`); header becomes "Quotation #501" + Saved; Convert enabled → navigates to `/proposal` "Proposal #501" (mock `QuotationToProposal` returns `credOperStep: 2`); guarantor aged 17 blocks Save.

---

### Task 10: Insurances step

**Files:**
- Create: `insurance/components/InsurancesStep.tsx`, `InsuranceCard.tsx`, `CreditProtectionDialog.tsx`, `CarInsuranceDialog.tsx`
- Modify: `wizard/stepComponents.tsx` (`insurances` → `InsurancesStep`), `src/styles/credoper.scss`

**Interfaces:**
- Consumes: insurance API + rules (Task 6), slice insurance actions (Task 4), `interventionName`/`interventionRole`/`assetLabel`/`customerOf` (Task 3), `SelectField`, `NewsPreviewModal` dialog pattern
- Produces: `InsurancesStep` (StepProps). Dialog contract: `({ initial?: Insurance; onSave(ins: Insurance): void; onClose(): void })`; dialogs validate with `validateInsurance` + `isDuplicate` on Save (errors shown inline) and create ids with `crypto.randomUUID()`.
  - Credit protection: "Insured person" (interventions: `"{name} · {role}"`), "Insurance type" (types `CreditProtection`).
  - Car: "Vehicle" (assets via `assetLabel`), "Insurance type" (types `Car`; change resets `protectionIds` to the mandatory ones), "Driver license expiry date" (`type="date"`), switch "Main driver is the customer" (default on, helper text `customerOf` name), when off "Driver name" + "Driver license number", protections checkbox list (mandatory checked + disabled, label suffix `"(mandatory)"`).
  - Types/protections load failure → inline `alert-danger` inside the dialog with a **Retry** button (`refetch`); loading → spinner in the select (`isLoading`).
  - Add buttons disabled with hint `"Add a person in Interventions first."` / `"Add a vehicle in Financial data first."`; empty state `"No insurances added."`; cards show the link error when broken.

- [ ] **Step 1:** Implement.
- [ ] **Step 2:** `npm test` PASS; `npm run build` OK; eslint clean.
- [ ] **Step 3: Browser check** on `/proposal` (dev sample insurance data): add credit protection for the customer; adding the same type again shows the duplicate message; add car insurance with a driver who isn't the customer (name + licence required), expired licence blocked, mandatory protection locked; edit and remove work; Save request body contains `insurances` with 2 items; mobile 390 px no horizontal overflow; no page errors.

---

### Task 11: Final verification

**Files:** none new (fixes only)

- [ ] **Step 1:** `npm test` → all suites PASS.
- [ ] **Step 2:** `npx tsc -b` → only `ProtectedRoute.tsx` TS6192; `npx eslint src/features/credoper src/features/search src/components/ui src/app` → no new problems.
- [ ] **Step 3:** `npm run build` → succeeds.
- [ ] **Step 4:** Full browser run (desktop 1440 + mobile 390): menu Quotation → new; dirty → menu Quotation → discard prompt (both buttons); Search result with `credOperStep: 2` opens `/proposal`; refresh on an opened operation → new one + notice; the Task 9/10 flows; screenshots reviewed.
- [ ] **Step 5:** Report to the user with screenshots, test counts, and the backend follow-ups from spec §8.
