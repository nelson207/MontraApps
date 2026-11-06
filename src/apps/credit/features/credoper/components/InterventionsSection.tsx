import { useEffect, useState } from "react";
import { selectCredoper, selectEntityLookup, useAppDispatch, useAppSelector } from "@credit/store";
import EntityLookupGate from "../entityLookup/EntityLookupGate";
import { isLookupPending } from "../entityLookup/entityLookup";
import { usePhoneTypes } from "../hooks/useEntityOptions";
import { isCompany, isExistingEntity } from "../model/credOperDraft";
import { missingRequired, type MissingField } from "../model/interventionRequired";
import InterventionAddressForm from "./forms/InterventionAddressForm";
import InterventionCompanyForm from "./forms/InterventionCompanyForm";
import InterventionDetailsForm from "./forms/InterventionDetailsForm";
import InterventionLegalDocForm from "./forms/InterventionLegalDocForm";
import InterventionPersonForm from "./forms/InterventionPersonForm";
import InterventionSummaryPanel from "./InterventionSummaryPanel";
import InterventionTabs from "./InterventionWizardHeader";
import type { InterventionFormProps } from "../types/credoperTypes";
import { updateIntervention } from "../utils/fieldSetters";
import { interventionTabOfErrorKey } from "../wizard/steps";

// One person: the tabs Details / Address / Legal document / Person details, moved through with
// Previous and Next, and beside them what's still needed to save.
// Rendered with key={correlationID} by InterventionsStep, so it restarts per person.
export function InterventionsSection({ index, intervention, errors }: InterventionFormProps) {
  const dispatch = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);

  // Sub-tabs holding this person's errors (only present once errors are shown)
  const prefix = `interventions.${intervention?.correlationID}.`;
  const errorKeys = Object.keys(errors ?? {}).filter((key) => key.startsWith(prefix));
  const errorTabs = new Set(errorKeys.map(interventionTabOfErrorKey));
  const errorSignature = errorKeys.join("|");

  const [step, setStep] = useState<number>(() => Math.min(...errorTabs, 1));
  // When new errors appear and the open tab has none, open the first tab that does
  const [seenSignature, setSeenSignature] = useState(errorSignature);
  if (seenSignature !== errorSignature) {
    setSeenSignature(errorSignature);
    if (errorTabs.size > 0 && !errorTabs.has(step as 1 | 2 | 3 | 4)) setStep(Math.min(...errorTabs));
  }

  // Phones that came without a type (typed in the quotation): a mobile, or a landline
  const phoneTypes = usePhoneTypes();
  const untypedMobile = !intervention?.entityMobilePhone?.id && !!intervention?.entityMobilePhone?.phoneNumber && intervention.entityMobilePhone.phoneTypeId == null;
  const untypedLandline = !intervention?.entityLandlinePhone?.id && !!intervention?.entityLandlinePhone?.phoneNumber && intervention.entityLandlinePhone.phoneTypeId == null;
  const stampPhones = phoneTypes.isReady && !isExistingEntity(intervention) && (untypedMobile || untypedLandline);
  useEffect(() => {
    if (!stampPhones || index === undefined) return;
    updateIntervention(dispatch, credoper, index, (person) => ({
      ...person,
      ...(untypedMobile ? { entityMobilePhone: { ...person.entityMobilePhone, phoneTypeId: phoneTypes.mobileId } } : {}),
      ...(untypedLandline ? { entityLandlinePhone: { ...person.entityLandlinePhone, phoneTypeId: phoneTypes.landlineId } } : {}),
    }));
    // Once per phone found without a type
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stampPhones]);

  const company = isCompany(intervention ?? undefined);
  const existing = isExistingEntity(intervention);
  const steps = [
    { id: 1, label: "Details", component: InterventionDetailsForm, icon: "bi-person", required: !existing },
    { id: 2, label: "Address", component: InterventionAddressForm, icon: "bi-geo-alt", required: !existing },
    { id: 3, label: "Legal Document", component: InterventionLegalDocForm, icon: "bi-file-earmark-text", required: false },
    // What the API says the entity is: a person's details or a company's
    company
      ? { id: 4, label: "Company Details", component: InterventionCompanyForm, icon: "bi-building", required: false }
      : { id: 4, label: "Person Details", component: InterventionPersonForm, icon: "bi-file-earmark-person", required: false },
  ];

  const missing = intervention ? missingRequired(intervention) : [];
  const missingIn = (id: number) => missing.filter((field) => field.tab === id).length;

  const lookup = useAppSelector(selectEntityLookup(intervention?.correlationID));
  const pending = isLookupPending(intervention, lookup);

  const position = steps.findIndex((s) => s.id === step);
  const currentStep = steps[position];
  const CurrentStepComponent = currentStep?.component;
  const previous = steps[position - 1];
  const next = steps[position + 1];

  /** Its tab open, at the field */
  const openField = (field: MissingField) => {
    setStep(field.tab);
    requestAnimationFrame(() => document.getElementById(`intervention-${index ?? 0}-${field.fieldId}`)?.focus());
  };

  return (
    <>
      {intervention && <EntityLookupGate intervention={intervention} />}

      {/* A new person: everything else waits for the NIF lookup (or "Fill in manually") */}
      <div className={`row g-3 align-items-start ${pending ? "app-entity-locked" : ""}`} inert={pending} aria-disabled={pending || undefined}>
        <div className="col-12 col-lg-8 col-xxl-9">
          <div className="border rounded-3">
            <InterventionTabs
              steps={steps.map(({ id, label, icon, required }) => ({
                label,
                icon,
                hasError: errorTabs.has(id as 1 | 2 | 3 | 4),
                missing: missingIn(id),
                complete: required && missingIn(id) === 0,
              }))}
              currentStep={step}
              onStepClick={setStep}
            />

            <div id="person-tab-panel" role="tabpanel" aria-labelledby={`person-tab-${step}`} className="p-3">
              {CurrentStepComponent && <CurrentStepComponent index={index} intervention={intervention} errors={errors} />}
            </div>

            <div className="d-flex flex-wrap justify-content-between gap-2 border-top px-3 py-2">
              {previous ? (
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setStep(previous.id)}>
                  <i className="bi bi-chevron-left me-1" aria-hidden="true" />
                  {previous.label}
                </button>
              ) : (
                <span />
              )}
              {next && (
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setStep(next.id)}>
                  {next.label}
                  <i className="bi bi-chevron-right ms-1" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4 col-xxl-3">
          <InterventionSummaryPanel
            missing={missing}
            onOpenField={openField}
            onOpenSection={setStep}
            sections={steps.map(({ id, label, required }) => ({
              id,
              label,
              status: missingIn(id) ? `${missingIn(id)} to fill` : required ? "Complete" : existing && id < 3 ? "Loaded" : "Optional",
              tone: missingIn(id) ? "todo" : required ? "done" : "optional",
            }))}
          />
        </div>
      </div>
    </>
  );
}
