import { pagedHierarchySource } from "@platform/features/workContext/hierarchySource";
import type { WorkContextConfig } from "@platform/features/workContext/workContextConfig";

// Montra Lawyer's working context: Lawyers office → Lawyer department → Lawyer.

const CITIES = ["Lisboa", "Porto", "Braga", "Coimbra", "Faro", "Aveiro", "Setúbal", "Évora", "Leiria", "Viseu", "Funchal", "Guimarães"];
const FOUNDERS = ["Almeida", "Barros", "Cardoso", "Duarte", "Esteves", "Figueiredo", "Gonçalves", "Henriques", "Jesus", "Lima", "Mendes", "Nunes"];
const DEPARTMENTS = ["Litigation", "Labour", "Tax", "Corporate", "Real Estate", "Criminal"];

export const WORK_CONTEXT: WorkContextConfig = {
  levels: {
    organization: { label: "Lawyers office", plural: "lawyers offices" },
    unit: { label: "Lawyer department", plural: "lawyer departments" },
    member: { label: "Lawyer", plural: "lawyers" },
  },
  memberRole: "lawyer",
  purpose: "Who you work as: default values for new legal actions.",
  impersonationNote: "New legal actions will be registered on their behalf.",
  // TODO: placeholder endpoints (not exposed by the backend yet)
  source: pagedHierarchySource({
    me: "/api/LawHierarchy/Me",
    organizations: "/api/LawHierarchy/Offices",
    units: (officeId) => `/api/LawHierarchy/Offices/${officeId}/Departments`,
    members: (departmentId) => `/api/LawHierarchy/Departments/${departmentId}/Lawyers`,
  }),
  sample: {
    organization: (i) =>
      i % 2 === 0
        ? `${FOUNDERS[Math.floor(i / 2)]} & Associados`
        : `${CITIES[Math.floor(i / 2)]} Advogados`,
    unit: (organizationIndex, j) =>
      `${DEPARTMENTS[j % DEPARTMENTS.length]} ${CITIES[Math.floor(organizationIndex / 2)]} ${String(Math.floor(j / DEPARTMENTS.length) + 1)}`,
  },
};
