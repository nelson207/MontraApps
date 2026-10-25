import { useGetApiCompaniesByIdBusinessesQuery, useGetApiCompaniesQuery } from "@platform/api/generated/MontraPOSApi";
import { problemMessage } from "@platform/api/problemCode";
import { useGetEquipmentCategoriesQuery, useGetEquipmentTypesQuery } from "@platform/features/equipment/api/equipmentApi";
import { newCompanySetting, type CompanySetting } from "../appSettingsModel";

type Props = {
  value: CompanySetting[];
  onChange: (next: CompanySetting[]) => void;
};

const toggled = (list: number[], id: number) => (list.includes(id) ? list.filter((v) => v !== id) : [...list, id]);

/** Listed ones first, then saved ids the API doesn't list anymore (so they can be unticked) */
function withSaved(listed: { id: number; label: string }[], saved: number[], name: string) {
  return [...listed, ...saved.filter((id) => !listed.some((l) => l.id === id)).map((id) => ({ id, label: `${name} ${id}` }))];
}

function LoadError({ error, text, onRetry }: { error: unknown; text: string; onRetry: () => void }) {
  return (
    <div className="small text-danger d-flex flex-wrap gap-2" role="alert">
      {problemMessage(error) ?? text}
      <button type="button" className="btn btn-link btn-sm p-0" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <div className="small text-body-secondary">
      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
      {text}
    </div>
  );
}

const countLabel = (chosen: number, total: number) => (chosen ? `${chosen} of ${total}` : "all");

/** The businesses of one available company (GET /api/companies/{id}/businesses) */
function CompanyBusinesses({ setting, onChange }: { setting: CompanySetting; onChange: (next: CompanySetting) => void }) {
  const { currentData, isFetching, isError, error, refetch } = useGetApiCompaniesByIdBusinessesQuery({ id: setting.companyId });
  const id = `app-setting-company-${setting.companyId}`;
  const listed = (currentData ?? []).flatMap((b) =>
    typeof b.id === "number" ? [{ id: b.id, label: b.abbreviation?.trim() || b.description?.trim() || `Business ${b.id}` }] : [],
  );
  const businesses = withSaved(listed, setting.businesses, "Business");
  const isAvailable = (businessId: number) => !setting.businesses.length || setting.businesses.includes(businessId);

  const toggleAvailable = (businessId: number) => {
    const next = toggled(setting.businesses, businessId);
    // A business that is no longer available can't start in proposal either
    onChange({
      ...setting,
      businesses: next,
      proposalBusinesses: next.length ? setting.proposalBusinesses.filter((b) => next.includes(b)) : setting.proposalBusinesses,
    });
  };

  if (isError) return <LoadError error={error} text="Couldn't load this company's businesses." onRetry={() => void refetch()} />;
  if (isFetching && !currentData) return <Loading text="Loading businesses…" />;
  if (!businesses.length) return <div className="small text-body-secondary">This company has no businesses.</div>;

  return (
    <div className="table-responsive">
      <table className="table table-sm align-middle mb-0">
        <caption className="small">
          Available: {countLabel(setting.businesses.length, businesses.length)} · Can start in proposal:{" "}
          {setting.proposalBusinesses.length || "all available"}
        </caption>
        <thead>
          <tr className="small text-body-secondary">
            <th scope="col" className="fw-normal">Business</th>
            <th scope="col" className="fw-normal text-center">Available</th>
            <th scope="col" className="fw-normal text-center">Can start in proposal</th>
          </tr>
        </thead>
        <tbody>
          {businesses.map((business) => (
            <tr key={business.id}>
              <th scope="row" className="fw-normal">
                {business.label}
              </th>
              <td className="text-center">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`${id}-available-${business.id}`}
                  aria-label={`${business.label}: available`}
                  checked={setting.businesses.includes(business.id)}
                  onChange={() => toggleAvailable(business.id)}
                />
              </td>
              <td className="text-center">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`${id}-proposal-${business.id}`}
                  aria-label={`${business.label}: can start in proposal`}
                  checked={setting.proposalBusinesses.includes(business.id)}
                  disabled={!isAvailable(business.id)}
                  onChange={() => onChange({ ...setting, proposalBusinesses: toggled(setting.proposalBusinesses, business.id) })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The categories of one equipment type, in a company (GET /api/equipments/categories) */
function TypeCategories({
  setting,
  typeId,
  disabled,
  onChange,
}: {
  setting: CompanySetting;
  typeId: number;
  disabled: boolean;
  onChange: (next: CompanySetting) => void;
}) {
  const { currentData, isFetching, isError, error, refetch } = useGetEquipmentCategoriesQuery({
    companyId: setting.companyId,
    equipmentTypeId: typeId,
  });
  if (isError) return <LoadError error={error} text="Couldn't load the categories." onRetry={() => void refetch()} />;
  if (isFetching && !currentData) return <Loading text="Loading categories…" />;
  if (!currentData?.length) return <div className="small text-body-secondary">No categories.</div>;
  return (
    <div className="d-flex flex-wrap gap-3">
      {currentData.map((category) => {
        const categoryId = Number(category.code);
        const id = `app-setting-company-${setting.companyId}-category-${categoryId}`;
        return (
          <div className="form-check mb-0" key={category.code}>
            <input
              className="form-check-input"
              type="checkbox"
              id={id}
              disabled={disabled}
              checked={setting.equipmentCategories.includes(categoryId)}
              onChange={() => onChange({ ...setting, equipmentCategories: toggled(setting.equipmentCategories, categoryId) })}
            />
            <label className="form-check-label small" htmlFor={id}>
              {category.abbreviation}
            </label>
          </div>
        );
      })}
    </div>
  );
}

/** The equipment types (GET /api/equipments/types) and their categories of one available company */
function CompanyEquipment({ setting, onChange }: { setting: CompanySetting; onChange: (next: CompanySetting) => void }) {
  const { currentData, isFetching, isError, error, refetch } = useGetEquipmentTypesQuery({ companyId: setting.companyId });
  const listed = (currentData ?? []).map((t) => ({ id: Number(t.code), label: t.abbreviation ?? `Type ${t.code}` }));
  const types = withSaved(listed, setting.equipmentTypes, "Type");
  const isAvailable = (typeId: number) => !setting.equipmentTypes.length || setting.equipmentTypes.includes(typeId);

  if (isError) return <LoadError error={error} text="Couldn't load the equipment types." onRetry={() => void refetch()} />;
  if (isFetching && !currentData) return <Loading text="Loading equipment types…" />;
  if (!types.length) return <div className="small text-body-secondary">This company has no equipment types.</div>;

  return (
    <div className="d-flex flex-column gap-2">
      <div className="small text-body-secondary">
        Equipment types: {countLabel(setting.equipmentTypes.length, types.length)} · Categories:{" "}
        {setting.equipmentCategories.length || "all"}
      </div>
      {types.map((type) => {
        const id = `app-setting-company-${setting.companyId}-type-${type.id}`;
        return (
          <div key={type.id} className="d-flex flex-column gap-1">
            <div className="form-check mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id={id}
                checked={setting.equipmentTypes.includes(type.id)}
                onChange={() => onChange({ ...setting, equipmentTypes: toggled(setting.equipmentTypes, type.id) })}
              />
              <label className="form-check-label" htmlFor={id}>
                {type.label}
              </label>
            </div>
            <div className="ms-4">
              {/* Categories of a type that isn't available can't be chosen */}
              <TypeCategories setting={setting} typeId={type.id} disabled={!isAvailable(type.id)} onChange={onChange} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Settings → Application: the companies users can work with and, inside each one, its businesses
// (available / can start in proposal) and its equipment types and categories. Nothing ticked =
// no restriction.
function CompaniesSetting({ value, onChange }: Props) {
  const { currentData, isFetching, isError, error, refetch } = useGetApiCompaniesQuery();
  const listed = (currentData ?? []).flatMap((c) =>
    typeof c.id === "number" ? [{ id: c.id, label: c.abbreviation?.trim() || `Company ${c.id}` }] : [],
  );
  const companies = withSaved(
    listed,
    value.map((s) => s.companyId),
    "Company",
  );
  const settingOf = (companyId: number) => value.find((s) => s.companyId === companyId);
  const toggleCompany = (companyId: number) =>
    onChange(settingOf(companyId) ? value.filter((s) => s.companyId !== companyId) : [...value, newCompanySetting(companyId)]);
  const update = (next: CompanySetting) => onChange(value.map((s) => (s.companyId === next.companyId ? next : s)));

  return (
    <fieldset className="app-setting-option" aria-describedby="app-setting-companies-help">
      <div className="d-flex flex-wrap align-items-baseline gap-2 mb-1">
        <legend className="h6 fw-semibold mb-0 float-none w-auto">Companies</legend>
        <span className="small text-body-secondary">{value.length === 0 ? "All" : `${value.length} of ${companies.length}`}</span>
        <span className="ms-auto d-flex gap-2">
          <button
            type="button"
            className="btn btn-link btn-sm p-0"
            onClick={() => onChange(companies.map((c) => settingOf(c.id) ?? newCompanySetting(c.id)))}
          >
            All
          </button>
          <button type="button" className="btn btn-link btn-sm p-0" onClick={() => onChange([])}>
            None
          </button>
        </span>
      </div>
      <p id="app-setting-companies-help" className="small text-body-secondary mb-2">
        The companies users can work with and, inside each one, its businesses (and those a new proposal can be started
        with, without a quotation first) and its equipment types and categories. Nothing ticked = no restriction.
      </p>
      {isError ? (
        <LoadError error={error} text="Couldn't load the companies." onRetry={() => void refetch()} />
      ) : isFetching && !currentData ? (
        <Loading text="Loading…" />
      ) : companies.length === 0 ? (
        <div className="small text-body-secondary">There are no companies.</div>
      ) : (
        <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
          {companies.map((company) => {
            const setting = settingOf(company.id);
            return (
              <li key={company.id} className={setting ? "border rounded-3 p-2" : "px-2"}>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`app-setting-company-${company.id}`}
                    checked={!!setting}
                    onChange={() => toggleCompany(company.id)}
                  />
                  <label className="form-check-label fw-semibold" htmlFor={`app-setting-company-${company.id}`}>
                    {company.label}
                  </label>
                </div>
                {setting && (
                  <div className="ms-4 mt-2 d-flex flex-column gap-3">
                    <section aria-label={`${company.label}: businesses`}>
                      <h4 className="small fw-semibold text-body-secondary mb-1">Businesses</h4>
                      <CompanyBusinesses setting={setting} onChange={update} />
                    </section>
                    <section aria-label={`${company.label}: equipment`}>
                      <h4 className="small fw-semibold text-body-secondary mb-1">Equipment</h4>
                      <CompanyEquipment setting={setting} onChange={update} />
                    </section>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}

export default CompaniesSetting;
