import { useTranslation } from "react-i18next";
import { useAppDispatch } from "@platform/app/store";
import { LANGUAGE_NAMES, LANGUAGES, parseLanguage } from "./languages";
import { chooseLanguage } from "./languageSlice";

// The language picker: Settings → Appearance and the user menu (compact: the short codes).
// Each language is named in itself, so it can be found whatever language is shown.
function LanguageSwitch({ compact = false, label }: { compact?: boolean; label: string }) {
  const dispatch = useAppDispatch();
  const { i18n } = useTranslation();
  const current = parseLanguage(i18n.resolvedLanguage) ?? LANGUAGES[0];

  return (
    <div className={`btn-group ${compact ? "btn-group-sm w-100" : ""}`} role="radiogroup" aria-label={label}>
      {LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          role="radio"
          lang={language}
          aria-checked={current === language}
          aria-label={compact ? LANGUAGE_NAMES[language] : undefined}
          className={`btn text-nowrap ${current === language ? "btn-primary" : "btn-outline-secondary app-mode-option"}`}
          onClick={() => dispatch(chooseLanguage(language))}
        >
          {compact ? <span className="small">{language.slice(0, 2).toUpperCase()}</span> : LANGUAGE_NAMES[language]}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitch;
