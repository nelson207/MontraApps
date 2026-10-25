// The equipment lists of the API, as code items:
//   types, categories   EquipmentClassDto  { id (number), abbreviation, description }
//   brands, models,     EquipmentOptionDto { code (string), abbreviation, description }
//   versions
//   states (legacy)     { code, abbreviation, description }

type ListItem = { id?: unknown; code?: unknown; abbreviation?: unknown; description?: unknown };

/** An equipment type, category, state, brand, model or version */
export type CodeItem = { code: string; abbreviation: string | null; description: string | null };

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

/**
 * Items with a code (an id is taken as the code), kept as a string and labelled by abbreviation,
 * then description, then the code itself; null when the response isn't a list.
 */
export function toCodeList(data: unknown): CodeItem[] | null {
  if (!Array.isArray(data)) return null;
  return data.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { id, code: rawCode, abbreviation, description } = item as ListItem;
    const value = rawCode ?? id;
    const code = typeof value === "number" ? String(value) : text(value);
    if (!code) return [];
    return [{ code, abbreviation: text(abbreviation) ?? text(description) ?? code, description: text(description) }];
  });
}

/** The label of a code (ids are numbers in the operation, strings in the lists) */
export function labelOfCode(list: CodeItem[] | undefined, code: number | string | null | undefined): string | null {
  if (code == null || code === "") return null;
  return list?.find((item) => item.code === String(code))?.abbreviation ?? null;
}
