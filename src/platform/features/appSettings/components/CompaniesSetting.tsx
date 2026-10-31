import { Fragment, useState } from "react";
import {
  useGetApiCatalogAssetTypesQuery,
  useGetApiCatalogClassificationsQuery,
  useGetApiCatalogCompaniesByIdBusinessesQuery,
} from "@platform/api/generated/MontraPOSApi";
import {
  assetTypesOf,
  classificationsOf,
  newCompanySetting,
  setAssetType,
  setBusiness,
  setClassification,
  setClassifications,
  setProposalBusiness,
  type AssetTypeId,
  type CompanySetting,
} from "../appSettingsModel";
import { CATALOG_CACHE, labelOf, offered, selectable, useCompanyChoices, useSeen, withSaved, type Choice } from "./choices";
import { AllOrNone, ChoiceLabel, LoadError, Loading, SectionHeader } from "./settingsParts";

type Props = {
  value: CompanySetting[];
  onChange: (next: CompanySetting[]) => void;
};

const businessSummary = (setting: CompanySetting) =>
  setting.businesses.length
    ? `${setting.businesses.length} business${setting.businesses.length === 1 ? "" : "es"} · ${setting.proposalBusinesses.length} start in proposal`
    : "No businesses";

type AssetTypeChoice = { id: AssetTypeId; label: string };

/**
 * The asset types of the catalog (GET /api/catalog/asset-types), "No asset" (null) first even
 * when the catalog doesn't list it, then saved ones it doesn't have
 */
function assetTypeChoices(catalog: { id?: number | null; abbreviation?: string | null }[], saved: AssetTypeId[]): AssetTypeChoice[] {
  // No asset is a null id (also when the answer leaves it out)
  const listed = catalog.flatMap((a) => {
    const id = a.id ?? null;
    return id === null || typeof id === "number"
      ? [{ id, label: a.abbreviation?.trim() || (id === null ? "No asset" : `Asset type ${id}`) }]
      : [];
  });
  const all = listed.some((a) => a.id === null) ? listed : [{ id: null, label: "No asset" }, ...listed];
  const unknown = saved.filter((s) => !all.some((a) => a.id === s)).map((s) => ({ id: s, label: `Unknown (${s})` }));
  return [...all, ...unknown].sort((x, y) => (x.id ?? -Infinity) - (y.id ?? -Infinity));
}

/** The asset types one business offers (none ticked: an operation of it can't be started) */
function BusinessAssetTypeChoices({
  setting,
  businessId,
  label,
  choices,
  onChange,
}: {
  setting: CompanySetting;
  businessId: number;
  label: string;
  choices: AssetTypeChoice[];
  onChange: (next: CompanySetting) => void;
}) {
  const chosen = assetTypesOf(setting, businessId);
  const id = `app-setting-company-${setting.companyId}-business-${businessId}-asset-type`;
  return (
    <div className="d-flex flex-wrap justify-content-center gap-2" title={chosen.length ? undefined : "No asset type ticked: this business can't be started"}>
      {choices.map((choice) => (
        <div className="form-check form-check-inline mb-0 me-0" key={choice.id ?? "none"}>
          <input
            className={`form-check-input ${chosen.length ? "" : "border-warning"}`}
            type="checkbox"
            id={`${id}-${choice.id ?? "none"}`}
            aria-label={`${label}: ${choice.label}`}
            checked={chosen.includes(choice.id)}
            onChange={(e) => onChange(setAssetType(setting, businessId, choice.id, e.target.checked))}
          />
          <label className="form-check-label small text-nowrap" htmlFor={`${id}-${choice.id ?? "none"}`}>
            {choice.label}
          </label>
        </div>
      ))}
    </div>
  );
}

/**
 * The contract classifications of one business, from the whole catalog
 * (GET /api/catalog/classifications?includeInvalid=true): only the ticked ones are offered.
 */
function BusinessClassificationChoices({
  setting,
  businessId,
  label,
  catalog,
  seen,
  onChange,
}: {
  setting: CompanySetting;
  businessId: number;
  label: string;
  catalog: { id: number; label: string; isValid: boolean }[];
  seen: number[];
  onChange: (next: CompanySetting) => void;
}) {
  const chosen = classificationsOf(setting, businessId);
  const choices = withSaved(offered(catalog, seen), chosen);
  const id = `app-setting-company-${setting.companyId}-business-${businessId}-classification`;

  if (!choices.length) return <div className="small text-body-secondary">There are no contract classifications.</div>;
  return (
    <>
      <div className="d-flex flex-wrap align-items-center gap-3 mb-1 small">
        <span className="text-body-secondary">Contract classifications offered for {label}</span>
        <AllOrNone
          label={`${label} contract classifications`}
          onAll={() => onChange(setClassifications(setting, businessId, selectable(choices, chosen)))}
          onNone={() => onChange(setClassifications(setting, businessId, []))}
        />
      </div>
      <div className="app-setting-choices">
        {choices.map((choice) => {
          const checked = chosen.includes(choice.id);
          return (
            <div className="form-check mb-0" key={choice.id}>
              <input
                className="form-check-input"
                type="checkbox"
                id={`${id}-${choice.id}`}
                checked={checked}
                // An expired or unknown classification can only be unticked
                disabled={!checked && (choice.expired || choice.unknown)}
                onChange={(e) => onChange(setClassification(setting, businessId, choice.id, e.target.checked))}
              />
              <label className="form-check-label small" htmlFor={`${id}-${choice.id}`}>
                <ChoiceLabel choice={choice} />
              </label>
            </div>
          );
        })}
      </div>
    </>
  );
}

/**
 * Every business of one company (GET /api/catalog/companies/{id}/businesses): available, which
 * start in proposal, and the contract classifications each offers
 */
function CompanyBusinesses({ setting, onChange }: { setting: CompanySetting; onChange: (next: CompanySetting) => void }) {
  const { currentData, isFetching, isError, error, refetch } = useGetApiCatalogCompaniesByIdBusinessesQuery(
    { id: setting.companyId },
    CATALOG_CACHE,
  );
  const classifications = useGetApiCatalogClassificationsQuery({ includeInvalid: true }, CATALOG_CACHE);
  const assetTypes = useGetApiCatalogAssetTypesQuery(undefined, CATALOG_CACHE);
  const seen = useSeen([...setting.businesses, ...setting.proposalBusinesses]);
  const seenClassifications = useSeen(setting.businessSettings.flatMap((b) => b.classifications));
  const assetTypeOptions = assetTypeChoices(assetTypes.currentData ?? [], setting.businessSettings.flatMap((b) => b.assetTypes));
  const [openBusiness, setOpenBusiness] = useState<number | null>(null);
  const classificationCatalog = (classifications.currentData ?? []).flatMap((c) =>
    typeof c.id === "number"
      ? [
          {
            id: c.id,
            label: labelOf(c, `Classification ${c.id}`),
            isValid: c.isValid !== false,
          },
        ]
      : [],
  );
  // A business made available offers every valid classification until some are unticked, and no
  // asset type until some are ticked (what it finances is the administrator's to say)
  const newBusiness = {
    classificationIds: classificationCatalog.filter((c) => c.isValid).map((c) => c.id),
  };
  const listed: Choice[] = (currentData ?? []).flatMap((b) => {
    if (typeof b.id !== "number") return [];
    const label = labelOf(b, `Business ${b.id}`);
    const description = b.description?.trim();
    return [
      {
        id: b.id,
        label,
        hint: description && description !== label ? description : null,
      },
    ];
  });
  const businesses = withSaved(listed, seen);
  const id = `app-setting-company-${setting.companyId}`;

  if (isError) return <LoadError error={error} text="Couldn't load this company's businesses." onRetry={() => void refetch()} />;
  if (classifications.isError) {
    return (
      <LoadError
        error={classifications.error}
        text="Couldn't load the contract classifications."
        onRetry={() => void classifications.refetch()}
      />
    );
  }
  if (assetTypes.isError) {
    return <LoadError error={assetTypes.error} text="Couldn't load the asset types." onRetry={() => void assetTypes.refetch()} />;
  }
  if (
    (isFetching && !currentData) ||
    (classifications.isFetching && !classifications.currentData) ||
    (assetTypes.isFetching && !assetTypes.currentData)
  ) {
    return <Loading text="Loading businesses…" />;
  }
  if (!businesses.length) return <div className="small text-body-secondary">This company has no businesses.</div>;

  return (
    <div className="table-responsive">
      <table className="table table-sm table-hover align-middle mb-0">
        <thead>
          <tr className="small text-body-secondary">
            <th scope="col" className="fw-normal">
              Business
            </th>
            <th scope="col" className="fw-normal text-center">
              Available
              <div>
                <AllOrNone
                  label="businesses"
                  onAll={() =>
                    onChange(
                      selectable(businesses, setting.businesses).reduce(
                        (next, businessId) => setBusiness(next, businessId, true, newBusiness),
                        setting,
                      ),
                    )
                  }
                  onNone={() =>
                    onChange({
                      ...setting,
                      businesses: [],
                      proposalBusinesses: [],
                      businessSettings: [],
                    })
                  }
                />
              </div>
            </th>
            <th scope="col" className="fw-normal text-center" title="Can be started as a proposal, without a quotation first">
              Starts in proposal
            </th>
            <th scope="col" className="fw-normal text-center">
              Contract classifications
            </th>
            <th scope="col" className="fw-normal text-center" title="What an operation of the business finances">
              Asset types
            </th>
          </tr>
        </thead>
        <tbody>
          {businesses.map((business) => {
            const available = setting.businesses.includes(business.id);
            const ticked = classificationsOf(setting, business.id).length;
            const isOpen = available && openBusiness === business.id;
            const panelId = `${id}-classifications-${business.id}`;
            return (
              <Fragment key={business.id}>
                <tr>
                  <th scope="row" className="fw-normal">
                    <ChoiceLabel choice={business} />
                    {business.hint && <div className="small text-body-secondary">{business.hint}</div>}
                  </th>
                  <td className="text-center">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`${id}-available-${business.id}`}
                      aria-label={`${business.label}: available`}
                      checked={setting.businesses.includes(business.id)}
                      disabled={business.unknown && !setting.businesses.includes(business.id)}
                      onChange={(e) => onChange(setBusiness(setting, business.id, e.target.checked, newBusiness))}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`${id}-proposal-${business.id}`}
                      aria-label={`${business.label}: starts in proposal`}
                      checked={setting.proposalBusinesses.includes(business.id)}
                      disabled={business.unknown && !setting.proposalBusinesses.includes(business.id)}
                      onChange={(e) => onChange(setProposalBusiness(setting, business.id, e.target.checked, newBusiness))}
                    />
                  </td>
                  <td className="text-center">
                    {available && (
                      <button
                        type="button"
                        className={`btn btn-sm text-nowrap ${ticked === 0 ? "btn-outline-warning" : "btn-link text-body-secondary text-decoration-none"}`}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        aria-label={`${business.label}: contract classifications`}
                        title={ticked === 0 ? "No classification ticked: this business offers none" : undefined}
                        onClick={() => setOpenBusiness(isOpen ? null : business.id)}
                      >
                        {ticked} of {classificationCatalog.filter((c) => c.isValid).length}
                        <i className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"} ms-1`} aria-hidden="true" />
                      </button>
                    )}
                  </td>
                  <td className="text-center">
                    {available && (
                      <BusinessAssetTypeChoices
                        setting={setting}
                        businessId={business.id}
                        label={business.label}
                        choices={assetTypeOptions}
                        onChange={onChange}
                      />
                    )}
                  </td>
                </tr>
                {isOpen && (
                  <tr id={panelId}>
                    <td colSpan={5} className="bg-body-tertiary ps-4">
                      <BusinessClassificationChoices
                        setting={setting}
                        businessId={business.id}
                        label={business.label}
                        catalog={classificationCatalog}
                        seen={seenClassifications}
                        onChange={onChange}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Settings → Application → Companies: which companies the app offers (a switch each) and, for the
// one opened, its businesses. One company open at a time keeps the page short.
function CompaniesSetting({ value, onChange }: Props) {
  const { companies, currentData, isFetching, isError, error, refetch } = useCompanyChoices(value.map((s) => s.companyId));
  const [open, setOpen] = useState<number | null>(null);
  const settingOf = (companyId: number) => value.find((s) => s.companyId === companyId);
  const update = (next: CompanySetting) => onChange(value.map((s) => (s.companyId === next.companyId ? next : s)));
  const setOffered = (companyId: number, on: boolean) => {
    onChange(on ? [...value, newCompanySetting(companyId)] : value.filter((s) => s.companyId !== companyId));
    setOpen(on ? companyId : open === companyId ? null : open);
  };

  return (
    <section aria-labelledby="app-setting-companies">
      <SectionHeader
        title="Companies and businesses"
        help="Turn on the companies users can work with, then open one to choose its businesses. Only what is turned on is offered."
        warning={value.length === 0 ? "No company is turned on: nothing will be offered in this app." : null}
      />
      {isError ? (
        <LoadError error={error} text="Couldn't load the companies." onRetry={() => void refetch()} />
      ) : isFetching && !currentData ? (
        <Loading />
      ) : companies.length === 0 ? (
        <div className="small text-body-secondary">There are no companies.</div>
      ) : (
        <ul className="list-group" id="app-setting-companies">
          {companies.map((company) => {
            const setting = settingOf(company.id);
            const isOpen = !!setting && open === company.id;
            const switchId = `app-setting-company-${company.id}`;
            return (
              <li key={company.id} className={`list-group-item ${isOpen ? "bg-body-tertiary" : ""}`}>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <div className="form-check form-switch mb-0 flex-grow-1">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id={switchId}
                      checked={!!setting}
                      // A company the catalog doesn't have can only be turned off
                      disabled={company.unknown && !setting}
                      onChange={(e) => setOffered(company.id, e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold" htmlFor={switchId}>
                      <ChoiceLabel choice={company} />
                    </label>
                  </div>
                  {setting && (
                    <>
                      <span className={`small ${setting.businesses.length ? "text-body-secondary" : "text-warning-emphasis"}`}>
                        {businessSummary(setting)}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        aria-expanded={isOpen}
                        aria-controls={`${switchId}-businesses`}
                        onClick={() => setOpen(isOpen ? null : company.id)}
                      >
                        {isOpen ? "Close" : "Businesses"}
                        <i className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"} ms-1`} aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
                {isOpen && (
                  <div className="mt-2" id={`${switchId}-businesses`}>
                    <CompanyBusinesses setting={setting} onChange={update} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default CompaniesSetting;
