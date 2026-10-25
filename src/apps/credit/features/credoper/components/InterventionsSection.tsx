import { useState } from "react";
import InterventionAddressForm from "./forms/InterventionAddressForm";
import InterventionDetailsForm from "./forms/InterventionDetailsForm";
import InterventionLegalDocForm from "./forms/InterventionLegalDocForm";
import InterventionPersonForm from "./forms/InterventionPersonForm";
import InterventionWizard from "./InterventionWizardHeader";
import type { InterventionFormProps } from "../types/credoperTypes";
import { interventionTabOfErrorKey } from "../wizard/steps";

// One person: Details / Address / Legal document / Person details.
// Rendered with key={correlationID} by InterventionsStep, so it restarts per person.
export function InterventionsSection({
  index,
  intervention,
  errors,
}: InterventionFormProps) {
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

  const steps = [
    {
      id: 1,
      label: "Details",
      component: InterventionDetailsForm,
      icon: "bi-person",
    },
    {
      id: 2,
      label: "Address",
      component: InterventionAddressForm,
      icon: "bi-geo-alt",
    },
    {
      id: 3,
      label: "Legal Document",
      component: InterventionLegalDocForm,
      icon: "bi-file-earmark-text",
    },
    {
      id: 4,
      label: "Person Details",
      component: InterventionPersonForm,
      icon: "bi-file-earmark-person",
    },
  ];

  const currentStep = steps.find((s) => s.id === step);
  const CurrentStepComponent = currentStep?.component;

  return (
    <>
      <InterventionWizard
        steps={steps.map(({ id, label, icon }) => ({ label, icon, hasError: errorTabs.has(id as 1 | 2 | 3 | 4) }))}
        currentStep={step}
        onStepClick={setStep}
      />

      {CurrentStepComponent && (
        <CurrentStepComponent index={index} intervention={intervention} errors={errors} />
      )}
    </>
  );
}
