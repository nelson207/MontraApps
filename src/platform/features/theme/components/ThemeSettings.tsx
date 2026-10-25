import { Trans, useTranslation } from "react-i18next";
import BrandLogo from "@platform/components/brand/BrandLogo";
import LanguageSwitch from "@platform/i18n/LanguageSwitch";
import ThemeModeSwitch from "./ThemeModeSwitch";
import { DATE_FORMATS, formatDate, type DateFormat } from "@platform/utils/dateFormat";

/** Shown next to each date format (day 31 > 12, so day and month can't be confused) */
const EXAMPLE_DATE = "2026-12-31";
import { useAppDispatch, useAppSelector } from "@platform/app/store";
import {
  applyThemePreset,
  resetTheme,
  selectTheme,
  setDateFormat,
  setThemeColor,
  type ThemeColor,
} from "../themeSlice";
import { contrastRatio, readableTextColor, THEME_PRESETS } from "../themeUtils";

const COLOR_FIELDS: ThemeColor[] = ["primary", "onPrimary", "bodyText"];

function ContrastBadge({ ratio }: { ratio: number }) {
  const { t } = useTranslation("settings");
  const passes = ratio >= 4.5;
  return (
    <span
      className={`badge ${passes ? "text-bg-success" : "text-bg-warning"}`}
      title={t("appearance.contrastTitle")}
    >
      <i className={`bi ${passes ? "bi-check-circle" : "bi-exclamation-triangle"} me-1`} />
      {ratio.toFixed(1)}:1 {passes ? t("appearance.readable") : t("appearance.lowContrast")}
    </span>
  );
}

function ThemeSettings() {
  const { t } = useTranslation("settings");
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const sidebarContrast = contrastRatio(theme.primary, theme.onPrimary);

  const setColor = (key: ThemeColor, value: string) =>
    dispatch(setThemeColor({ key, value }));

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-body d-flex align-items-center justify-content-between py-3">
        <h2 className="h6 mb-0">
          <i className="bi bi-palette me-2 text-primary" />
          {t("appearance.title")}
        </h2>
        <button
          type="button"
          className="btn btn-link btn-sm text-decoration-none"
          onClick={() => dispatch(resetTheme())}
        >
          <i className="bi bi-arrow-counterclockwise me-1" />
          {t("appearance.reset")}
        </button>
      </div>

      <div className="card-body">
        <h3 className="h6 text-body-secondary">{t("language.title")}</h3>
        <div className="mb-4">
          <LanguageSwitch label={t("language.title")} />
          <div className="form-text">{t("language.help")}</div>
        </div>

        <h3 className="h6 text-body-secondary">{t("appearance.mode")}</h3>
        <div className="mb-4">
          <ThemeModeSwitch />
          <div className="form-text">{t("appearance.modeHelp")}</div>
        </div>

        <div className="mb-4 app-date-format-setting">
          <label htmlFor="theme-date-format" className="form-label">
            {t("appearance.dateFormat")}
          </label>
          <select
            id="theme-date-format"
            className="form-select"
            value={theme.dateFormat}
            onChange={(e) => dispatch(setDateFormat(e.target.value as DateFormat))}
          >
            {DATE_FORMATS.map((format) => (
              <option key={format} value={format}>
                {t("appearance.dateFormatOption", { format, example: formatDate(EXAMPLE_DATE, format) })}
              </option>
            ))}
          </select>
          <div className="form-text">{t("appearance.dateFormatHelp")}</div>
        </div>

        <h3 className="h6 text-body-secondary">{t("appearance.presets")}</h3>
        <div className="d-flex flex-wrap gap-2 mb-4">
          {THEME_PRESETS.map((preset) => {
            const active =
              preset.primary === theme.primary &&
              preset.onPrimary === theme.onPrimary;
            return (
              <button
                key={preset.name}
                type="button"
                className={`app-swatch ${active ? "is-active" : ""}`}
                style={{ backgroundColor: preset.primary, color: preset.onPrimary }}
                title={preset.name}
                aria-label={t("appearance.presetLabel", { name: preset.name })}
                aria-pressed={active}
                onClick={() => dispatch(applyThemePreset(preset))}
              >
                {active ? <i className="bi bi-check-lg" /> : "Aa"}
              </button>
            );
          })}
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-6">
            {COLOR_FIELDS.map((key) => (
              <div key={key} className="mb-3">
                <label htmlFor={`theme-${key}`} className="form-label fw-semibold mb-1">
                  {t(`appearance.colors.${key}`)}
                </label>
                <div className="d-flex align-items-center gap-2">
                  <input
                    id={`theme-${key}`}
                    type="color"
                    className="form-control form-control-color"
                    value={theme[key]}
                    onChange={(e) => setColor(key, e.target.value)}
                  />
                  <code className="text-body-secondary">{theme[key]}</code>
                  {key === "onPrimary" && (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm ms-auto"
                      onClick={() =>
                        setColor("onPrimary", readableTextColor(theme.primary))
                      }
                    >
                      <i className="bi bi-magic me-1" />
                      {t("appearance.auto")}
                    </button>
                  )}
                </div>
                <div className="form-text">{t(`appearance.colors.${key}Help`)}</div>
              </div>
            ))}

            <div className="d-flex align-items-center gap-2 small">
              {t("appearance.sidebarContrast")} <ContrastBadge ratio={sidebarContrast} />
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <h3 className="h6 text-body-secondary">{t("appearance.preview")}</h3>
            <div className="app-theme-preview border rounded-3 overflow-hidden d-flex">
              <div className="app-theme-preview-sidebar p-2 d-flex flex-column gap-1">
                <BrandLogo size="xs" className="px-2 py-1" />
                <span className="app-theme-preview-link is-active">
                  <i className="bi bi-house-door me-2" />
                  {t("appearance.previewHome")}
                </span>
                <span className="app-theme-preview-link">
                  <i className="bi bi-newspaper me-2" />
                  {t("appearance.previewNews")}
                </span>
              </div>
              <div className="flex-grow-1 p-3 bg-body">
                <p className="mb-2">
                  <Trans
                    t={t}
                    i18nKey="appearance.previewContent"
                    components={{ link: <a href="#preview" onClick={(e) => e.preventDefault()} /> }}
                  />
                </p>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  <button type="button" className="btn btn-primary btn-sm">
                    {t("appearance.previewPrimary")}
                  </button>
                  <button type="button" className="btn btn-outline-primary btn-sm">
                    {t("appearance.previewOutline")}
                  </button>
                  <span className="badge text-bg-primary align-self-center">{t("appearance.previewBadge")}</span>
                </div>
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="theme-preview-switch"
                    defaultChecked
                  />
                  <label className="form-check-label" htmlFor="theme-preview-switch">
                    {t("appearance.previewSwitch")}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThemeSettings;
