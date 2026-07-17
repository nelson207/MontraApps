import type { FormEvent } from "react";
import Alert from "react-bootstrap/Alert";

type Props = {
  forgotEmail: string;
  setForgotEmail: (value: string) => void;
  forgotLogin: string;
  setForgotLogin: (value: string) => void;
  forgotSuccessMessage: string | null;
  isForgotPasswordLoading: boolean;
  onForgotPasswordSubmit: (e: FormEvent<HTMLFormElement>) => void;
  setShowForgotPassword: (value: boolean) => void;
};

function ForgotPasswordForm({
  forgotEmail,
  setForgotEmail,
  forgotLogin,
  setForgotLogin,
  forgotSuccessMessage,
  isForgotPasswordLoading,
  onForgotPasswordSubmit,
  setShowForgotPassword,
}: Props) {
  return (
    <>
      <h2 className="fw-bold mb-2">Forgot Password</h2>
      <p className="text-muted mb-4">
        Enter your email and we’ll send password reset instructions.
      </p>

      <form onSubmit={onForgotPasswordSubmit}>
        <div className="mb-3">
          <label htmlFor="forgotEmail" className="form-label">
            Username
          </label>
          <input
            type="text"
            className="form-control"
            id="forgotUsername"
            value={forgotLogin}
            onChange={(e) => setForgotLogin(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="forgotEmail" className="form-label">
            Email
          </label>
          <input
            type="email"
            className="form-control"
            id="forgotEmail"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
          />
        </div>

        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isForgotPasswordLoading}
          >
            {isForgotPasswordLoading ? "Sending..." : "Send reset link"}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={isForgotPasswordLoading}
            onClick={() => setShowForgotPassword(false)}
          >
            Back
          </button>
        </div>
      </form>

      {forgotSuccessMessage && (
        <Alert
          variant="success"
          className="mt-4"
          style={{ whiteSpace: "pre-line" }}
        >
          {forgotSuccessMessage}
        </Alert>
      )}
    </>
  );
}

export default ForgotPasswordForm;
