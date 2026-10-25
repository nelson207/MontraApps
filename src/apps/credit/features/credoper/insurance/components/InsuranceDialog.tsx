import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  title: string;
  onSave: () => void;
  onClose: () => void;
  children: ReactNode;
};

// Bootstrap modal frame shared by both insurance dialogs: focus moves in on open and
// back on close, Esc closes, page scroll is locked.
function InsuranceDialog({ title, onSave, onClose, children }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Latest onClose without re-running the setup (parents pass a new function each render)
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>("button, input, [tabindex]")?.focus();
    document.body.classList.add("overflow-hidden");
    // An Esc already handled inside (e.g. closing a searchable list) must not close the dialog
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && !e.defaultPrevented && onCloseRef.current();
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("overflow-hidden");
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="insurance-dialog-title">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div ref={dialogRef} className="modal-content border-0 shadow-lg">
            <div className="modal-header">
              <h2 id="insurance-dialog-title" className="modal-title h5">
                {title}
              </h2>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={onSave}>
                Save insurance
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export default InsuranceDialog;
