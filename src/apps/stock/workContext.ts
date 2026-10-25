import { pagedHierarchySource } from "@platform/features/workContext/hierarchySource";
import type { WorkContextConfig } from "@platform/features/workContext/workContextConfig";

// Montra Stock Credit's working context: Credit intermediary → Supplier → Vendor (the same
// network as Montra Credit). The intermediary's agreements and suppliers are the ones offered.

const CITIES = ["Lisboa", "Porto", "Braga", "Coimbra", "Faro", "Aveiro", "Setúbal", "Évora", "Leiria", "Viseu", "Funchal", "Guimarães"];
const SUPPLIER_KINDS = ["Stand", "Auto", "Motors", "Garagem", "Car Center"];

export const WORK_CONTEXT: WorkContextConfig = {
  levels: {
    organization: { label: "Credit intermediary", plural: "credit intermediaries" },
    unit: { label: "Supplier", plural: "suppliers" },
    member: { label: "Vendor", plural: "vendors" },
  },
  memberRole: "salesman",
  purpose: "Default values for new stock units: the agreements and the supplier.",
  impersonationNote: "New stock units will be registered on their behalf.",
  // TODO: placeholder endpoints (not exposed by the backend yet); the same hierarchy as Montra Credit
  source: pagedHierarchySource({
    me: "/api/Hierarchy/Me",
    organizations: "/api/Hierarchy/Intermediaries",
    units: (intermediaryId) => `/api/Hierarchy/Intermediaries/${intermediaryId}/Suppliers`,
    members: (supplierId) => `/api/Hierarchy/Suppliers/${supplierId}/Vendors`,
  }),
  sample: {
    organization: (i) => `${i % 2 === 0 ? "Auto Crédito" : "Financiamentos"} ${CITIES[Math.floor(i / 2)]}`,
    unit: (organizationIndex, j) =>
      `${SUPPLIER_KINDS[j % SUPPLIER_KINDS.length]} ${CITIES[Math.floor(organizationIndex / 2)]} ${String(j + 1).padStart(2, "0")}`,
  },
};
