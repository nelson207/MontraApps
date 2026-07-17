import type { FormEvent } from "react";

type Props = {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  isLoading: boolean;
  isLoginLoading: boolean;
  onPasswordSubmit: (e: FormEvent<HTMLFormElement>) => void;
  setShowForgotPassword: (value: boolean) => void;
};

function PasswordLoginForm({
  username,
  setUsername,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  isLoading,
  isLoginLoading,
  onPasswordSubmit,
  setShowForgotPassword,
}: Props) {
  return (
    <>
      <h2 className="fw-bold mb-2">Welcome Back</h2>
      <p className="text-muted mb-4">Please sign in to continue</p>

      <form onSubmit={onPasswordSubmit}>
        <div className="mb-3">
          <label htmlFor="loginUsername" className="form-label">
            Username
          </label>
          <input
            type="text"
            className="form-control"
            id="loginUsername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="loginPassword" className="form-label">
            Password
          </label>
          <input
            type="password"
            className="form-control"
            id="loginPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="loginRememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="loginRememberMe">
              Remember me
            </label>
          </div>

          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none"
            onClick={() => setShowForgotPassword(true)}
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoginLoading ? "Logging in..." : "Submit"}
        </button>
      </form>
    </>
  );
}

export default PasswordLoginForm;
