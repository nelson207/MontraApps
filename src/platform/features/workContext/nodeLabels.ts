import type { HierarchyLevel, HierarchyNode } from "./hierarchy";

// Names of hierarchy nodes seen so far (loaded pages, chosen values).
// Records often only store ids (e.g. Credit's CredOperDto.*StructNode), and with lazy lists the
// selected node may not be on a loaded page, so this provides the label to show.
// TODO: ideally the records return the names alongside the ids.
const labels = new Map<string, string>();

const key = (level: HierarchyLevel, id: string) => `${level}:${id}`;

export function rememberNodes(level: HierarchyLevel, nodes: (HierarchyNode | null)[]) {
  nodes.forEach((node) => node && labels.set(key(level, node.id), node.name));
}

/** Label of a node whose name was never loaded (its id is an opaque token, not for display) */
export const UNNAMED = "(name not loaded)";

/** The node for an id, with UNNAMED as the label when its name was never loaded. */
export function nodeFromId(level: HierarchyLevel, id: string | null | undefined): HierarchyNode | null {
  if (!id) return null;
  return { id, name: labels.get(key(level, id)) ?? UNNAMED };
}
