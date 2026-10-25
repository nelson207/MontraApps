import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { APP_SETTINGS } from "@app/appSettings";
import { useAppDispatch } from "@platform/app/store";
import { MontraPOSApi, type MontraAplApplications } from "@platform/api/generated/MontraPOSApi";
import { setRememberMe } from "../authSlice";
import { finishIdpSignIn } from "../idp/idpClient";
import { idpCallbackFailure, idpLoginFailure, type IdpFailure } from "../idp/idpErrors";

/** Why the login page was opened after a failed Keycloak sign-in (React Router location state) */
export type IdpLoginNavState = { idpFailure?: IdpFailure };

// Keycloak sends the user back here (IDP_CALLBACK_PATH) with an authorization code:
// 1. finish the code exchange (PKCE) → Keycloak's access token (not the ID token)
// 2. POST /api/auth/login/idp → a MontraAPI session, handled like a password login
//    (authSlice: access token in memory, montra_rt refresh cookie set by the API)
// 3. forget Keycloak's token: it's never stored, nor sent anywhere else
// Any failure goes back to the login page with a message.
function AuthCallbackPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  // The code can only be redeemed once (StrictMode runs effects twice in development)
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const fail = (idpFailure: IdpFailure) =>
      navigate("/login", { replace: true, state: { idpFailure } satisfies IdpLoginNavState });

    (async () => {
      let signIn: Awaited<ReturnType<typeof finishIdpSignIn>>;
      try {
        signIn = await finishIdpSignIn();
      } catch (error) {
        return fail(idpCallbackFailure(error));
      }

      const { rememberMe, from } = signIn.state;
      dispatch(setRememberMe(rememberMe));
      try {
        // Not tracked: the request (with Keycloak's token) isn't kept in the API cache
        await dispatch(
          MontraPOSApi.endpoints.postApiAuthLoginIdp.initiate(
            {
              idpLoginRequest: {
                token: signIn.accessToken,
                montraAplApplication: APP_SETTINGS.identifier as MontraAplApplications,
                rememberMe,
              },
            },
            { track: false },
          ),
        ).unwrap();
      } catch (error) {
        return fail(idpLoginFailure(error));
      }
      navigate(from, { replace: true });
    })();
  }, [dispatch, navigate]);

  return (
    <div className="d-flex min-vh-100 align-items-center justify-content-center bg-body" role="status">
      <span className="spinner-border spinner-border-sm text-primary me-2" aria-hidden="true" />
      <span className="text-body-secondary small">Signing you in…</span>
    </div>
  );
}

export default AuthCallbackPage;
