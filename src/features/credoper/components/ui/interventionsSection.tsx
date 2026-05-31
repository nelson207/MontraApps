import { useEffect, useState } from "react";
import InterventionAddressForm from "../../forms/interventionAddress";
import InterventionDetailsForm from "../../forms/interventionDetails";
import InterventionLegalDocForm from "../../forms/interventionLegalDoc";
import InterventionPersonForm from "../../forms/interventionPerson";
import InterventionWizard from "../navigation/interventionWizard";
import type { InterventionFormProps } from "../../types/credoperTypes";

export function InterventionsSection({
  index,
  intervention,
}: InterventionFormProps) {
  const [step, setStep] = useState<number>(1);

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

  useEffect(() => {
    // Reset to first step when intervention changes
    setStep(1);
  }, [index]);

  const currentStep = steps.find((s) => s.id === step);
  const CurrentStepComponent = currentStep?.component;

  return (
    <>
      <InterventionWizard
        steps={steps.map(({ label, icon }) => ({ label, icon }))}
        currentStep={step}
        onStepClick={setStep}
      />

      {CurrentStepComponent && (
        <CurrentStepComponent index={index} intervention={intervention} />
      )}
    </>
  );
}
