import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { usePostApiAuthLoginMutation } from "../../router/apis/ArNextAPI";
import { selectIsAuthenticated } from "../../router/reducers/auth/authSlice";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthed = useSelector(selectIsAuthenticated);

  const [login, { isLoading, error }] = usePostApiAuthLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // If already logged in, redirect away from login page
  useEffect(() => {
    if (isAuthed) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthed, location.state, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      // IMPORTANT: your endpoint expects { loginRequest: {...} }
      await login({ loginRequest: { email, password } }).unwrap();

      // authSlice will update via matcher (matchFulfilled)
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      // error shown below; unwrap throws for rejected requests
      console.error("Login failed:", err);
    }
  };

  // RTK Query error format can vary; this makes it readable
  const errorMessage =
    error?.data?.message || error?.error || error?.message || null;

  return (
    <div style={{ maxWidth: 360, margin: "80px auto" }}>
      <h2>Login</h2>

      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          style={{ width: "100%", marginBottom: 12 }}
        />

        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          style={{ width: "100%", marginBottom: 12 }}
        />

        <button type="submit" disabled={isLoading} style={{ width: "100%" }}>
          {isLoading ? "Logging in..." : "Login"}
        </button>

        {errorMessage && <p style={{ color: "crimson" }}>{errorMessage}</p>}
      </form>
    </div>
  );
}
