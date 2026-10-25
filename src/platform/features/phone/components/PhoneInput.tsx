import { useState } from "react";
import { useDropdown } from "@platform/hooks/useDropdown";
import { useGetPhoneCountriesQuery } from "../api/phoneCountriesApi";
import {
  formatPhone,
  isValidPhone,
  dialCodeCountry,
  parsePhone,
  phoneDigits,
  toE164,
  type PhoneCountry,
  type PhoneType,
} from "../phoneModel";

type Props = {
  id: string;
  /** E.164 ("+351912345678"); "" / null when empty */
  value: string | null | undefined;
  /** Gets the E.164 number, or "" when empty */
  onChange: (value: string) => void;
  /** Which example the placeholder shows */
  type?: PhoneType;
  disabled?: boolean;
  /** Invalid from outside (validation message shown by the caller) */
  invalid?: boolean;
  /** Told when the number becomes complete or not (too few / many digits for the country) */
  onValidityChange?: (valid: boolean) => void;
  autoComplete?: string;
  "aria-describedby"?: string;
};

// Phone field (every Montra app): the country ("PT +351") inside the field in the main colour,
// a searchable list of the API's countries, the number grouped as the country writes it, and the
// E.164 value in and out. Same look as every other field (styles/forms.scss).
function PhoneInput({
  id,
  value,
  onChange,
  type = "mobile",
  disabled,
  invalid,
  onValidityChange,
  autoComplete = "tel-national",
  ...aria
}: Props) {
  const { data: countries = [] } = useGetPhoneCountriesQuery();
  const fallback = countries[0];
  const stored = value ?? "";

  // What is shown, and for which stored value: a new value from outside replaces it, the one we
  // just sent back doesn't (so the chosen country and a half-typed number are kept)
  const [shown, setShown] = useState<{
    value: string;
    country?: PhoneCountry;
    digits: string;
    /** "+3…" being typed, before its dial code matches a country */
    raw?: string;
  }>({
    value: stored,
    digits: "",
  });
  if (fallback && (shown.value !== stored || !shown.country)) {
    const parsed = parsePhone(
      stored,
      countries,
      shown.value === stored && shown.country ? shown.country : fallback,
    );
    setShown({ value: stored, ...parsed });
  }
  const [touched, setTouched] = useState(false);
  const [search, setSearch] = useState("");
  const { ref, isOpen, toggle, close } = useDropdown();

  // Countries not loaded (yet, or the list failed): a plain field that keeps the value as typed
  if (!fallback || !shown.country) {
    return (
      <input
        id={id}
        type="tel"
        className={`form-control ${invalid ? "is-invalid" : ""}`}
        value={stored}
        disabled={disabled}
        autoComplete="tel"
        aria-describedby={aria["aria-describedby"]}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  const country = shown.country;

  const emit = (next: PhoneCountry, digits: string) => {
    const e164 = toE164(digits, next);
    setShown({ value: e164, country: next, digits });
    if (e164 !== stored) onChange(e164);
    onValidityChange?.(isValidPhone(digits, next));
  };

  const typed = (text: string) => {
    // An international number (typed or pasted) picks its country once its dial code is complete;
    // until then what is typed stays as it is (and the stored value is empty)
    if (text.trim().startsWith("+")) {
      const matched = dialCodeCountry(text, countries);
      if (matched) {
        const parsed = parsePhone(text, countries, matched);
        return emit(parsed.country, parsed.digits);
      }
      setShown({ value: "", country, digits: "", raw: text });
      if (stored) onChange("");
      onValidityChange?.(false);
      return;
    }
    emit(country, phoneDigits(text, country));
  };

  const choose = (next: PhoneCountry) => {
    close();
    setSearch("");
    emit(next, phoneDigits(shown.digits, next));
    document.getElementById(id)?.focus();
  };

  const isInvalid =
    invalid || (touched && (!!shown.raw || !isValidPhone(shown.digits, country)));
  const query = search.trim().toLowerCase();
  const listed = countries.filter(
    (c) =>
      !query ||
      c.name.toLowerCase().includes(query) ||
      c.code.toLowerCase().includes(query) ||
      c.dialCode.startsWith(query.replace("+", "")),
  );
  const single = countries.length === 1;

  return (
    <div ref={ref} className="app-phone-input">
      <div className="input-group">
        <button
          type="button"
          className="btn app-phone-country"
          aria-label={`Country: ${country.name} (+${country.dialCode})${single ? "" : ", change"}`}
          aria-haspopup={single ? undefined : "listbox"}
          aria-expanded={single ? undefined : isOpen}
          disabled={disabled || single}
          onClick={toggle}
        >
          <span className="app-phone-country-code">{country.code}</span>+
          {country.dialCode}
          {!single && <i className="bi bi-chevron-down" aria-hidden="true" />}
        </button>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          className={`form-control ${isInvalid ? "is-invalid" : ""}`}
          placeholder={country.examples[type]}
          value={shown.raw ?? formatPhone(shown.digits, country)}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={isInvalid || undefined}
          aria-describedby={aria["aria-describedby"]}
          onChange={(e) => typed(e.target.value)}
          onBlur={() => setTouched(true)}
        />
      </div>

      {isOpen && (
        <div className="dropdown-menu show shadow p-0 app-phone-menu">
          <div className="p-2 border-bottom">
            <input
              type="search"
              className="form-control form-control-sm"
              placeholder="Search country or code"
              aria-label="Search country"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ul
            className="list-unstyled mb-0 py-1 app-phone-list"
            role="listbox"
            aria-label="Countries"
          >
            {listed.map((c) => (
              <li
                key={c.code}
                role="option"
                aria-selected={c.code === country.code}
              >
                <button
                  type="button"
                  className="dropdown-item d-flex gap-2"
                  onClick={() => choose(c)}
                >
                  <span className="app-phone-country-code">{c.code}</span>
                  <span className="flex-grow-1 text-truncate">{c.name}</span>
                  <span className="text-body-secondary">+{c.dialCode}</span>
                </button>
              </li>
            ))}
            {listed.length === 0 && (
              <li className="px-3 py-2 small text-body-secondary">
                No country found.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PhoneInput;
