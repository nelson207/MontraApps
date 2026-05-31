import { Navigate, Outlet, useLocation } from "react-router-dom";
import { selectIsAuthenticated, useAppSelector } from "../store";

export default function ProtectedRoute() {
  const isAuthed = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthed) {
    // send them to login, remember where they were trying to go
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
