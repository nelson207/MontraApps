import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@platform/app/store";
import { selectTheme, setThemeMode } from "../themeSlice";
import type { ThemeMode } from "../themeUtils";

const OPTIONS: { mode: ThemeMode; icon: string }[] = [
  { mode: "light", icon: "bi-sun" },
  { mode: "dark", icon: "bi-moon-stars" },
  { mode: "system", icon: "bi-circle-half" },
];

// Light / Dark / System: Settings → Appearance and the user menu (compact: icons + short labels)
function ThemeModeSwitch({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation("settings");
  const dispatch = useAppDispatch();
  const { mode } = useAppSelector(selectTheme);

  return (
    <div
      className={`btn-group ${compact ? "btn-group-sm w-100" : ""}`}
      role="radiogroup"
      aria-label={t("appearance.modeLabel")}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.mode}
          type="button"
          role="radio"
          aria-checked={mode === option.mode}
          className={`btn text-nowrap ${mode === option.mode ? "btn-primary" : "btn-outline-secondary app-mode-option"}`}
          title={option.mode === "system" ? t("appearance.systemTitle") : undefined}
          onClick={() => dispatch(setThemeMode(option.mode))}
        >
          <i className={`bi ${option.icon} ${compact ? "" : "me-1"}`} aria-hidden="true" />
          <span className={compact ? "ms-1 small" : undefined}>{t(`appearance.modes.${option.mode}`)}</span>
        </button>
      ))}
    </div>
  );
}

export default ThemeModeSwitch;
