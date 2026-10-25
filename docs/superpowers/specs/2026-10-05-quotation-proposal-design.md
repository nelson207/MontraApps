# Quotation & Proposal redesign — design spec

Date: 2026-10-05 · Status: approved design, pending spec review

## 1. Goal

Rebuild the Quotation and Proposal screens of Montra Credit on one shared wizard, with a
clear operation lifecycle, server-driven + date validation, a refreshed UI, and a new
insurance step on proposals. The **field set of each screen stays the same**.

### Decisions taken

| Topic | Decision |
|---|---|
| Architecture | One shared wizard; Quotation and Proposal are two configurations (approach 1) |
| Lifecycle | Menu entry always starts a new operation; a saved quotation can be **converted** to a proposal; Search opens existing operations |
| Validation | Server field rules (`metadataResponse`: required / visible / read-only) on **every** field + date rules against today |
| Insurances | Proposal only; **several** of each kind; each linked to a person (credit protection) or a vehicle (car insurance) |
| Protections | Multi-select; list comes from the API per insurance type; mandatory ones pre-checked and locked |
| Tests | Add **Vitest** (dev-only) for logic; browser checks for flows |

### Out of scope

Insurance premiums/pricing (insurances don't affect the calculation) · reloading an opened
operation after a page refresh (needs a "get operation by id" endpoint) · backend changes.

## 2. Lifecycle & architecture

### Routes and page

- `/quotation` and `/proposal` both render `CredOperWizardPage` with `stage: "quotation" | "proposal"`.
- `QuotationPage.tsx` and `ProposalPage.tsx` (≈95 % duplicated today) are replaced by it.

### `useCredOperSession(stage)`

Decides what the screen works on from a navigation **intent** (React Router `location.state`):

| From | Intent | Behaviour |
|---|---|---|
| Sidebar menu (default) | `new` | Reset slice → `GET /api/CreditOperations/GetNewCredOper` (`includeCustomer`: quotation `false`, proposal `true`), **refetched on every entry** → apply working-context defaults (`applyWorkContextDefaults`) → `credOperStep` = 1 (quotation) / 2 (proposal) → `insurances: []` |
| Search | `open` | Use the operation Search put in the store. Search navigates to `/quotation` or `/proposal` by `credOperStep` (fixes today's always-`/quotation`) |
| Convert to proposal | `continue` | Use the proposal returned by `QuotationToProposal` |
| `open`/`continue` with nothing in store (e.g. refresh) | — | Fall back to `new` and show an info notice |

**Unsaved work guard:** entering with intent `new` while the store holds an operation with
`isDirty = true` shows a prompt: *"You have unsaved changes to {Quotation #n}"* →
**Continue editing** (keep it; switch to its stage's screen if different) / **Discard and start new**.
A `beforeunload` warning is registered while `isDirty`.

### Store (`credoper` slice)

Keeps the existing reducers and adds:

- `startNew(operation)`, `loadExisting(operation)` — set data, reset `isDirty`
- `setInsurances`, `addInsurance`, `updateInsurance(id, patch)`, `removeInsurance(id)`
- `isDirty` — set by every edit reducer, cleared on successful save / load / start
- `markSaved(operation)` — store server response, clear `isDirty`

Operation type on the client:

```ts
type CredOperDraft = CredOperDto & { insurances: Insurance[] };
```

`insurances` is **not** in `CredOperDto` today; it is sent with Save. The backend must add it.

### Wizard configuration

```ts
type WizardStep = {
  id: StepId;               // "customer" | "financial" | "interventions" | "insurances" | "summary"
  label: string;
  icon: string;             // Bootstrap Icons class
  component: ComponentType;
  validate: (op: CredOperDraft, today: LocalDate) => FieldErrors;
};

QUOTATION_STEPS = [customer, financial, summary];
PROPOSAL_STEPS  = [customer, financial, interventions, insurances, summary];
```

### Actions

| Action | Where | Behaviour |
|---|---|---|
| Next / Back | every step | Next validates the current step (section 3) |
| Save | every step | Validates all steps → `POST SaveCredOper` with `CredOperDraft` → `markSaved` |
| Calculate | summary panel | `POST CalculateOperations` (as today) |
| Convert to proposal | quotation, Summary step | Enabled when saved (`id != null`) and `!isDirty` → `POST QuotationToProposal` → navigate `/proposal` with intent `continue` |

## 3. Validation

Module `features/credoper/validation/` — pure functions, unit-tested.

### Server field rules

- `fieldRule(metadata, jsonName) → { visible, required, readOnly }`, read from the
  `metadataResponse` of the matching part (operation, asset, equipment, condition, intervention).
  No metadata → visible, optional, editable.
- Not visible → hidden **and** not validated. Read-only → disabled. Required → `*` on the
  label, empty value → "This field is required."
- Applied by an `OperationField` wrapper so forms don't repeat it. `InputField` gains
  `invalidMessage` (like `SelectField`).

### Date rules (compared as calendar days in local time)

| Field | Rule |
|---|---|
| Equipment registration date | not after today |
| Person birth date | before today; holders **18+ today** |
| Legal document expiration date | not before today |
| Driver license expiry date | not before today |

Plus format checks: e-mail address, phone number validity (intl-tel-input).

### When errors show

- Not while typing: on **Next** (current step), **Save** / **Convert** (all steps).
- Save/Convert with errors → go to the first step with errors and focus its first invalid field.
- Stepper shows per-step state: current / done / has errors. Visited steps are clickable.
- Server rejection on Save/Convert → alert with the server message; local edits kept.

## 4. Screens & styling

- **Header card:** "New quotation" / "Quotation #n" / "Proposal #n", status badge
  (*Draft* / *Saved* / *Unsaved changes*), line with intermediary › supplier › vendor · created date.
  Replaces the debug "Company ID / Business ID / Opertype ID" line.
- **Stepper:** numbered steps with icons and states (desktop); "Step 2 of 5 · Financial data"
  + progress bar (mobile).
- **Layout:** step content in a white card (left); **sticky summary panel** (right, desktop;
  below content on mobile) — financed amount, monthly payment, TAN/TAEG, term ±, Calculate,
  and a *"Values changed — recalculate"* state when inputs changed after the last calculation.
- **Action bar** at the bottom of the step card: Back · Next · Save · (Convert to proposal on
  the quotation Summary).
- **Steps** (same fields, grouped under section headings):
  - Customer — *Commercial network* (intermediary / supplier / vendor), *Customer* (name,
    fiscal number, e-mail, mobile, landline)
  - Financial data — *Vehicle* (type, category, state, plate, registration date, description),
    *Financing* (customer type, financial product, amount, initial entry amount & %, term)
  - Interventions (proposal) — person cards with role badge (customer / second holder /
    guarantor); add / edit / remove using the existing person, address and legal-document forms
  - Insurances (proposal) — section 5
  - Summary — read-only review per step with **Edit** links, list of validation issues linking
    to their fields, Save / Convert
- Labels in English (the calculation panel's Portuguese labels are translated).
- Theme colours, Bootstrap utilities, shared `SearchableSelect`/`SelectField`.

## 5. Insurances (proposal only)

### Data

```ts
type CreditProtectionInsurance = {
  id: string;                    // client id until the server assigns one
  kind: "creditProtection";
  insuranceTypeId: number;
  interventionRef: string;       // intervention correlationID
};

type CarInsurance = {
  id: string;
  kind: "car";
  insuranceTypeId: number;
  assetRef: string;              // asset correlationID
  driver: {
    licenseExpiryDate: string;   // yyyy-MM-dd
    mainDriverIsCustomer: boolean;
    name?: string;               // required when mainDriverIsCustomer = false
    licenseNumber?: string;      // required when mainDriverIsCustomer = false
  };
  protectionIds: number[];       // at least one
};

type Insurance = CreditProtectionInsurance | CarInsurance;
```

References use `correlationID` (present before the first save).

### API (placeholder; dev-only sample fallback like other features)

- `GET /api/Insurances/Types?kind=CreditProtection|Car` → `[{ id, name, description }]`
- `GET /api/Insurances/Types/{typeId}/Protections` → `[{ id, name, description, mandatory }]`

### UI

- Insurances step: sections **Credit protection** and **Car insurance**, each a list of cards
  (type, insured person / vehicle, driver, number of protections) with Add / Edit / Remove,
  and an empty state. Insurances are optional.
- Add/Edit dialog — **credit protection:** insured person (from interventions: name + role),
  insurance type (searchable, from API).
- Add/Edit dialog — **car insurance:** vehicle (from assets: description / plate) → insurance
  type (loads protections; changing it resets selected protections) → driver: license expiry
  date, switch *Main driver is the customer* (default on, shows customer name); off → driver
  name + license number → protections checkboxes (mandatory pre-checked and locked).

### Rules

- Add disabled with a hint when there is nothing to insure (no interventions / no vehicle).
- No duplicate: same insurance type for the same person / vehicle.
- Insurance whose linked person / vehicle no longer exists is kept and flagged
  *"The insured person/vehicle no longer exists"*; Save is blocked until resolved.
- Driver license expiry not before today; name + license number required when the driver
  isn't the customer; at least one protection.

## 6. Error handling

| Situation | Behaviour |
|---|---|
| `GetNewCredOper` fails | Error card with Retry instead of the form |
| Calculate / Save / Convert fails | Alert next to the action with the server message; edits kept; failed Convert leaves the quotation untouched |
| Insurance types / protections fail | Inline error in the dialog with Retry |
| Linked person / vehicle removed | Insurance flagged; Save blocked |
| Unsaved work + new entry / leaving site | Prompt / `beforeunload` (section 2) |

## 7. Testing

- **Vitest** (dev dependency, `npm test`): validation rules (field rules, dates vs today, 18+),
  insurance rules (required, duplicates, broken links), step configuration, session intent
  resolution, reducers (`isDirty`, insurances).
- **Browser checks** (headless Edge, as for previous features): new quotation; validation
  blocking Next/Save; save → convert → proposal; open from Search into the right screen;
  add both insurance kinds incl. a driver who isn't the customer; discard prompt; mobile layout.
- Mocks for what the backend lacks: insurance endpoints, `insurances` on Save.

## 8. Backend follow-ups

1. Add `insurances` to the operation DTO (shape in section 5) and persist it on Save / QuotationToProposal.
2. Implement the two insurance endpoints.
3. Optional: `GET /api/CreditOperations/{id}` so opened operations survive a page refresh.
4. Enforce the same validation rules server-side.
