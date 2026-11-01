import { useEffect, useRef, useState } from "react";
import { DEFAULTED_FIELDS, type DefaultConflict } from "../../model/productDefaults";

type Props = {
  conflicts: DefaultConflict[];
  /** The defaults the user accepted (none: every value stays) */
  onResolve: (accepted: DefaultConflict[]) => void;
};

const number = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });

const shown = (c: DefaultConflict, value: number) => `${number.format(value)} ${DEFAULTED_FIELDS[c.field].unit}`;

// Asked when a new financial product's defaults differ from values on screen: each one changes
// only if the user confirms it.
function ProductDefaultsPrompt({ conflicts, onResolve }: Props) {
  const [accepted, setAccepted] = useState(() => new Set(conflicts.map((c) => c.field)));
  const applyRef = useRef<HTMLButtonElement>(null);
  const onResolveRef = useRef(onResolve);
  useEffect(() => {
    onResolveRef.current = onResolve;
  });

  useEffect(() => {
    applyRef.current?.focus();
    // Escape keeps the user's values
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onResolveRef.current([]);
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggle = (field: DefaultConflict["field"]) =>
    setAccepted((s) => {
      const next = new Set(s);
      if (!next.delete(field)) next.add(field);
      return next;
    });

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="product-defaults-title">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-body p-4">
              <h2 id="product-defaults-title" className="h5 fw-bold">
                <i className="bi bi-exclamation-triangle text-warning me-2" aria-hidden="true" />
                Financial product defaults
              </h2>
              <p className="text-body-secondary">
                The new financial product has different default values. Choose which ones should replace yours.
              </p>
              <ul className="list-group">
                {conflicts.map((c) => (
                  <li key={c.field} className="list-group-item">
                    <div className="form-check mb-0">
                      <input
                        id={`product-default-${c.field}`}
                        className="form-check-input"
                        type="checkbox"
                        checked={accepted.has(c.field)}
                        onChange={() => toggle(c.field)}
                      />
                      <label className="form-check-label w-100" htmlFor={`product-default-${c.field}`}>
                        <span className="fw-semibold">{DEFAULTED_FIELDS[c.field].label}</span>
                        <span className="d-block small text-body-secondary">
                          {shown(c, c.current)} <i className="bi bi-arrow-right mx-1" aria-label="to" /> {shown(c, c.proposed)}
                        </span>
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => onResolve([])}>
                Keep my values
              </button>
              <button
                ref={applyRef}
                type="button"
                className="btn btn-primary"
                onClick={() => onResolve(conflicts.filter((c) => accepted.has(c.field)))}
              >
                Apply selected
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export default ProductDefaultsPrompt;
