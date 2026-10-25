import { useTranslation } from "react-i18next";
import { useAppDispatch } from "@platform/app/store";
import { setAuth } from "../authSlice";
import { DEMO_USER, demoToken } from "../demoSession";

// DEVELOPMENT ONLY (rendered under import.meta.env.DEV): sign in without the backend, as a demo
// user with access to every Montra app. The login page then moves on as after a real sign-in.
function DemoAccess() {
  const { t } = useTranslation("auth");
  const dispatch = useAppDispatch();

  return (
    <div className="app-demo-access mt-4">
      <div className="d-flex align-items-center gap-2 small text-body-secondary mb-2">
        <i className="bi bi-cone-striped" aria-hidden="true" />
        {t("demo.developmentOnly")}
      </div>
      <button
        type="button"
        className="btn btn-outline-secondary w-100"
        onClick={() => dispatch(setAuth({ accessToken: demoToken(), userId: DEMO_USER }))}
      >
        <i className="bi bi-person-badge me-2" aria-hidden="true" />
        {t("demo.access")}
      </button>
    </div>
  );
}

export default DemoAccess;
