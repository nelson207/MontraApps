import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { APP_SETTINGS } from "@app/appSettings";
import { selectIsAuthenticated, selectIsRestoringSession, useAppDispatch, useAppSelector } from "@platform/app/store";
import { MontraPOSApi, type MontraAplApplications } from "@platform/api/generated/MontraPOSApi";
import {
  AUTO_ATTEMPT_TIMEOUT_MS,
  isAutomaticWindowsSignInPaused,
  pauseAutomaticWindowsSignIn,
  resumeAutomaticWindowsSignIn,
  shouldTryAutomatically,
  WINDOWS_LOGIN_MODE,
  windowsSignInFailure,
} from "../windows/windowsSignIn";

type Props = {
  /** The login form's "Remember me" (a manual Windows sign-in honours it; an automatic one never) */
  rememberMe: boolean;
  /** The page was opened to say something (session expired, failed sign-in): no automatic attempt */
  hasNotice: boolean;
  /** The login screen's message (SignInMessage): null when an attempt starts, then why it failed */
  onMessage: (message: string | null) => void;
};

type Attempt = { status: "idle" | "trying"; automatic: boolean };

const IDLE: Attempt = { status: "idle", automatic: false };

// "Sign in with Windows" (VITE_WINDOWS_LOGIN=button|auto) and, in auto mode, one automatic attempt
// when the login page opens. The browser proves the Windows identity to the API; this sends no
// username, only the app and Remember me (see windows/windowsSignIn.ts).
function WindowsSignIn({ rememberMe, hasNotice, onMessage }: Props) {
  const { t } = useTranslation("auth");
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isRestoring = useAppSelector(selectIsRestoringSession);
  const [attempt, setAttempt] = useState<Attempt>(IDLE);
  const request = useRef<{ abort: () => void } | null>(null);
  const cancelled = useRef(false);
  const autoDecided = useRef(false);

  // In auto mode, decide once (when no session is being restored) whether to try by itself
  const [autoStarted, setAutoStarted] = useState(false);
  const wantsAuto =
    !autoStarted &&
    shouldTryAutomatically({
      mode: WINDOWS_LOGIN_MODE,
      paused: isAutomaticWindowsSignInPaused(),
      hasNotice,
      isAuthenticated,
      isRestoring,
    });
  if (wantsAuto) {
    setAutoStarted(true);
    setAttempt({ status: "trying", automatic: true });
  }

  const send = (automatic: boolean) => {
    cancelled.current = false;
    onMessage(null);
    const pending = dispatch(
      MontraPOSApi.endpoints.postApiAuthLoginWindows.initiate(
        {
          windowsLoginRequest: {
            montraAplApplication: APP_SETTINGS.identifier as MontraAplApplications,
            // An automatic sign-in lasts until the browser closes, whatever the checkbox says
            rememberMe: automatic ? false : rememberMe,
          },
        },
        { track: false },
      ),
    );
    request.current = pending;
    // A Windows handshake that hangs (no domain, a prompt the browser keeps open): give up
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      pending.abort();
    }, AUTO_ATTEMPT_TIMEOUT_MS);

    pending
      .unwrap()
      // Signed in (the login page goes on to the app); automatic sign-in is welcome again
      .then(() => resumeAutomaticWindowsSignIn())
      .catch((error: unknown) => {
        if (cancelled.current) return;
        const failure = timedOut ? { status: "TIMEOUT_ERROR" } : error;
        setAttempt({ status: "idle", automatic });
        const message = windowsSignInFailure(failure, automatic);
        if (message) onMessage(message);
      })
      .finally(() => {
        clearTimeout(timer);
        request.current = null;
      });
  };

  // The automatic attempt, once it was decided (sending is the effect's only job)
  useEffect(() => {
    if (!autoStarted || autoDecided.current) return;
    autoDecided.current = true;
    send(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once
  }, [autoStarted]);

  if (WINDOWS_LOGIN_MODE === "off") return null;

  const signInManually = () => {
    setAttempt({ status: "trying", automatic: false });
    send(false);
  };

  /** "Use another account": stop, and don't try by itself again until someone chooses Windows */
  const useAnotherAccount = () => {
    cancelled.current = true;
    request.current?.abort();
    pauseAutomaticWindowsSignIn();
    setAttempt(IDLE);
  };

  if (attempt.status === "trying" && attempt.automatic) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2 py-2 small mb-0" role="status">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        <span className="flex-grow-1">{t("windows.signingIn")}</span>
        <button type="button" className="btn btn-link btn-sm p-0" onClick={useAnotherAccount}>
          {t("windows.useAnotherAccount")}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-outline-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
      disabled={attempt.status === "trying"}
      onClick={signInManually}
    >
      {attempt.status === "trying" ? (
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      ) : (
        <i className="bi bi-windows" aria-hidden="true" />
      )}
      {t("windows.signIn")}
    </button>
  );
}

export default WindowsSignIn;
