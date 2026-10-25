import { useEffect, useRef, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { usePostApiUsersConfirmEmailMutation } from "@platform/api/generated/MontraPOSApi";
import { PROBLEM, problemCode, problemStatus } from "@platform/api/problemCode";
import LoginLayout from "@platform/features/auth/components/LoginLayout";

/** What the confirmation's failure means for the user */
function confirmationFailure(error: unknown): string {
  if (problemStatus(error) === 429) return "Too many attempts, try again later";
  if (problemCode(error) === PROBLEM.invalidEmailConfirmationCode) return "This link is invalid or has expired";
  return "We couldn't confirm your e-mail address right now. Please try the link again later.";
}

// /confirm-email?code=… (public: opened from the e-mail Accipiens sends, signed in or not).
// On load: POST /api/users/confirm-email { code }, without the session's token.
function ConfirmEmailPage() {
  const [params] = useSearchParams();
  const code = params.get("code")?.trim() ?? "";
  const [confirm, { isUninitialized, isLoading, isSuccess, isError, error }] = usePostApiUsersConfirmEmailMutation();
  // A code is sent once (StrictMode runs effects twice in development)
  const sent = useRef(false);

  useEffect(() => {
    if (!code || sent.current) return;
    sent.current = true;
    void confirm({ emailConfirmationRequest: { code } });
  }, [code, confirm]);

  const loginLink = (
    <Link to="/login" className="btn btn-primary">
      Go to login
    </Link>
  );

  let content;
  if (!code) {
    content = (
      <Result icon="bi-x-circle" tone="danger" title="This link is invalid or has expired">
        <p className="text-body-secondary">Open the link from the e-mail again, or ask for a new one in your profile.</p>
        {loginLink}
      </Result>
    );
  } else if (isUninitialized || isLoading) {
    content = (
      <div className="d-flex align-items-center gap-2 text-body-secondary" role="status">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        Confirming your e-mail address…
      </div>
    );
  } else if (isSuccess) {
    content = (
      <Result icon="bi-check-circle" tone="success" title="Your e-mail address is confirmed">
        <p className="text-body-secondary">Thank you. You can now sign in.</p>
        {loginLink}
      </Result>
    );
  } else if (isError) {
    content = (
      <Result icon="bi-exclamation-triangle" tone="danger" title={confirmationFailure(error)}>
        {loginLink}
      </Result>
    );
  }

  return (
    <LoginLayout>
      <h1 className="h4 mb-4">E-mail confirmation</h1>
      {content}
    </LoginLayout>
  );
}

function Result({ icon, tone, title, children }: { icon: string; tone: "success" | "danger"; title: string; children: ReactNode }) {
  return (
    <div role={tone === "danger" ? "alert" : "status"}>
      <div className={`d-flex align-items-center gap-2 mb-2 text-${tone}-emphasis`}>
        <i className={`bi ${icon} fs-4`} aria-hidden="true" />
        <h2 className="h5 mb-0">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default ConfirmEmailPage;
