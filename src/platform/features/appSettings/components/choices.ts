import { useMemo, useState } from "react";
import {
  useGetApiCatalogCompaniesQuery,
  useGetApiCatalogEquipmentQuery,
  type EquipmentCatalogCategoryDto,
  type EquipmentCatalogTypeDto,
} from "@platform/api/generated/MontraPOSApi";

// The choices the sections of Settings → Application tick from. They come from the catalog
// (GET /api/catalog/*, administrators only): everything, not limited by the settings being edited.

/** The catalog rarely changes: loaded once while settings are open, not again for each section (nor after a 403) */
export const CATALOG_CACHE = { refetchOnMountOrArgChange: false } as const;

/** expired: in the catalog but no longer valid; unknown: saved, but the catalog doesn't have it at all */
export type Choice = { id: number; label: string; hint?: string | null; expired?: boolean; unknown?: boolean };

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

/** Labelled by abbreviation, then description */
export const labelOf = (item: { abbreviation?: string | null; description?: string | null }, fallback: string) =>
  text(item.abbreviation) ?? text(item.description) ?? fallback;

/** A saved id the catalog doesn't have (deleted): shown so it can be removed */
export const unknownChoice = (id: number): Choice => ({ id, label: `Unknown (${id})`, unknown: true });

/** Listed ones first, then saved ids the catalog doesn't have at all */
export function withSaved(listed: Choice[], saved: number[]): Choice[] {
  return [...listed, ...saved.filter((id) => !listed.some((l) => l.id === id)).map(unknownChoice)];
}

/**
 * The ids ever chosen while the section is open: an expired item stays in the list after it's
 * unticked (disabled), instead of vanishing under the pointer.
 */
export function useSeen(chosen: number[]): number[] {
  const [seen, setSeen] = useState(chosen);
  const missing = chosen.filter((id) => !seen.includes(id));
  if (missing.length) setSeen([...seen, ...missing]);
  return missing.length ? [...seen, ...missing] : seen;
}

/** Valid ones, and expired ones only when chosen (seen: chosen while the section is open) */
export function offered<T extends { id: number; label: string; isValid: boolean }>(items: T[], seen: number[]): Choice[] {
  return items
    .filter((item) => item.isValid || seen.includes(item.id))
    .map((item) => ({ id: item.id, label: item.label, expired: !item.isValid }));
}

/** What "Select all" ticks: the valid ones, plus expired ones already chosen (never new expired ones) */
export const selectable = (choices: Choice[], chosen: number[]) =>
  choices.filter((c) => !c.expired || chosen.includes(c.id)).map((c) => c.id);

/** The companies of GET /api/catalog/companies, then saved ones it doesn't have */
export function useCompanyChoices(saved: number[]) {
  const query = useGetApiCatalogCompaniesQuery(undefined, CATALOG_CACHE);
  const listed = (query.currentData ?? []).flatMap((c) =>
    typeof c.id === "number" ? [{ id: c.id, label: c.abbreviation?.trim() || `Company ${c.id}` }] : [],
  );
  return { ...query, companies: withSaved(listed, saved) };
}

export type CatalogCategory = { id: number; label: string; isValid: boolean };
/** An equipment type of the catalog, with its categories */
export type CatalogType = CatalogCategory & { categories: CatalogCategory[] };

const entry = (item: EquipmentCatalogCategoryDto | EquipmentCatalogTypeDto | null | undefined, name: string): CatalogCategory[] =>
  typeof item?.id === "number" ? [{ id: item.id, label: labelOf(item, `${name} ${item.id}`), isValid: item.isValid !== false }] : [];

/** Types with an id, each with its categories */
export const toCatalog = (types: EquipmentCatalogTypeDto[]): CatalogType[] =>
  types.flatMap((type) => entry(type, "Type").map((t) => ({ ...t, categories: (type.categories ?? []).flatMap((c) => entry(c, "Category")) })));

/** GET /api/catalog/equipment?includeInvalid=true: expired types and categories too (settings may list them) */
export function useEquipmentCatalog() {
  const query = useGetApiCatalogEquipmentQuery({ includeInvalid: true }, CATALOG_CACHE);
  const types = useMemo(() => (query.currentData ? toCatalog(query.currentData) : undefined), [query.currentData]);
  return { ...query, types };
}
