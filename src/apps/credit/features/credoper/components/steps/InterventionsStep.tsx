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
  secondHolderBlock,
} from "../../model/credOperDraft";
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
} as const satisfies Record<string, { label: string; icon: string; kind: NewInterventionKind }>;

type NewPersonKind = keyof typeof NEW_PERSON;

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

  const hasErrors = (ref?: string) =>
    Object.keys(errors).some((key) => key.startsWith(`interventions.${ref}.`));

  // A second holder only for a person first holder, and only one
  const canAddSecondHolder = !!credoper && secondHolderBlock(credoper) === null;
  const addable = (Object.keys(NEW_PERSON) as NewPersonKind[]).filter(
    (kind) => kind !== "secondHolder" || canAddSecondHolder,
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
    setSelected((s) => (s >= index ? Math.max(0, s - 1) : s));
  };

  return (
    <>
      <div className="row g-2 mb-3">
        {interventions.map((person, index) => {
          const role = interventionRole(person);
          const isSelected = index === current;
          const roleError = errors[`interventions.${person.correlationID}.role`];
          return (
            <div
              key={person.correlationID ?? index}
              className="col-12 col-sm-6 col-xl-4"
            >
              <div
                className={`app-person-card ${isSelected ? "is-selected" : ""}`}
              >
                <button
                  type="button"
                  className="app-person-card-main"
                  aria-pressed={isSelected}
                  onClick={() => setSelected(index)}
                >
                  <i
                    className={`bi ${ROLE_ICONS[role]} fs-4 text-primary`}
                    aria-hidden="true"
                  />
                  <span className="overflow-hidden">
                    <span className="d-block fw-semibold text-truncate">
                      {interventionName(person)}
                    </span>
                    <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis">
                      {ROLE_LABELS[role]}
                    </span>
                    {hasErrors(person.correlationID) && (
                      <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis ms-1">
                        Has errors
                      </span>
                    )}
                    {roleError && (
                      <span className="d-block small text-danger mt-1">
                        {roleError}
                      </span>
                    )}
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
            </div>
          );
        })}
        {addable.map((kind) => (
          <div key={kind} className="col-12 col-sm-6 col-xl-4">
            <button
              type="button"
              className="app-person-card app-person-card-add w-100"
              onClick={() => addPerson(kind)}
              disabled={adding !== null}
            >
              {adding === kind ? (
                <span
                  className="spinner-border spinner-border-sm"
                  aria-hidden="true"
                />
              ) : (
                <i
                  className={`bi ${NEW_PERSON[kind].icon} fs-4`}
                  aria-hidden="true"
                />
              )}
              <span>{NEW_PERSON[kind].label}</span>
            </button>
          </div>
        ))}
      </div>

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
