import type { ComponentType } from "react";
import AssetTypeStep from "../components/steps/AssetTypeStep";
import BuildingStep from "../components/steps/BuildingStep";
import BusinessStep from "../components/steps/BusinessStep";
import CompanyStep from "../components/steps/CompanyStep";
import CustomerStep from "../customer/components/CustomerStep";
import EquipmentStep from "../components/steps/EquipmentStep";
import FinancialStep from "../components/steps/FinancialStep";
import InterventionsStep from "../components/steps/InterventionsStep";
import QuotationStep from "../components/steps/QuotationStep";
import SummaryStep from "../components/steps/SummaryStep";
import InsurancesStep from "../insurance/components/InsurancesStep";
import type { StepProps } from "./stepTypes";
import type { StepId } from "./steps";

export type { StepProps } from "./stepTypes";

export const STEP_COMPONENTS: Record<StepId, ComponentType<StepProps>> = {
  business: BusinessStep,
  company: CompanyStep,
  assetType: AssetTypeStep,
  quotation: QuotationStep,
  customer: CustomerStep,
  equipment: EquipmentStep,
  building: BuildingStep,
  financial: FinancialStep,
  interventions: InterventionsStep,
  insurances: InsurancesStep,
  summary: SummaryStep,
};
