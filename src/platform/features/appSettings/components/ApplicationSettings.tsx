import { useState } from "react";
import { APP_SETTINGS } from "@app/appSettings";
import { problemMessage } from "@platform/api/problemCode";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import { useGetNewsTypesQuery } from "@platform/features/news/api/newsTypesApi";
import { useGetScreenCustomizationQuery, useSaveScreenCustomizationMutation } from "../api/appSettingsApi";
import { sameSettings, type AppSettings } from "../appSettingsModel";
import CompaniesSetting from "./CompaniesSetting";

/** newsTypes: the news types to show (GET /api/news/types); none ticked = all */
function NewsTypesSetting({ value, onChange }: { value: number[]; onChange: (next: number[]) => void }) {
  const newsTypes = useGetNewsTypesQuery();
  // Saved types the list doesn't have anymore stay visible (to untick)
  const choices = [
    ...(newsTypes.data ?? []).map((t) => ({ id: t.id, label: t.name })),
    ...value.filter((v) => !newsTypes.data?.some((t) => t.id === v)).map((v) => ({ id: v, label: `Type ${v}` })),
  ];
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <fieldset className="app-setting-option" aria-describedby="app-setting-newsTypes-help">
      <div className="d-flex flex-wrap align-items-baseline gap-2 mb-1">
        <legend className="h6 fw-semibold mb-0 float-none w-auto">News types to show</legend>
        <span className="small text-body-secondary">{value.length === 0 ? "All" : `${value.length} of ${choices.length}`}</span>
        <span className="ms-auto d-flex gap-2">
          <button type="button" className="btn btn-link btn-sm p-0" onClick={() => onChange(choices.map((c) => c.id))}>
            All
          </button>
          <button type="button" className="btn btn-link btn-sm p-0" onClick={() => onChange([])}>
            None
          </button>
        </span>
      </div>
      <p id="app-setting-newsTypes-help" className="small text-body-secondary mb-2">
        Only news of these types is shown. None selected = all.
      </p>
      {newsTypes.isLoading ? (
        <div className="small text-body-secondary">
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          Loading…
        </div>
      ) : choices.length === 0 ? (
        <div className="small text-body-secondary">Nothing to choose from yet.</div>
      ) : (
        <div className="app-setting-choices">
          {choices.map((choice) => (
            <div className="form-check" key={choice.id}>
              <input
                className="form-check-input"
                type="checkbox"
                id={`app-setting-newsTypes-${choice.id}`}
                checked={value.includes(choice.id)}
                onChange={() => toggle(choice.id)}
              />
              <label className="form-check-label" htmlFor={`app-setting-newsTypes-${choice.id}`}>
                {choice.label}
              </label>
            </div>
          ))}
        </div>
      )}
    </fieldset>
  );
}

type EmailTypes = AppSettings["emailTypes"];

/** emailTypes: the e-mail type id of personal and of work addresses (EmailDto.entityEmailTypeId) */
function EmailTypesSetting({ value, onChange }: { value: EmailTypes; onChange: (next: EmailTypes) => void }) {
  const field = (key: keyof EmailTypes, label: string) => {
    const id = `app-setting-emailTypes-${key}`;
    return (
      <div className="col-12 col-sm-6 col-lg-4">
        <label htmlFor={id} className="form-label small">
          {label}
        </label>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          className="form-control"
          placeholder="Not set"
          value={value[key] ?? ""}
          onChange={(e) => {
            const n = e.target.value === "" ? null : Number(e.target.value);
            onChange({ ...value, [key]: n !== null && Number.isInteger(n) && n >= 0 ? n : null });
          }}
        />
      </div>
    );
  };
  return (
    <fieldset className="app-setting-option" aria-describedby="app-setting-emailTypes-help">
      <legend className="h6 fw-semibold mb-1 float-none w-auto">E-mail types</legend>
      <p id="app-setting-emailTypes-help" className="small text-body-secondary mb-2">
        The e-mail type given to personal and to work addresses.
      </p>
      <div className="row g-3">
        {field("personal", "Personal e-mail type")}
        {field("work", "Work e-mail type")}
      </div>
    </fieldset>
  );
}

// Settings → Application (administrators): the app's sections of its screen customization
// (APP_SETTINGS), typed by the API (ScreenCustomizationConfigurationDto). Nothing ticked in a list
// = no restriction.
function ApplicationSettings() {
  const { identifier, sections } = APP_SETTINGS;
  const { currentData, isFetching, isError, error, refetch } = useGetScreenCustomizationQuery(identifier);
  const [save, saveState] = useSaveScreenCustomizationMutation();

  const saved = currentData?.settings;
  const [draft, setDraft] = useState<AppSettings | null>(null);
  const settings = draft ?? saved;
  const dirty = !!draft && !!saved && !sameSettings(draft, saved);

  const change = (changes: Partial<AppSettings>) => {
    if (!settings) return;
    saveState.reset();
    setDraft({ ...settings, ...changes });
  };

  const onSave = async () => {
    if (!settings) return;
    try {
      await save({ identifier, settings }).unwrap();
      setDraft(null);
    } catch {
      // shown below
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-body d-flex flex-wrap align-items-center gap-2 py-3">
        <h2 className="h6 mb-0 flex-grow-1">
          <i className="bi bi-sliders me-2 text-primary" aria-hidden="true" />
          Application
          <span className="ms-2 small fw-normal text-body-secondary font-monospace">{identifier}</span>
        </h2>
        {currentData?.isSample && (
          <span
            className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border"
            title="The settings service isn't available yet: changes are kept in this browser."
          >
            Sample data
          </span>
        )}
      </div>

      <div className="card-body d-flex flex-column gap-4">
        {sections.length === 0 ? (
          <p className="text-body-secondary mb-0">There are no application settings for this app yet.</p>
        ) : isError ? (
          <div className="alert alert-danger d-flex flex-wrap align-items-center gap-2 mb-0" role="alert">
            <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
            <span className="flex-grow-1">
              {problemMessage(error) ?? getApiErrorMessage(error) ?? "Couldn't load the application settings."}
            </span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : !settings ? (
          isFetching && (
            <div className="small text-body-secondary">
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Loading…
            </div>
          )
        ) : (
          sections.map((section) =>
            section === "companies" ? (
              <CompaniesSetting key={section} value={settings.companies} onChange={(companies) => change({ companies })} />
            ) : section === "newsTypes" ? (
              <NewsTypesSetting key={section} value={settings.newsTypes} onChange={(newsTypes) => change({ newsTypes })} />
            ) : (
              <EmailTypesSetting key={section} value={settings.emailTypes} onChange={(emailTypes) => change({ emailTypes })} />
            ),
          )
        )}
      </div>

      {sections.length > 0 && settings && (
        <div className="card-footer bg-body d-flex flex-wrap align-items-center gap-2 py-3">
          {saveState.isError && (
            <span className="text-danger small flex-grow-1" role="alert">
              {problemMessage(saveState.error) ?? getApiErrorMessage(saveState.error) ?? "Couldn't save the application settings."}
            </span>
          )}
          {saveState.isSuccess && !dirty && (
            <span className="text-success small flex-grow-1" role="status">
              <i className="bi bi-check-circle me-1" aria-hidden="true" />
              Saved.
            </span>
          )}
          <div className="ms-auto d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary" disabled={!dirty || saveState.isLoading} onClick={() => setDraft(null)}>
              Discard
            </button>
            <button type="button" className="btn btn-primary" disabled={!dirty || saveState.isLoading} onClick={onSave}>
              {saveState.isLoading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationSettings;
