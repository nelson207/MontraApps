import type { FormEvent, ChangeEvent, JSX } from "react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../../assets/logo.svg";
import Alert from "react-bootstrap/Alert";
import { selectIsAuthenticated, useAppSelector } from "../../../app/store";
import {
  usePostApiAuthLoginMutation,
  type LoginRequestDto,
} from "../../../services/api/generated/MontraPOSApi";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

function Login(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthed = useAppSelector(selectIsAuthenticated);

  const [login, { isLoading, error }] = usePostApiAuthLoginMutation();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const from =
    (location.state as LocationState | null)?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthed) {
      navigate(from, { replace: true });
    }
  }, [isAuthed, from, navigate]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const loginRequestDto: LoginRequestDto = {
      identifier: username,
      password: password,
      method: "Password",
      rememberMe: rememberMe,
    };

    try {
      await login({
        loginRequestDto,
      }).unwrap();

      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const errorMessage =
    error && typeof error === "object"
      ? "data" in error && error.data
        ? typeof error.data === "string"
          ? error.data
          : typeof error.data === "object" &&
              "message" in error.data &&
              error.data.message
            ? String(error.data.message)
            : null
        : "error" in error && error.error
          ? String(error.error)
          : "message" in error && error.message
            ? String(error.message)
            : null
      : null;

  return (
    <div className="container-fluid min-vh-100">
      <div className="row min-vh-100">
        {/* Left: Logo */}
        <div className="col-lg-8 d-none d-lg-flex align-items-center justify-content-center bg-primary p-5">
          <img
            src={logo}
            alt="Logo"
            className="img-fluid"
            style={{
              maxWidth: "70%",
              filter: "drop-shadow(0 12px 24px rgba(0,0,0,.25))",
            }}
          />
        </div>

        {/* Right: Login */}
        <div className="col-lg-4 col-12 d-flex align-items-center justify-content-center bg-white p-4">
          <div style={{ width: "100%", maxWidth: 420 }}>
            <h2 className="fw-bold mb-2">Welcome Back</h2>
            <p className="text-muted mb-4">Please sign in to continue</p>

            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label htmlFor="loginUsername" className="form-label">
                  Username
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="loginUsername"
                  aria-describedby="usernameHelp"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <div id="usernameHelp" className="form-text">
                  We'll never share your username with anyone else.
                </div>
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
                <a href="#" className="text-decoration-none">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Submit"}
              </button>
            </form>
            {error && (
              <Alert variant="danger" className="mt-4">
                {errorMessage}
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
