import { useEffect, useRef } from "react";

type Props = {
  /** e.g. "Quotation #12" or "a new proposal" */
  label: string;
  onContinue: () => void;
  onDiscard: () => void;
};

// Asked when a new operation would replace one with unsaved changes (spec §2).
function DiscardPrompt({ label, onContinue, onDiscard }: Props) {
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
                You have unsaved changes to {label}. Do you want to keep editing it, or discard the changes and start a
                new one?
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-danger" onClick={onDiscard}>
                Discard and start new
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
