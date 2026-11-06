import { useEffect, useRef } from "react";

type Props = {
  /** e.g. "Quotation #12" or "a new proposal" */
  label: string;
  /** What discarding leads to: a new operation, the saved one being opened (Search), or a quotation's new proposal */
  discardsTo?: "new" | "open" | "convert";
  onContinue: () => void;
  onDiscard: () => void;
};

// Asked when a new or opened operation would replace one with unsaved changes (spec §2).
function DiscardPrompt({ label, discardsTo = "new", onContinue, onDiscard }: Props) {
  const continueRef = useRef<HTMLButtonElement>(null);
  const onContinueRef = useRef(onContinue);
  useEffect(() => {
    onContinueRef.current = onContinue;
  });

  useEffect(() => {
    continueRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onContinueRef.current();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="discard-title">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-body p-4">
              <h2 id="discard-title" className="h5 fw-bold">
                <i className="bi bi-exclamation-triangle text-warning me-2" aria-hidden="true" />
                Unsaved changes
              </h2>
              <p className="mb-0 text-body-secondary">
                You have unsaved changes to {label}. Do you want to keep editing it, or discard the changes and{" "}
                {discardsTo === "open"
                  ? "open the operation you chose"
                  : discardsTo === "convert"
                    ? "convert the quotation to a proposal"
                    : "start a new one"}
                ?
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-danger" onClick={onDiscard}>
                {discardsTo === "open" ? "Discard and open" : discardsTo === "convert" ? "Discard and convert" : "Discard and start new"}
              </button>
              <button ref={continueRef} type="button" className="btn btn-primary" onClick={onContinue}>
                Continue editing
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export default DiscardPrompt;
