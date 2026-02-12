import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { usePostApiAuthLoginMutation } from "../../router/apis/ArNextAPI";
import { selectIsAuthenticated } from "../../router/reducers/auth/authSlice";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Alert from "react-bootstrap/Alert";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthed = useSelector(selectIsAuthenticated);
  const [login, { isLoading, error }] = usePostApiAuthLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isAuthed) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthed, location.state, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      await login({ loginRequest: { email, password } }).unwrap();
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  // RTK Query error format can vary; this makes it readable
  const errorMessage =
    error?.data?.message || error?.error || error?.message || null;

  return (
    <>
      <div className="account-pages my-5 pt-sm-5">
        <h2>Login</h2>

        <Form onSubmit={onSubmit}>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <FloatingLabel
              controlId="floatingEmail"
              label="Email address"
              className="mb-3"
            >
              <Form.Control
                required
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Form.Text className="text-muted">
                We'll never share your email.
              </Form.Text>
            </FloatingLabel>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicPassword">
            <FloatingLabel
              controlId="floatingPassword"
              label="Password"
              className="mb-3"
            >
              <Form.Control
                required
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FloatingLabel>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Remember me"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
          </Form.Group>

          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </Form>
      </div>
      {errorMessage && (
        <Alert variant="danger" className="mb-3">
          {errorMessage}
        </Alert>
      )}
    </>
  );
}

export default Login;
