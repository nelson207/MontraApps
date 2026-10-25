// Rules for the three-level working context every Montra app has
// (Credit: Credit intermediary → Supplier → Vendor; Lawyer: Lawyers office → Lawyer department → Lawyer).
// The levels have neutral names here; each app labels them (apps/<app>/workContext.ts).
// Lists are loaded lazily from the server, so selections carry names (not just ids).

/** A supervisor may act as any member; a member always acts as themselves */
export type UserRole = "supervisor" | "member";

export const HIERARCHY_LEVELS = ["organization", "unit", "member"] as const;
export type HierarchyLevel = (typeof HIERARCHY_LEVELS)[number];

/** isMine: the node is the signed-in user's own (from the API; absent when it doesn't say) */
export type HierarchyNode = { id: string; name: string; isMine?: boolean };

/** Any level may be empty (e.g. while picking a new unit, or "All" in a filter). */
export type ContextSelection = Record<HierarchyLevel, HierarchyNode | null>;

export type CompleteSelection = Record<HierarchyLevel, HierarchyNode>;

/** One of the user's own member nodes, and the unit it belongs to (null when unknown) */
export type OwnNode = HierarchyNode & { unitId: string | null };

export type WorkProfile = {
  role: UserRole;
  /** The signed-in user's own member node, when they have exactly one */
  self: HierarchyNode | null;
  /** All the user's own member nodes (e.g. Credit: one vendor node per supplier they sell for) */
  ownNodes: OwnNode[];
  /**
   * The default context. Only levels with a single option are filled in, cascading
   * (one intermediary → it's picked and its suppliers are checked, and so on),
   * so it may be incomplete or empty.
   */
  defaults: ContextSelection;
};

export const EMPTY_SELECTION: ContextSelection = {
  organization: null,
  unit: null,
  member: null,
};

export const isNode = (value: unknown): value is HierarchyNode =>
  !!value &&
  // Ids are the API's opaque strings (a number is an id saved before they were)
  typeof (value as HierarchyNode).id === "string" &&
  (value as HierarchyNode).id !== "" &&
  typeof (value as HierarchyNode).name === "string";

export const isComplete = (s: ContextSelection): s is CompleteSelection =>
  !!s.organization && !!s.unit && !!s.member;

/** The user's own member node in `unitId` ("you" on that supplier), if they have one there */
export function ownMemberIn(profile: WorkProfile, unitId: string | null | undefined): HierarchyNode | null {
  if (unitId == null) return null;
  const own = profile.ownNodes.find((node) => node.unitId === unitId);
  return own ? { id: own.id, name: own.name, isMine: true } : null;
}

/** A member (role) always acts as themselves: their own node in `unitId`, when we know it */
export const lockedMember = (profile: WorkProfile, unitId: string | null | undefined): HierarchyNode | null =>
  profile.role === "member" ? (ownMemberIn(profile, unitId) ?? profile.self) : null;

/**
 * Changing a level clears the levels below it.
 * A member can only act as themselves, so their member node is always their own.
 */
export function changeLevel(
  current: ContextSelection,
  level: HierarchyLevel,
  node: HierarchyNode,
  profile: WorkProfile,
): ContextSelection {
  switch (level) {
    case "organization":
      return { organization: node, unit: null, member: null };
    case "unit":
      return { ...current, unit: node, member: lockedMember(profile, node.id) };
    case "member":
      return { ...current, member: lockedMember(profile, current.unit?.id) ?? node };
  }
}

/** Empties a level and the ones below it ("All …" in a filter); a member stays themselves. */
export function clearLevel(current: ContextSelection, level: HierarchyLevel, profile: WorkProfile): ContextSelection {
  const ownMember = lockedMember(profile, level === "member" ? current.unit?.id : null);

  switch (level) {
    case "organization":
      return { organization: null, unit: null, member: ownMember };
    case "unit":
      return { ...current, unit: null, member: ownMember };
    case "member":
      return { ...current, member: ownMember };
  }
}

/**
 * A stored selection checked against the user's role. Anything incomplete,
 * malformed (e.g. an older saved format) or not allowed falls back to the
 * profile's defaults. Which units a member may use is enforced by the server.
 */
export function sanitizeSelection(
  stored: Partial<ContextSelection> | undefined,
  profile: WorkProfile,
): ContextSelection {
  const selection: ContextSelection = {
    organization: isNode(stored?.organization) ? stored.organization : null,
    unit: isNode(stored?.unit) ? stored.unit : null,
    member: isNode(stored?.member) ? stored.member : null,
  };

  if (!isComplete(selection)) return profile.defaults;
  const own = lockedMember(profile, selection.unit.id);
  if (own && selection.member.id !== own.id) return profile.defaults;
  return selection;
}

/**
 * Acting as someone else: the chosen member isn't the user's own node. The API says so per node
 * (isMine); without it, compared with the user's own node on that unit (or their only one).
 */
export function isActingAsOther(selection: ContextSelection, profile: WorkProfile): boolean {
  if (!isComplete(selection)) return false;
  const { member } = selection;
  if (typeof member.isMine === "boolean") return !member.isMine;
  const own = ownMemberIn(profile, selection.unit.id) ?? profile.self;
  return !!own && member.id !== own.id;
}

type OptionsPage = { items: HierarchyNode[]; hasMore: boolean };

/** The only option of a list, or null when it has none or several */
export const onlyOption = (page: OptionsPage | null | undefined): HierarchyNode | null =>
  page && !page.hasMore && page.items.length === 1 ? page.items[0] : null;

/**
 * The default context: walks down the levels while each has exactly one option
 * (2 intermediaries → nothing; 1 intermediary with 2 suppliers → just the intermediary).
 * A list that can't be loaded (null) stops the walk.
 */
export async function singleOptionDefaults(
  firstOptions: (level: HierarchyLevel, parentId: string | null) => Promise<OptionsPage | null>,
): Promise<ContextSelection> {
  const defaults: ContextSelection = { ...EMPTY_SELECTION };
  let parentId: string | null = null;
  for (const level of HIERARCHY_LEVELS) {
    const only = onlyOption(await firstOptions(level, parentId));
    if (!only) break;
    defaults[level] = only;
    parentId = only.id;
  }
  return defaults;
}
