import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { selectIsAuthenticated } from "../reducers/auth/authSlice";

export default function ProtectedRoute() {
  const isAuthed = useSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthed) {
    // send them to login, remember where they were trying to go
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
