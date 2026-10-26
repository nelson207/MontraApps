import { useTranslation } from "react-i18next";
import { IDP_CONFIG } from "../idp/idpConfig";
import { WINDOWS_LOGIN_MODE } from "../windows/windowsSignIn";
import IdpSignIn from "./IdpSignIn";
import WindowsSignIn from "./WindowsSignIn";

type Props = {
  rememberMe: boolean;
  from: string;
  /** The page was opened to say something: no automatic sign-in */
  hasNotice: boolean;
  /** The login screen's message (SignInMessage): null when an attempt starts, then why it failed */
  onMessage: (message: string | null) => void;
};

// Under the username/password form: the other ways to sign in that this environment enables
// (VITE_WINDOWS_LOGIN, VITE_IDP_*). Remember me applies to all of them.
function OtherSignInMethods({ rememberMe, from, hasNotice, onMessage }: Props) {
  const { t } = useTranslation("auth");
  if (WINDOWS_LOGIN_MODE === "off" && !IDP_CONFIG) return null;
  return (
    <div className="mt-3">
      <div className="d-flex align-items-center gap-2 my-3 text-body-secondary small" aria-hidden="true">
        <hr className="flex-grow-1 my-0" />
        {t("login.or")}
        <hr className="flex-grow-1 my-0" />
      </div>
      <div className="d-flex flex-column gap-2">
        <WindowsSignIn rememberMe={rememberMe} hasNotice={hasNotice} onMessage={onMessage} />
        <IdpSignIn rememberMe={rememberMe} from={from} onMessage={onMessage} />
      </div>
    </div>
  );
}

export default OtherSignInMethods;
