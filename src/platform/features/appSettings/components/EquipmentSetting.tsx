import { useState } from "react";
import { setEquipmentCategory, setEquipmentType, type CompanySetting } from "../appSettingsModel";
import { offered, unknownChoice, useCompanyChoices, useEquipmentCatalog, useSeen, type CatalogType } from "./choices";
import { ChoiceLabel, LoadError, Loading, SectionHeader } from "./settingsParts";

/** A type of the catalog, or a saved one it doesn't have anymore (unknown) */
type TypeEntry = CatalogType & { unknown?: boolean };

type Props = {
  value: CompanySetting[];
  onChange: (next: CompanySetting[]) => void;
};

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** One equipment type: its checkbox, how many of its categories are ticked, and (opened) the categories */
function TypeRow({
  type,
  setting,
  seenCategories,
  isOpen,
  onToggleOpen,
  onChange,
}: {
  type: TypeEntry;
  setting: CompanySetting;
  seenCategories: number[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onChange: (next: CompanySetting) => void;
}) {
  const checked = setting.equipmentTypes.includes(type.id);
  const categories = offered(type.categories, seenCategories);
  const ticked = type.categories.filter((c) => setting.equipmentCategories.includes(c.id)).length;
  const id = `app-setting-equipment-${setting.companyId}-${type.id}`;
  const toggleType = (on: boolean) =>
    onChange(
      setEquipmentType(setting, type.id, on, {
        categoryIds: type.categories.filter((c) => c.isValid).map((c) => c.id),
        allCategoryIds: type.categories.map((c) => c.id),
      }),
    );

  return (
    <li className="list-group-item py-2">
      <div className="d-flex align-items-center gap-2">
        <div className="form-check mb-0 flex-grow-1 text-truncate">
          <input
            className="form-check-input"
            type="checkbox"
            id={id}
            checked={checked}
            // An expired or unknown type can only be unticked
            disabled={!checked && (!type.isValid || type.unknown)}
            onChange={(e) => toggleType(e.target.checked)}
          />
          <label className="form-check-label" htmlFor={id}>
            <ChoiceLabel choice={{ id: type.id, label: type.label, expired: !type.isValid, unknown: type.unknown }} />
          </label>
        </div>
        {categories.length > 0 && (
          <button
            type="button"
            className={`btn btn-sm text-nowrap ${checked && ticked === 0 ? "btn-outline-warning" : "btn-link text-body-secondary text-decoration-none"}`}
            aria-expanded={isOpen}
            aria-controls={`${id}-categories`}
            onClick={onToggleOpen}
            title={checked && ticked === 0 ? "No category ticked: this type offers nothing" : undefined}
          >
            {`${checked ? `${ticked} of ` : ""}${type.categories.length} ${type.categories.length === 1 ? "category" : "categories"}`}
            <i className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"} ms-1`} aria-hidden="true" />
          </button>
        )}
      </div>
      {isOpen && (
        <div className="app-setting-choices mt-2 ms-4" id={`${id}-categories`}>
          {categories.map((category) => {
            const categoryId = `${id}-category-${category.id}`;
            const ticked = setting.equipmentCategories.includes(category.id);
            return (
              <div className="form-check mb-0" key={category.id}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={categoryId}
                  checked={ticked}
                  disabled={!ticked && category.expired}
                  onChange={(e) => onChange(setEquipmentCategory(setting, type.id, category.id, e.target.checked))}
                />
                <label className="form-check-label small" htmlFor={categoryId}>
                  <ChoiceLabel choice={category} />
                </label>
              </div>
            );
          })}
        </div>
      )}
    </li>
  );
}

// Settings → Application → Equipment: the equipment types (and their categories) each company
// offers, chosen from the whole catalog (GET /api/catalog/equipment?includeInvalid=true), each
// category under its type. One company at a time, with a search: the catalog has about a hundred
// types and several hundred categories.
function EquipmentSetting({ value, onChange }: Props) {
  const { companies } = useCompanyChoices(value.map((s) => s.companyId));
  const catalog = useEquipmentCatalog();
  const seenTypes = useSeen(value.flatMap((s) => s.equipmentTypes));
  const seenCategories = useSeen(value.flatMap((s) => s.equipmentCategories));
  const offeredCompanies = companies.filter((c) => value.some((s) => s.companyId === c.id));
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [openTypes, setOpenTypes] = useState<number[]>([]);

  const current = offeredCompanies.find((c) => c.id === companyId) ?? offeredCompanies[0];
  const setting = current && value.find((s) => s.companyId === current.id);
  const update = (next: CompanySetting) => onChange(value.map((s) => (s.companyId === next.companyId ? next : s)));

  const header = (
    <SectionHeader
      title="Equipment"
      help="For each company, tick the equipment types it finances. A type offers only the categories ticked under it; ticking a type ticks all its categories."
      warning={setting && setting.equipmentTypes.length === 0 ? `${current.label} offers no equipment.` : null}
    />
  );
  if (!offeredCompanies.length || !setting) {
    return (
      <section>
        {header}
        <div className="small text-body-secondary">Turn on a company under Companies and businesses first.</div>
      </section>
    );
  }

  const types = catalog.types ?? [];
  // This company's saved types and categories the catalog doesn't have at all stay visible (to remove them)
  const unknown: TypeEntry[] = setting.equipmentTypes
    .filter((id) => !types.some((t) => t.id === id))
    .map((id) => ({ ...unknownChoice(id), isValid: true, categories: [] }));
  const unknownCategories = setting.equipmentCategories.filter((id) => !types.some((t) => t.categories.some((c) => c.id === id)));
  const query = normalize(search.trim());
  const visible = [...types.filter((t) => t.isValid || seenTypes.includes(t.id)), ...unknown].filter((t) => {
    if (selectedOnly && !setting.equipmentTypes.includes(t.id)) return false;
    if (!query) return true;
    return normalize(t.label).includes(query) || t.categories.some((c) => normalize(c.label).includes(query));
  });
  // A type found by one of its categories opens by itself; a click flips what it would be
  const isOpen = (typeId: number) => {
    const foundByCategory = !!query && !normalize(types.find((t) => t.id === typeId)?.label ?? "").includes(query);
    return openTypes.includes(typeId) !== foundByCategory;
  };
  const copyFrom = (fromId: number) => {
    const from = value.find((s) => s.companyId === fromId);
    if (from) update({ ...setting, equipmentTypes: [...from.equipmentTypes], equipmentCategories: [...from.equipmentCategories] });
  };

  return (
    <section>
      {header}
      <div className="row g-2 align-items-end mb-3">
        <div className="col-12 col-md-4">
          <label htmlFor="app-setting-equipment-company" className="form-label small mb-1">
            Company
          </label>
          <select
            id="app-setting-equipment-company"
            className="form-select"
            value={current.id}
            onChange={(e) => {
              setCompanyId(Number(e.target.value));
              setOpenTypes([]);
            }}
          >
            {offeredCompanies.map((c) => {
              const count = value.find((s) => s.companyId === c.id)?.equipmentTypes.length ?? 0;
              return (
                <option key={c.id} value={c.id}>
                  {c.label} ({count} type{count === 1 ? "" : "s"})
                </option>
              );
            })}
          </select>
        </div>
        <div className="col-12 col-md-5">
          <label htmlFor="app-setting-equipment-search" className="form-label small mb-1">
            Find a type or category
          </label>
          <input
            id="app-setting-equipment-search"
            type="search"
            className="form-control"
            placeholder="e.g. ligeiros, barcos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {offeredCompanies.length > 1 && (
          <div className="col-12 col-md-3">
            <label htmlFor="app-setting-equipment-copy" className="form-label small mb-1">
              Copy from
            </label>
            <select
              id="app-setting-equipment-copy"
              className="form-select"
              value=""
              onChange={(e) => e.target.value && copyFrom(Number(e.target.value))}
            >
              <option value="">Another company…</option>
              {offeredCompanies
                .filter((c) => c.id !== current.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      <div className="d-flex flex-wrap align-items-center gap-3 mb-2 small">
        <span className="text-body-secondary">
          {setting.equipmentTypes.length} type{setting.equipmentTypes.length === 1 ? "" : "s"} ·{" "}
          {setting.equipmentCategories.length} categor{setting.equipmentCategories.length === 1 ? "y" : "ies"} ticked
        </span>
        <div className="form-check form-switch mb-0">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="app-setting-equipment-selected"
            checked={selectedOnly}
            onChange={(e) => setSelectedOnly(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="app-setting-equipment-selected">
            Ticked only
          </label>
        </div>
        {setting.equipmentTypes.length > 0 && (
          <button
            type="button"
            className="btn btn-link btn-sm p-0 ms-auto"
            onClick={() => update({ ...setting, equipmentTypes: [], equipmentCategories: [] })}
          >
            Clear all
          </button>
        )}
      </div>

      {catalog.isError ? (
        <LoadError error={catalog.error} text="Couldn't load the equipment types." onRetry={() => void catalog.refetch()} />
      ) : catalog.isFetching && !catalog.types ? (
        <Loading text="Loading equipment types…" />
      ) : visible.length === 0 ? (
        <div className="small text-body-secondary">{query || selectedOnly ? "Nothing matches." : "There are no equipment types."}</div>
      ) : (
        <ul className="list-group app-setting-scroll">
          {visible.map((type) => (
            <TypeRow
              key={type.id}
              type={type}
              setting={setting}
              seenCategories={seenCategories}
              isOpen={isOpen(type.id)}
              onToggleOpen={() =>
                setOpenTypes((ids) => (ids.includes(type.id) ? ids.filter((id) => id !== type.id) : [...ids, type.id]))
              }
              onChange={update}
            />
          ))}
        </ul>
      )}
      {catalog.types && unknownCategories.length > 0 && (
        <div className="mt-3">
          <div className="small text-body-secondary mb-1">Categories the catalog doesn't have anymore:</div>
          <div className="app-setting-choices">
            {unknownCategories.map((categoryId) => {
              const id = `app-setting-equipment-${setting.companyId}-unknown-${categoryId}`;
              return (
                <div className="form-check mb-0" key={categoryId}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={id}
                    checked
                    onChange={() =>
                      update({ ...setting, equipmentCategories: setting.equipmentCategories.filter((c) => c !== categoryId) })
                    }
                  />
                  <label className="form-check-label small" htmlFor={id}>
                    <ChoiceLabel choice={unknownChoice(categoryId)} />
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default EquipmentSetting;
