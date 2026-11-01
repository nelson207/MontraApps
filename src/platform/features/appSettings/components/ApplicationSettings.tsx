import { useState, type ReactNode } from "react";
import { APP_SETTINGS } from "@app/appSettings";
import { problemMessage } from "@platform/api/problemCode";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import { useGetScreenCustomizationQuery, useSaveScreenCustomizationMutation } from "../api/appSettingsApi";
import { sameSettings, SHARED_APPLICATION, type AppSettings } from "../appSettingsModel";
import CompaniesSetting from "./CompaniesSetting";
import EmailTypesSetting from "./EmailTypesSetting";
import EquipmentSetting from "./EquipmentSetting";
import NewsTypesSetting from "./NewsTypesSetting";
import { LoadError, Loading } from "./settingsParts";

type EmailTypes = AppSettings["emailTypes"];
type SectionId = "companies" | "equipment" | "newsTypes" | "emailTypes";

const sameEmailTypes = (a: EmailTypes, b: EmailTypes) => a.personal === b.personal && a.work === b.work;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Settings → Application (administrators): the app's screen customization (APP_SETTINGS), one
// section at a time from a menu with each section's summary, and a save bar while anything is
// changed. Only what is ticked is offered. The e-mail types are shared by every app, so they're
// read and saved in the shared settings (SHARED_APPLICATION), where the backend reads them.
function ApplicationSettings() {
  const { identifier, sections } = APP_SETTINGS;
  const app = useGetScreenCustomizationQuery(identifier);
  const sharesEmail = sections.includes("emailTypes") && identifier !== SHARED_APPLICATION;
  const shared = useGetScreenCustomizationQuery(SHARED_APPLICATION, { skip: !sharesEmail });
  const [save, saveState] = useSaveScreenCustomizationMutation();

  const [draft, setDraft] = useState<AppSettings | null>(null);
  const [emailDraft, setEmailDraft] = useState<EmailTypes | null>(null);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [justSaved, setJustSaved] = useState(false);

  const saved = app.currentData?.settings;
  const settings = draft ?? saved;
  const savedEmail = sharesEmail ? shared.currentData?.settings.emailTypes : saved?.emailTypes;
  const emailTypes = emailDraft ?? savedEmail;

  const appDirty = !!draft && !!saved && !sameSettings(draft, saved);
  const emailDirty = !!emailDraft && !!savedEmail && !sameEmailTypes(emailDraft, savedEmail);
  const dirty = appDirty || emailDirty;

  const menu: { id: SectionId; icon: string; label: string; summary: string; tag?: string }[] = settings
    ? [
        ...(sections.includes("companies")
          ? [
              { id: "companies" as const, icon: "bi-building", label: "Companies", summary: plural(settings.companies.length, "company", "companies") },
              {
                id: "equipment" as const,
                icon: "bi-truck",
                label: "Equipment",
                summary: plural(new Set(settings.companies.flatMap((c) => c.equipmentTypes)).size, "type", "types"),
              },
            ]
          : []),
        ...(sections.includes("newsTypes")
          ? [{ id: "newsTypes" as const, icon: "bi-newspaper", label: "News", summary: plural(settings.newsTypes.length, "type", "types") }]
          : []),
        ...(sections.includes("emailTypes")
          ? [
              {
                id: "emailTypes" as const,
                icon: "bi-envelope",
                label: "E-mail",
                summary: emailTypes && (emailTypes.personal !== null || emailTypes.work !== null) ? "Set" : "Not set",
                tag: sharesEmail ? "All apps" : undefined,
              },
            ]
          : []),
      ]
    : [];
  const [active, setActive] = useState<SectionId | null>(null);
  const current = menu.find((m) => m.id === active) ?? menu[0];

  const change = (changes: Partial<AppSettings>) => {
    if (!settings) return;
    setJustSaved(false);
    setDraft({ ...settings, ...changes });
  };
  const changeEmail = (next: EmailTypes) => {
    setJustSaved(false);
    if (sharesEmail) setEmailDraft(next);
    else change({ emailTypes: next });
  };
  const discard = () => {
    setDraft(null);
    setEmailDraft(null);
    setSaveError(null);
  };
  const onSave = async () => {
    setSaveError(null);
    try {
      if (appDirty && draft) await save({ identifier, settings: draft }).unwrap();
      setDraft(null);
      if (emailDirty && emailDraft && shared.currentData) {
        await save({ identifier: SHARED_APPLICATION, settings: { ...shared.currentData.settings, emailTypes: emailDraft } }).unwrap();
      }
      setEmailDraft(null);
      setJustSaved(true);
    } catch (error) {
      setSaveError(error);
    }
  };

  const loadError = app.isError ? app.error : shared.isError ? shared.error : null;
  const retry = () => void (app.isError ? app.refetch() : shared.refetch());

  let body: ReactNode;
  if (sections.length === 0) body = <p className="text-body-secondary mb-0">There are no application settings for this app yet.</p>;
  else if (loadError) body = <LoadError error={loadError} text="Couldn't load the application settings." onRetry={retry} />;
  else if (!settings || !emailTypes || !current) body = <Loading />;
  else
    body = (
      <div className="row g-4">
        <nav className="col-12 col-lg-3" aria-label="Application settings sections">
          <div className="nav nav-pills flex-lg-column flex-nowrap overflow-x-auto gap-1" role="tablist">
            {menu.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.id === current.id}
                className={`nav-link text-start d-flex align-items-center gap-2 flex-shrink-0 ${item.id === current.id ? "active" : ""}`}
                onClick={() => setActive(item.id)}
              >
                <i className={`bi ${item.icon}`} aria-hidden="true" />
                <span className="d-flex flex-column lh-sm">
                  <span>
                    {item.label}
                    {item.tag && <span className="badge rounded-pill bg-body-secondary text-body-secondary ms-2 fw-normal">{item.tag}</span>}
                  </span>
                  <small className={item.id === current.id ? "opacity-75" : "text-body-secondary"}>{item.summary}</small>
                </span>
              </button>
            ))}
          </div>
        </nav>
        <div className="col-12 col-lg-9" role="tabpanel">
          {current.id === "companies" && <CompaniesSetting value={settings.companies} onChange={(companies) => change({ companies })} />}
          {current.id === "equipment" && <EquipmentSetting value={settings.companies} onChange={(companies) => change({ companies })} />}
          {current.id === "newsTypes" && <NewsTypesSetting value={settings.newsTypes} onChange={(newsTypes) => change({ newsTypes })} />}
          {current.id === "emailTypes" && <EmailTypesSetting value={emailTypes} onChange={changeEmail} />}
        </div>
      </div>
    );

  const isSample = app.currentData?.isSample || shared.currentData?.isSample;

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-body d-flex flex-wrap align-items-center gap-2 py-3">
        <h2 className="h6 mb-0 flex-grow-1">
          <i className="bi bi-sliders me-2 text-primary" aria-hidden="true" />
          Application settings
          <span className="ms-2 small fw-normal text-body-secondary font-monospace">{identifier}</span>
        </h2>
        {isSample && (
          <span
            className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border"
            title="The settings service isn't available yet: changes are kept in this browser."
          >
            Sample data
          </span>
        )}
      </div>

      <div className="card-body">{body}</div>

      {(dirty || justSaved || !!saveError) && (
        <div className="card-footer bg-body d-flex flex-wrap align-items-center gap-2 py-3 app-setting-savebar">
          {saveError ? (
            <span className="text-danger small flex-grow-1" role="alert">
              {problemMessage(saveError) ?? getApiErrorMessage(saveError) ?? "Couldn't save the application settings."}
            </span>
          ) : dirty ? (
            <span className="small flex-grow-1">
              <i className="bi bi-pencil me-1 text-warning" aria-hidden="true" />
              Unsaved changes
              {emailDirty && sharesEmail && <span className="text-body-secondary"> · the e-mail types apply to every app</span>}
            </span>
          ) : (
            <span className="text-success small flex-grow-1" role="status">
              <i className="bi bi-check-circle me-1" aria-hidden="true" />
              Saved.
            </span>
          )}
          {dirty && (
            <div className="ms-auto d-flex gap-2">
              <button type="button" className="btn btn-ghost" disabled={saveState.isLoading} onClick={discard}>
                Discard
              </button>
              <button type="button" className="btn btn-primary" disabled={saveState.isLoading} onClick={onSave}>
                {saveState.isLoading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
                Save
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ApplicationSettings;
