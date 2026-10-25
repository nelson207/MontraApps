import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { emptySplitApi } from "@platform/api/emptyApi";
import { useAppDispatch, useAppSelector } from "@platform/app/store";
import { acknowledgeSessionExpired } from "./authSlice";

/** Why the login page was opened (React Router location state) */
export type LoginNavState = { reason?: "sessionExpired"; from?: { pathname: string } };

/**
 * After the API answers ErrorCode ErrInvalidSessionToken (the token is already removed, see
 * authSlice): drop the old session's cached data and go back to the login page, remembering
 * where the user was. Mounted once, in App.
 */
export function useSessionExpiredRedirect() {
  const expired = useAppSelector((state) => state.auth.sessionExpired);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!expired) return;
    dispatch(acknowledgeSessionExpired());
    dispatch(emptySplitApi.util.resetApiState());
    if (location.pathname !== "/login") {
      navigate("/login", {
        replace: true,
        state: { reason: "sessionExpired", from: { pathname: location.pathname } } satisfies LoginNavState,
      });
    }
  }, [expired, dispatch, navigate, location.pathname]);
}
