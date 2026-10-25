import { useRef, useState } from "react";
import { useAppSelector } from "@platform/app/store";
import { selectTheme } from "@platform/features/theme/themeSlice";
import { formatDate, maskDate, parseDate } from "@platform/utils/dateFormat";

type Props = {
  id: string;
  /** ISO date (yyyy-MM-dd); "" / null when empty */
  value: string | null | undefined;
  /** Gets the ISO date, or "" when the field is empty or the date incomplete/impossible */
  onChange: (iso: string) => void;
  /** ISO limits, inclusive */
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  /** Invalid from outside (validation message shown by the caller) */
  invalid?: boolean;
  "aria-describedby"?: string;
};

// Date field typed in the user's date format (Settings → Appearance), shown as placeholder;
// separators are added while typing. The calendar button opens the browser's date picker.
// Forms only ever see ISO dates.
function DateInput({
  id,
  value,
  onChange,
  min,
  max,
  disabled,
  required,
  invalid,
  ...aria
}: Props) {
  const { dateFormat } = useAppSelector(selectTheme);
  const iso = value ?? "";
  // What is shown, and for which value/format: a new value from outside (or a new format) replaces
  // the text, but the value we just sent back doesn't (so a half-typed date isn't wiped)
  const [shown, setShown] = useState({
    text: formatDate(iso, dateFormat),
    iso,
    format: dateFormat,
  });
  if (shown.iso !== iso || shown.format !== dateFormat) {
    setShown({ text: formatDate(iso, dateFormat), iso, format: dateFormat });
  }
  const [touched, setTouched] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  const typed = (text: string) => {
    const masked = maskDate(text, dateFormat);
    const next = parseDate(masked, dateFormat) ?? "";
    setShown({ text: masked, iso: next, format: dateFormat });
    if (next !== iso) onChange(next);
  };

  const outOfRange =
    !!shown.iso && ((!!min && shown.iso < min) || (!!max && shown.iso > max));
  const unreadable = !!shown.text && !shown.iso;
  const isInvalid = invalid || (touched && (unreadable || outOfRange));

  const openPicker = () => {
    const native = picker.current;
    if (!native) return;
    try {
      native.showPicker();
    } catch {
      native.focus(); // older browsers: focus shows the picker
    }
  };

  return (
    <div className="app-date-input">
      <div className="input-group">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className={`form-control ${isInvalid ? "is-invalid" : ""}`}
          placeholder={dateFormat}
          maxLength={dateFormat.length}
          value={shown.text}
          disabled={disabled}
          required={required}
          aria-invalid={isInvalid || undefined}
          aria-describedby={aria["aria-describedby"]}
          onChange={(e) => typed(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        <button
          type="button"
          className="btn app-date-input-btn"
          aria-label="Choose a date"
          title="Choose a date"
          disabled={disabled}
          onClick={openPicker}
        >
          <i className="bi bi-calendar3" aria-hidden="true" />
        </button>
      </div>
      {/* The browser's picker, opened by the button (not focusable, not shown; outside the
          input group so the button keeps the group's rounded end) */}
      <input
        ref={picker}
        type="date"
        className="app-date-input-native"
        tabIndex={-1}
        aria-hidden="true"
        value={shown.iso}
        min={min}
        max={max}
        onChange={(e) => {
          setTouched(true);
          setShown({
            text: formatDate(e.target.value, dateFormat),
            iso: e.target.value,
            format: dateFormat,
          });
          onChange(e.target.value);
        }}
      />
    </div>
  );
}

export default DateInput;
