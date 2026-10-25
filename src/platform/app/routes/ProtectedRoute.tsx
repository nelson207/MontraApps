import { Navigate, Outlet, useLocation } from "react-router-dom";
import SessionRestoring from "@platform/features/auth/components/SessionRestoring";
import { selectIsAuthenticated, selectIsRestoringSession, useAppSelector } from "../store";

export default function ProtectedRoute() {
  const isAuthed = useAppSelector(selectIsAuthenticated);
  const isRestoring = useAppSelector(selectIsRestoringSession);
  const location = useLocation();

  if (isRestoring) return <SessionRestoring />;

  if (!isAuthed) {
    // send them to login, remember where they were trying to go
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
