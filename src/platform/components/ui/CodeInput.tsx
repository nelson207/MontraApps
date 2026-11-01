import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

type Props = {
  /** The digits typed so far (up to `length`) */
  value: string;
  onChange: (value: string) => void;
  /** All digits typed (e.g. to verify right away) */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  /** Names the group for screen readers */
  label: string;
  describedBy?: string;
};

// A one-time code, one box per digit (as in two-factor sign-in): typing moves on, Backspace goes
// back, the arrows move between boxes, and a pasted (or autofilled) code fills them all.
function CodeInput({ value, onChange, onComplete, length = 6, disabled, invalid, autoFocus, label, describedBy }: Props) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) boxes.current[Math.min(value.length, length - 1)]?.focus();
    // Only when shown
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  const focus = (index: number) => boxes.current[Math.max(0, Math.min(index, length - 1))]?.focus();

  const set = (next: string) => {
    const code = next.replace(/\D/g, "").slice(0, length);
    onChange(code);
    if (code.length === length) onComplete?.(code);
    return code;
  };

  /** Typed (or autofilled) into box `index`: what's there from it on is replaced */
  const typed = (index: number, text: string) => {
    const incoming = text.replace(/\D/g, "");
    if (!incoming) return;
    const code = set(value.slice(0, index) + incoming);
    focus(code.length);
  };

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      // An empty box: the previous one is cleared
      const at = digits[index] ? index : index - 1;
      if (at < 0) return;
      set(value.slice(0, at) + value.slice(at + 1));
      focus(at);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(index + 1);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    focus(set(e.clipboardData.getData("text")).length);
  };

  return (
    <div className="app-code-input" role="group" aria-label={label} aria-describedby={describedBy}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            boxes.current[index] = el;
          }}
          className={`form-control app-code-input-box ${invalid ? "is-invalid" : ""} ${digit ? "is-filled" : ""}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          // The first box takes the code the phone offers
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={index === 0 ? length : 1}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          value={digit}
          disabled={disabled}
          // Typing over it replaces its digit (one typed in a box past the code goes to the next free one)
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => typed(index, e.target.value.replace(digit, "") || e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          onPaste={onPaste}
        />
      ))}
    </div>
  );
}

export default CodeInput;
