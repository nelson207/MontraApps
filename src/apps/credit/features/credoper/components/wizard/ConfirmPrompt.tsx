import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { problemMessage } from "@platform/api/problemCode";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";

type Props = {
  title: string;
  /** Bootstrap Icons class */
  icon: string;
  /** What will happen and what won't */
  children: ReactNode;
  confirmLabel: string;
  /** Shown on the confirm button while `busy` */
  busyLabel?: string;
  cancelLabel: string;
  /** What was asked for is on its way: nothing to press meanwhile */
  busy?: boolean;
  /** The last attempt failed (nothing changed) */
  error?: unknown;
  /** Said first when it failed, e.g. "Couldn't remove it, so nothing changed." */
  errorLead?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

// Asked before something that can't simply be undone. Says who and what in plain words, and names
// its answers. Stays open until it's done, so a failure is said here and can be tried again.
function ConfirmPrompt({ title, icon, children, confirmLabel, busyLabel, cancelLabel, busy = false, error, errorLead, onCancel, onConfirm }: Props) {
  const id = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const cancel = useRef(onCancel);
  const isBusy = useRef(busy);
  useEffect(() => {
    cancel.current = onCancel;
    isBusy.current = busy;
  });

  useEffect(() => {
    // Not going ahead is the safe answer: Enter and Escape both mean it. Focus returns to what opened this
    const opener = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isBusy.current) cancel.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, []);

  return createPortal(
    <>
      <div
        className="modal fade show d-block"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-text`}
        aria-busy={busy || undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-body p-4">
              <h2 id={`${id}-title`} className="h5 fw-bold">
                <i className={`bi ${icon} text-primary me-2`} aria-hidden="true" />
                {title}
              </h2>
              <div id={`${id}-text`} className="text-body-secondary">
                {children}
              </div>
              {!!error && !busy && (
                <div className="alert alert-danger small py-2 mt-3 mb-0" role="alert">
                  {errorLead}{" "}
                  {problemMessage(error) ?? getApiErrorMessage(error) ?? "Please try again."}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-danger" onClick={onConfirm} disabled={busy}>
                {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
                {busy ? (busyLabel ?? confirmLabel) : confirmLabel}
              </button>
              <button ref={cancelRef} type="button" className="btn btn-primary" onClick={onCancel} disabled={busy}>
                {cancelLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>,
    document.body,
  );
}

export default ConfirmPrompt;
