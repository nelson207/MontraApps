import type { WorkContextConfig } from "@platform/features/workContext/workContextConfig";
import { CREDIT_HIERARCHY } from "./hierarchySource";

// Montra Credit's working context: Credit intermediary → Supplier → Vendor.

const CITIES = ["Lisboa", "Porto", "Braga", "Coimbra", "Faro", "Aveiro", "Setúbal", "Évora", "Leiria", "Viseu", "Funchal", "Guimarães"];
const SUPPLIER_KINDS = ["Stand", "Auto", "Motors", "Garagem", "Car Center"];

export const WORK_CONTEXT: WorkContextConfig = {
  levels: {
    organization: { label: "Credit intermediary", plural: "credit intermediaries" },
    unit: { label: "Supplier", plural: "suppliers" },
    member: { label: "Vendor", plural: "vendors" },
  },
  memberRole: "salesman",
  purpose: "Default values for new quotations and proposals.",
  impersonationNote: "New operations will be registered on their behalf.",
  source: CREDIT_HIERARCHY,
  sample: {
    organization: (i) => `${i % 2 === 0 ? "Auto Crédito" : "Financiamentos"} ${CITIES[Math.floor(i / 2)]}`,
    unit: (organizationIndex, j) =>
      `${SUPPLIER_KINDS[j % SUPPLIER_KINDS.length]} ${CITIES[Math.floor(organizationIndex / 2)]} ${String(j + 1).padStart(2, "0")}`,
  },
};
