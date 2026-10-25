import { WORK_CONTEXT } from "@app/workContext";
import { delay, sampleSeed } from "@platform/api/devFallback";
import type { HierarchyLevel, HierarchyNode, WorkProfile } from "../hierarchy";
import type { HierarchyPage } from "./hierarchyApi";

// Development-only stand-in for the hierarchy endpoints, big enough to exercise
// lazy loading and search: 24 organizations × 30 units × 40 members (names from the app).
// It applies the role rules like the real server should (member → own nodes only).
// Ids are strings like the API's (opaque to the app): "o3", "o3-u7", "o3-u7-m12".

const FIRST_NAMES = ["João", "Marta", "Rui", "Carla", "Miguel", "Pedro", "Inês", "Tiago", "Sofia", "Luís", "Beatriz", "Nuno", "Rita", "Bruno", "Joana"];
const LAST_NAMES = ["Pereira", "Costa", "Santos", "Martins", "Alves", "Ferreira", "Rodrigues", "Gomes", "Lopes", "Marques", "Sousa", "Oliveira"];

const ORGANIZATIONS = 24;
const UNITS = 30;
const MEMBERS = 40;

const SELF: HierarchyNode = { id: "self", name: "Ana Silva" };

const organizationId = (i: number) => `o${i + 1}`;
const unitId = (i: number, j: number) => `${organizationId(i)}-u${j + 1}`;

/** Units where the signed-in sample user is a member */
const SELF_UNIT_IDS = [unitId(0, 0), unitId(0, 1)];

export const SAMPLE_ORGANIZATIONS: HierarchyNode[] = Array.from({ length: ORGANIZATIONS }, (_, i) => ({
  id: organizationId(i),
  name: WORK_CONTEXT.sample.organization(i),
}));

const organizationIndex = (id: string) => SAMPLE_ORGANIZATIONS.findIndex((o) => o.id === id);

export const sampleUnitsOf = (id: string): HierarchyNode[] => {
  const i = organizationIndex(id);
  if (i < 0) return [];
  return Array.from({ length: UNITS }, (_, j) => ({ id: unitId(i, j), name: WORK_CONTEXT.sample.unit(i, j) }));
};

export const sampleMembersOf = (id: string): HierarchyNode[] => {
  const seed = sampleSeed(id);
  const members = Array.from({ length: MEMBERS }, (_, k) => ({
    id: `${id}-m${k + 1}`,
    name: `${FIRST_NAMES[(seed + k) % FIRST_NAMES.length]} ${LAST_NAMES[(seed * 3 + k) % LAST_NAMES.length]}`,
  }));
  return SELF_UNIT_IDS.includes(id) ? [SELF, ...members] : members;
};

export const SAMPLE_PROFILE: WorkProfile = {
  role: "supervisor",
  self: SELF,
  ownNodes: SELF_UNIT_IDS.map((id) => ({ ...SELF, unitId: id })),
  defaults: {
    organization: SAMPLE_ORGANIZATIONS[0],
    unit: sampleUnitsOf(SAMPLE_ORGANIZATIONS[0].id)[0],
    member: SELF,
  },
};

const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export async function sampleHierarchyPage(
  level: HierarchyLevel,
  parentId: string | null,
  search: string,
  page: number,
  pageSize: number,
): Promise<HierarchyPage> {
  await delay(300); // feel the loading states

  const isMember = SAMPLE_PROFILE.role === "member";
  let nodes: HierarchyNode[] =
    level === "organization"
      ? SAMPLE_ORGANIZATIONS
      : level === "unit"
        ? sampleUnitsOf(parentId ?? "")
        : sampleMembersOf(parentId ?? "");

  if (isMember) {
    if (level === "organization") nodes = nodes.filter((n) => n.id === SAMPLE_PROFILE.defaults.organization?.id);
    if (level === "unit") nodes = nodes.filter((n) => SELF_UNIT_IDS.includes(n.id));
    if (level === "member") nodes = nodes.filter((n) => n.id === SELF.id);
  }

  const matches = search ? nodes.filter((n) => normalize(n.name).includes(normalize(search))) : nodes;
  const start = (page - 1) * pageSize;

  return {
    items: matches.slice(start, start + pageSize),
    hasMore: start + pageSize < matches.length,
    isSample: true,
  };
}
