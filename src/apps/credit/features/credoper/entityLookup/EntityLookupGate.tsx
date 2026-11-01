import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { CredOperIntervDto } from "@platform/api/legacy/legacyApi";
import CodeInput from "@platform/components/ui/CodeInput";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import { selectCredoper, selectEntityLookup, useAppDispatch, useAppSelector } from "@credit/store";
import { patchCredoper } from "../credoperSlice";
import { isCompany } from "../model/credOperDraft";
import {
  initialNif,
  canSearchAgain,
  isLookupPending,
  isOtpValid,
  isValidNif,
  normalizeNif,
  vatOf,
  withEntityData,
  withQuotationCustomer,
  withVat,
} from "./entityLookup";
import {
  usePostApiEntitiesLookupByVatMutation,
  usePostApiEntitiesOtpSendMutation,
  usePostApiEntitiesOtpVerifyMutation,
} from "./entityLookupApi";
import { choseManual, filled, lookedUp, otpSent, searchAgain, type EntityLookup } from "./entityLookupSlice";

const CODE_LENGTH = 6;

/** Now, every second while `active` (a code's time left) */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

const time = (iso: string) => new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

const timeLeft = (iso: string, now: number) => {
  const seconds = Math.max(0, Math.round((new Date(iso).getTime() - now) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

/** Where the code goes, as the backend masked it */
function Contacts({ lookup }: { lookup: EntityLookup }) {
  if (!lookup.phone && !lookup.email) return null;
  return (
    <ul className="list-unstyled d-inline-flex flex-column gap-1 text-start mb-0">
      {lookup.phone && (
        <li>
          <i className="bi bi-phone me-2 text-primary" aria-hidden="true" />
          {lookup.phone}
        </li>
      )}
      {lookup.email && (
        <li>
          <i className="bi bi-envelope me-2 text-primary" aria-hidden="true" />
          {lookup.email}
        </li>
      )}
    </ul>
  );
}

/** A centered dialog over the page (in <body>); Escape and × call `onClose` when given */
function Dialog({ labelledBy, onClose, busy, children }: { labelledBy: string; onClose?: () => void; busy?: boolean; children: ReactNode }) {
  useEffect(() => {
    if (!onClose) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby={labelledBy} aria-busy={busy || undefined}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-body p-4 text-center position-relative">
              {onClose && (
                <button type="button" className="btn-close position-absolute top-0 end-0 m-3" aria-label="Close" onClick={onClose} />
              )}
              {children}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>,
    document.body,
  );
}

function Waiting({ id, text }: { id: string; text: string }) {
  return (
    <Dialog labelledBy={id} busy>
      <div role="status">
        <span className="spinner-border text-primary mb-3" aria-hidden="true" />
        <p id={id} className="mb-0">
          {text}
        </p>
      </div>
    </Dialog>
  );
}

type Step = "searching" | "found" | "sending" | "code" | null;

type Props = { intervention: CredOperIntervDto };

// A new person of a proposal starts with their NIF only: found in the database, the user may have
// a code sent to the person's phone and e-mail on file and, with it, their data filled in; not
// found (or whenever the user prefers), it's typed by hand. A code sent can be entered later.
function EntityLookupGate({ intervention }: Props) {
  const dispatch = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);
  const ref = intervention.correlationID;
  const lookup = useAppSelector(selectEntityLookup(ref));
  const pending = isLookupPending(intervention, lookup);

  const [nif, setNif] = useState(() => lookup?.vat ?? initialNif(intervention, credoper));
  const [nifError, setNifError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const [lookUp] = usePostApiEntitiesLookupByVatMutation();
  const [sendOtp] = usePostApiEntitiesOtpSendMutation();
  const [verifyOtp, verifyState] = usePostApiEntitiesOtpVerifyMutation();

  const otp = lookup?.otp;
  const resumable = !!otp && lookup?.outcome !== "filled";
  const now = useNow(resumable);
  const otpValid = isOtpValid(otp?.validUntil, now);

  /** This person changed (the others as they are) */
  const update = (change: (person: CredOperIntervDto) => CredOperIntervDto) =>
    dispatch(
      patchCredoper({
        interventions: credoper?.interventions?.map((p) => (p.correlationID === ref ? change(p) : p)),
      }),
    );

  /** Filled in by hand: with the NIF, and for the customer what the quotation had */
  const toManual = (vat: string) => {
    update((person) => {
      const withQuotation = credoper ? withQuotationCustomer(person, credoper) : person;
      return vat ? withVat(withQuotation, vat) : withQuotation;
    });
  };

  const search = async (e?: FormEvent) => {
    e?.preventDefault();
    const vat = normalizeNif(nif);
    setNif(vat);
    if (!isValidNif(vat)) return setNifError("Enter a valid NIF (9 digits).");
    if (!ref) return;
    setNifError(null);
    setFailure(null);
    setStep("searching");
    try {
      const answer = await lookUp({ vat }).unwrap();
      dispatch(lookedUp({ ref, vat, found: answer.found, phone: answer.phone, email: answer.email }));
      if (answer.found) return setStep("found");
      setStep(null);
      toManual(vat);
    } catch (error) {
      setStep(null);
      setFailure(getApiErrorMessage(error) ?? "Couldn't search the NIF. Try again, or fill in the details by hand.");
    }
  };

  const fillInManually = () => {
    const vat = normalizeNif(nif);
    setStep(null);
    setFailure(null);
    if (ref) dispatch(choseManual({ ref, vat }));
    toManual(isValidNif(vat) ? vat : "");
  };

  const sendCode = async () => {
    if (!ref || !lookup) return;
    setFailure(null);
    setStep("sending");
    try {
      const answer = await sendOtp({ vat: lookup.vat }).unwrap();
      if (!answer.sent || !answer.otpRequestId || !answer.validUntil) {
        setStep("found");
        return setFailure(answer.message || "The code couldn't be sent. Try again, or fill in the details by hand.");
      }
      dispatch(otpSent({ ref, otp: { requestId: answer.otpRequestId, validUntil: answer.validUntil } }));
      setCode("");
      setCodeError(null);
      setStep("code");
    } catch (error) {
      setStep("found");
      setFailure(getApiErrorMessage(error) ?? "The code couldn't be sent. Try again, or fill in the details by hand.");
    }
  };

  const verify = async (value = code) => {
    if (!ref || !lookup || !otp || value.length !== CODE_LENGTH || verifyState.isLoading) return;
    setCodeError(null);
    try {
      const answer = await verifyOtp({ otpRequestId: otp.requestId, code: value }).unwrap();
      if (!answer.valid || !answer.intervention) {
        setCode("");
        return setCodeError(answer.message || "The code doesn't match. Check it and try again.");
      }
      update((person) => withEntityData(person, answer.intervention!, lookup.vat));
      dispatch(filled(ref));
      setStep(null);
    } catch (error) {
      setCodeError(getApiErrorMessage(error) ?? "Couldn't check the code. Please try again.");
    }
  };

  /** The code dialog again (a request still valid), or the offer to send one */
  const resume = () => {
    setFailure(null);
    setCode("");
    setCodeError(null);
    setStep(otpValid ? "code" : "found");
  };

  /** Back to the search from filling in by hand, with the NIF the person has (or the last one searched) */
  const startOver = () => {
    if (!ref) return;
    const vat = vatOf(intervention) || lookup?.vat || initialNif(intervention, credoper);
    setNif(vat);
    setNifError(null);
    setFailure(null);
    dispatch(searchAgain({ ref, vat }));
  };

  return (
    <>
      {pending && (
        <form className="app-entity-lookup border rounded-3 p-3 mb-3" onSubmit={search} noValidate>
          <div className="d-flex align-items-center gap-2 mb-2">
            <i className="bi bi-search text-primary" aria-hidden="true" />
            <h6 className="mb-0">{lookup?.outcome === "search" ? "Search by NIF" : "Start with the NIF"}</h6>
          </div>
          <p className="text-body-secondary small mb-3">
            We'll check whether this {isCompany(intervention) ? "company" : "person"} is already a customer.
            {lookup?.outcome === "search"
              ? " What you typed is kept: it unlocks again if you go back to filling in by hand."
              : " The other details unlock once the NIF is searched, or when you choose to fill them in by hand."}
          </p>
          <div className="row g-2 align-items-start">
            <div className="col-sm-6 col-lg-4">
              <label htmlFor={`entity-lookup-${ref}-nif`} className="form-label">
                NIF<span className="text-danger ms-1">*</span>
              </label>
              <input
                id={`entity-lookup-${ref}-nif`}
                className={`form-control ${nifError ? "is-invalid" : ""}`}
                inputMode="numeric"
                autoComplete="off"
                maxLength={14}
                placeholder="9 digits"
                value={nif}
                aria-invalid={!!nifError || undefined}
                aria-describedby={nifError ? `entity-lookup-${ref}-nif-feedback` : undefined}
                onChange={(e) => {
                  setNif(e.target.value);
                  setNifError(null);
                }}
              />
              {nifError && (
                <div id={`entity-lookup-${ref}-nif-feedback`} className="invalid-feedback d-block">
                  {nifError}
                </div>
              )}
            </div>
            <div className="col-sm-auto d-flex flex-wrap gap-2 app-entity-lookup-actions">
              {lookup?.outcome === "found" && lookup.vat === normalizeNif(nif) ? (
                <button type="button" className="btn btn-primary" onClick={resume}>
                  <i className="bi bi-shield-lock me-1" aria-hidden="true" />
                  {otpValid ? "Enter the code" : "Get the details"}
                </button>
              ) : (
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-search me-1" aria-hidden="true" />
                  Search
                </button>
              )}
              <button type="button" className="btn btn-link" onClick={fillInManually}>
                Fill in manually
              </button>
            </div>
          </div>
          {lookup?.outcome === "found" && lookup.vat === normalizeNif(nif) && (
            <p className="small text-success-emphasis mb-0 mt-1">
              <i className="bi bi-check-circle me-1" aria-hidden="true" />
              Found in the database.
            </p>
          )}
          {failure && step === null && (
            <div className="alert alert-warning small py-2 mt-3 mb-0" role="alert">
              {failure}
            </div>
          )}
        </form>
      )}

      {/* Filled in by hand (chosen, or not found): the search can be started over at any time */}
      {canSearchAgain(intervention, lookup) && (
        <div
          className={`alert ${lookup?.outcome === "notFound" ? "alert-info" : "alert-light border"} d-flex flex-wrap align-items-center gap-2 py-2`}
          role="status"
        >
          <i className={`bi ${lookup?.outcome === "notFound" ? "bi-info-circle" : "bi-pencil-square"}`} aria-hidden="true" />
          <span className="flex-grow-1 small">
            {lookup?.outcome === "notFound"
              ? `NIF ${lookup.vat} isn't in the database yet: fill in the details below.`
              : "Filling in the details by hand."}
          </span>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={startOver}>
            <i className="bi bi-search me-1" aria-hidden="true" />
            {lookup?.outcome === "notFound" ? "Search another NIF" : "Search by NIF"}
          </button>
        </div>
      )}

      {/* A code sent and not entered: it can be picked up again at any time (also after filling in by hand) */}
      {!pending && resumable && otp && (
        <div className="alert alert-primary d-flex flex-wrap align-items-center gap-2 py-2" role="status">
          <i className="bi bi-shield-lock" aria-hidden="true" />
          <span className="flex-grow-1 small">
            {otpValid
              ? `A code was sent for NIF ${lookup.vat}, valid until ${time(otp.validUntil)}. Enter it to fill in the details from the database.`
              : `The code sent for NIF ${lookup.vat} has expired.`}
          </span>
          <button type="button" className="btn btn-sm btn-primary" onClick={resume}>
            {otpValid ? "Enter the code" : "Send a new code"}
          </button>
        </div>
      )}

      {step === "searching" && <Waiting id="entity-lookup-searching" text="Searching the NIF in the database…" />}
      {step === "sending" && <Waiting id="entity-lookup-sending" text="Sending the code…" />}

      {step === "found" && lookup && (
        <Dialog labelledBy="entity-lookup-found" onClose={() => setStep(null)}>
          <i className="bi bi-person-check display-6 text-success" aria-hidden="true" />
          <h2 id="entity-lookup-found" className="h5 fw-bold mt-2">
            NIF found
          </h2>
          <p className="text-body-secondary">
            NIF {lookup.vat} is already in the database. To fill in the details from there, the owner must confirm with a{" "}
            {CODE_LENGTH}-digit code. Send it to:
          </p>
          <div className="mb-3">
            <Contacts lookup={lookup} />
          </div>
          {failure && (
            <div className="alert alert-warning small py-2 text-start" role="alert">
              {failure}
            </div>
          )}
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <button type="button" className="btn btn-ghost" onClick={fillInManually}>
              Fill in manually
            </button>
            <button type="button" className="btn btn-primary" onClick={sendCode} autoFocus>
              <i className="bi bi-send me-1" aria-hidden="true" />
              Send code
            </button>
          </div>
        </Dialog>
      )}

      {step === "code" && lookup && otp && (
        <Dialog labelledBy="entity-lookup-code" onClose={() => setStep(null)} busy={verifyState.isLoading}>
          <i className="bi bi-shield-lock display-6 text-primary" aria-hidden="true" />
          <h2 id="entity-lookup-code" className="h5 fw-bold mt-2">
            Enter the code
          </h2>
          <p className="text-body-secondary mb-2">We sent a {CODE_LENGTH}-digit code to:</p>
          <div className="mb-3">
            <Contacts lookup={lookup} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void verify();
            }}
          >
            <CodeInput
              label="Verification code"
              value={code}
              onChange={(value) => {
                setCode(value);
                setCodeError(null);
              }}
              onComplete={(value) => void verify(value)}
              length={CODE_LENGTH}
              disabled={verifyState.isLoading || !otpValid}
              invalid={!!codeError}
              autoFocus
              describedBy="entity-lookup-code-status"
            />
            <p id="entity-lookup-code-status" className="small mt-3 mb-3" aria-live="polite">
              {codeError ? (
                <span className="text-danger">{codeError}</span>
              ) : otpValid ? (
                <span className="text-body-secondary">
                  <i className="bi bi-clock me-1" aria-hidden="true" />
                  Valid until {time(otp.validUntil)} ({timeLeft(otp.validUntil, now)} left)
                </span>
              ) : (
                <span className="text-warning-emphasis">This code has expired. Send a new one.</span>
              )}
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <button type="button" className="btn btn-ghost" onClick={fillInManually}>
                Fill in manually
              </button>
              <button type="button" className="btn btn-ghost" onClick={sendCode} disabled={verifyState.isLoading}>
                Send a new code
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={verifyState.isLoading || code.length !== CODE_LENGTH || !otpValid}
              >
                {verifyState.isLoading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
                {verifyState.isLoading ? "Checking…" : "Confirm"}
              </button>
            </div>
            <p className="small text-body-secondary mt-3 mb-0">You can close this and enter the code later.</p>
          </form>
        </Dialog>
      )}
    </>
  );
}

export default EntityLookupGate;
