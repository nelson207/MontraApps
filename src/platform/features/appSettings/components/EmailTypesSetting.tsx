import { useGetApiCatalogEmailTypesQuery } from "@platform/api/generated/MontraPOSApi";
import type { AppSettings } from "../appSettingsModel";
import { CATALOG_CACHE, labelOf, withSaved } from "./choices";
import { LoadError, SectionHeader } from "./settingsParts";

type EmailTypes = AppSettings["emailTypes"];

// Settings → Application → E-mail: the e-mail type of personal and of work addresses
// (EmailDto.entityEmailTypeId), from GET /api/catalog/email-types. Shared by every app:
// saved in the shared settings (SHARED_APPLICATION), the only ones the backend reads them from.
function EmailTypesSetting({ value, onChange }: { value: EmailTypes; onChange: (next: EmailTypes) => void }) {
  const { currentData, isLoading, isError, error, refetch } = useGetApiCatalogEmailTypesQuery(undefined, CATALOG_CACHE);
  const listed = (currentData ?? []).flatMap((t) => (typeof t.id === "number" ? [{ id: t.id, label: labelOf(t, `E-mail type ${t.id}`) }] : []));

  const field = (key: keyof EmailTypes, label: string, help: string) => {
    const id = `app-setting-emailTypes-${key}`;
    const current = value[key];
    // A saved type the list doesn't have anymore stays visible (to change it)
    const options = withSaved(listed, current === null ? [] : [current]);
    return (
      <div className="col-12 col-md-6">
        <label htmlFor={id} className="form-label small mb-1">
          {label}
        </label>
        <select
          id={id}
          className="form-select"
          aria-describedby={`${id}-help`}
          disabled={isLoading}
          value={current ?? ""}
          onChange={(e) => onChange({ ...value, [key]: e.target.value === "" ? null : Number(e.target.value) })}
        >
          <option value="">Not set</option>
          {options.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <div id={`${id}-help`} className="form-text">
          {help}
        </div>
      </div>
    );
  };

  return (
    <section>
      <SectionHeader
        title="E-mail types"
        help="The type new e-mail addresses get. These are shared by every Montra app: a change here applies to all of them."
      />
      {isError && <LoadError error={error} text="Couldn't load the e-mail types." onRetry={() => void refetch()} />}
      <div className="row g-3">
        {field("personal", "Personal e-mail", "Addresses of the people and companies on a quotation or proposal.")}
        {field("work", "Work e-mail", "Users' own addresses.")}
      </div>
    </section>
  );
}

export default EmailTypesSetting;
