import { useState } from "react";
import { selectCredoper, useAppDispatch, useAppSelector } from "@credit/store";
import type { NewInterventionKind } from "@platform/api/generated/MontraPOSApi";
import { newIntervention } from "../../api/credOperApi";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import { addIntervention, patchCredoper } from "../../credoperSlice";
import {
  interventionName,
  interventionRole,
  ROLE_LABELS,
} from "../../model/credOperDraft";
import {
  pageOfPerson,
  peopleSlots,
  PEOPLE_PER_PAGE,
  type NewPersonKind,
  type PeopleSlot,
} from "../../model/peopleSlots";
import type { StepProps } from "../../wizard/stepTypes";
import { InterventionsSection } from "../InterventionsSection";

const SECOND_HOLDER_TYPE = 2;

const NEW_PERSON = {
  secondHolder: {
    label: "Add second holder",
    icon: "bi-person-plus",
    kind: "SecondHolder",
  },
  guarantor: {
    label: "Add guarantor",
    icon: "bi-shield-plus",
    kind: "Guarantor",
  },
} as const satisfies Record<NewPersonKind, { label: string; icon: string; kind: NewInterventionKind }>;

const ROLE_ICONS = {
  customer: "bi-person-fill",
  secondHolder: "bi-people-fill",
  guarantor: "bi-shield-fill-check",
} as const;

// Proposal: the people involved, as cards (select / add second holder or guarantor / remove),
// with the selected person's forms below.
function InterventionsStep({ errors }: StepProps) {
  const dispatch = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);
  const interventions = credoper?.interventions ?? [];
  const [selected, setSelected] = useState(0);
  const [adding, setAdding] = useState<NewPersonKind | null>(null);
  const [addError, setAddError] = useState<unknown>(null);
  // When errors appear (Save / Next) and the selected person has none, select the first one that does
  const peopleWithErrors = interventions
    .map((person, index) =>
      Object.keys(errors).some((key) =>
        key.startsWith(`interventions.${person.correlationID}.`),
      )
        ? index
        : -1,
    )
    .filter((index) => index !== -1);
  const errorSignature = peopleWithErrors.join(",");
  const [seenSignature, setSeenSignature] = useState(errorSignature);
  if (seenSignature !== errorSignature) {
    setSeenSignature(errorSignature);
    if (peopleWithErrors.length > 0 && !peopleWithErrors.includes(selected))
      setSelected(peopleWithErrors[0]);
  }
  const current = Math.min(selected, Math.max(0, interventions.length - 1));
  const intervention = interventions[current];

  // Customer, second holder's place, guarantors… (peopleSlots); more than a row holds are paged,
  // like the dashboard's news, and the page follows the selected person (one added, or the first
  // with errors)
  const slots = credoper ? peopleSlots(credoper) : [];
  const pages = Math.max(1, Math.ceil(slots.length / PEOPLE_PER_PAGE));
  const [page, setPage] = useState(() => pageOfPerson(slots, current));
  const [pageOf, setPageOf] = useState(current);
  if (pageOf !== current) {
    setPageOf(current);
    setPage(pageOfPerson(slots, current));
  }
  const shownPage = Math.min(page, pages - 1);
  const isGallery = pages > 1;
  const shown = slots.slice(shownPage * PEOPLE_PER_PAGE, (shownPage + 1) * PEOPLE_PER_PAGE);

  const hasErrors = (ref?: string) =>
    Object.keys(errors).some((key) => key.startsWith(`interventions.${ref}.`));

  const isAddable = (kind: NewPersonKind) =>
    slots.some((s) => s.kind === "add" && s.person === kind && !s.blocked) ||
    // No free place for its card (the last row is full): still addable
    (kind === "guarantor" && !slots.some((s) => s.kind === "add" && s.person === "guarantor"));
  /** In the head: what can be added but has no card on the row shown */
  const addableHere = (Object.keys(NEW_PERSON) as NewPersonKind[]).filter(
    (kind) => isAddable(kind) && !shown.some((s) => s.kind === "add" && s.person === kind),
  );

  const addPerson = async (kind: NewPersonKind) => {
    setAdding(kind);
    setAddError(null);
    try {
      // New API: GET /api/credit-operations/new-intervention?kind=SecondHolder|Guarantor
      const created = await newIntervention(dispatch, NEW_PERSON[kind].kind);
      // Make sure a second holder is marked as one
      dispatch(
        addIntervention(
          kind === "secondHolder"
            ? { ...created, credOperIntervType: SECOND_HOLDER_TYPE }
            : created,
        ),
      );
      setSelected(interventions.length);
    } catch (error) {
      setAddError(error);
    } finally {
      setAdding(null);
    }
  };

  const remove = (index: number) => {
    const person = interventions[index];
    if (
      !window.confirm(`Remove ${interventionName(person)} from this proposal?`)
    )
      return;
    dispatch(
      patchCredoper({
        interventions: interventions.filter((_, i) => i !== index),
      }),
    );
    // The selected person stays selected; the one removed hands over to a card on the row shown
    // (the one before it, else after it, else the customer)
    let next = current;
    if (index === current) {
      const onRow = shown.flatMap((s) => (s.kind === "person" && s.index !== index ? [s.index] : []));
      const position = shown.findIndex((s) => s.kind === "person" && s.index === index);
      const before = shown.slice(0, position).flatMap((s) => (s.kind === "person" ? [s.index] : []));
      const customer = slots.find((s) => s.kind === "person");
      next = before.at(-1) ?? onRow[0] ?? (customer?.kind === "person" ? customer.index : 0);
    }
    const shifted = next > index ? next - 1 : next;
    setSelected(shifted);
    // Removing never moves the row shown (only a page that no longer exists falls back to the last)
    setPageOf(shifted);
  };

  const personCard = (index: number) => {
    const person = interventions[index];
    const role = interventionRole(person);
    const isSelected = index === current;
    const roleError = errors[`interventions.${person.correlationID}.role`];
    return (
      <div key={person.correlationID ?? index} className={`app-person-card ${isSelected ? "is-selected" : ""}`}>
        <button
          type="button"
          className="app-person-card-main"
          aria-pressed={isSelected}
          onClick={() => setSelected(index)}
        >
          <i className={`bi ${ROLE_ICONS[role]} fs-5 text-primary`} aria-hidden="true" />
          <span className="overflow-hidden">
            <span className="d-block fw-semibold text-truncate">{interventionName(person)}</span>
            <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis">{ROLE_LABELS[role]}</span>
            {hasErrors(person.correlationID) && (
              <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis ms-1">Has errors</span>
            )}
            {roleError && <span className="d-block small text-danger mt-1">{roleError}</span>}
          </span>
        </button>
        {role !== "customer" && (
          <button
            type="button"
            className="btn btn-sm btn-link text-danger app-person-card-remove"
            aria-label={`Remove ${interventionName(person)}`}
            onClick={() => remove(index)}
          >
            <i className="bi bi-trash" />
          </button>
        )}
      </div>
    );
  };

  /** The card to add a second holder or guarantor; one that can't be added says why */
  const addCard = (slot: Extract<PeopleSlot, { kind: "add" }>) => (
    <button
      key={`add-${slot.person}`}
      type="button"
      className="app-person-card app-person-card-add"
      onClick={() => addPerson(slot.person)}
      disabled={adding !== null || !!slot.blocked}
      title={slot.blocked ?? undefined}
    >
      {adding === slot.person ? (
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      ) : (
        <i className={`bi ${NEW_PERSON[slot.person].icon} fs-5`} aria-hidden="true" />
      )}
      <span className="text-start">
        <span className="d-block">{NEW_PERSON[slot.person].label}</span>
        {slot.blocked && <span className="d-block small">{slot.blocked}</span>}
      </span>
    </button>
  );

  return (
    <>
      <section className="app-people mb-3" aria-label="People on this proposal">
        <div className="app-section-head mb-2">
          <span className="small text-body-secondary">
            {interventions.length} {interventions.length === 1 ? "person" : "people"}
          </span>
          <div className="d-flex flex-wrap align-items-center gap-2 ms-auto">
            {addableHere.map((kind) => (
              <button
                key={kind}
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => addPerson(kind)}
                disabled={adding !== null}
              >
                {adding === kind ? (
                  <span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />
                ) : (
                  <i className={`bi ${NEW_PERSON[kind].icon} me-1`} aria-hidden="true" />
                )}
                {NEW_PERSON[kind].label}
              </button>
            ))}
            {isGallery && (
              <>
                <button
                  type="button"
                  className="app-round-btn"
                  aria-label="Previous people"
                  disabled={shownPage === 0}
                  onClick={() => setPage(shownPage - 1)}
                >
                  <i className="bi bi-chevron-left" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="app-round-btn"
                  aria-label="Next people"
                  disabled={shownPage >= pages - 1}
                  onClick={() => setPage(shownPage + 1)}
                >
                  <i className="bi bi-chevron-right" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="app-people-grid">
          {shown.map((slot) => (slot.kind === "person" ? personCard(slot.index) : addCard(slot)))}
        </div>

        {isGallery && (
          <div className="app-page-dots mt-2">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`app-page-dot ${i === shownPage ? "is-current" : ""}`}
                aria-label={`People page ${i + 1} of ${pages}`}
                aria-current={i === shownPage ? "true" : undefined}
                onClick={() => setPage(i)}
              >
                <span />
              </button>
            ))}
          </div>
        )}
      </section>

      {!!addError && (
        <div className="alert alert-danger py-2" role="alert">
          {getApiErrorMessage(addError) ??
            "Couldn't add the person. Please try again."}
        </div>
      )}

      {intervention ? (
        <div className="border rounded-3 p-3">
          <InterventionsSection
            key={intervention.correlationID ?? current}
            index={current}
            intervention={intervention}
            errors={errors}
          />
        </div>
      ) : (
        <p className="text-body-secondary mb-0">
          No people on this proposal yet.
        </p>
      )}
    </>
  );
}

export default InterventionsStep;
