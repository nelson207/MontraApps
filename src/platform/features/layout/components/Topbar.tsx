import { useTranslation } from "react-i18next";
import { useAppDispatch } from "@platform/app/store";
import { useModuleLabel } from "../hooks/useModuleLabel";
import { openMobileSidebar } from "../layoutSlice";
import { useCurrentModule } from "../hooks/useCurrentModule";
import NotificationsMenu from "./NotificationsMenu";
import { SIDEBAR_ID } from "../constants";
import UserMenu from "./UserMenu";
import { TopbarExtras } from "@app/shell";

function Topbar() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation("layout");
  const currentModule = useCurrentModule();
  const moduleLabel = useModuleLabel();

  return (
    <header className="app-topbar">
      <button
        type="button"
        className="app-topbar-btn d-lg-none"
        aria-label={t("openMenu")}
        aria-controls={SIDEBAR_ID}
        onClick={() => dispatch(openMobileSidebar())}
      >
        <i className="bi bi-list fs-4" />
      </button>

      <div className="d-flex align-items-center gap-2 overflow-hidden">
        {currentModule && (
          <span className="app-topbar-module-icon d-none d-sm-inline-flex">
            <i className={`bi ${currentModule.icon}`} />
          </span>
        )}
        <h1 className="h5 fw-semibold mb-0 text-truncate">
          {currentModule ? moduleLabel(currentModule) : "Montra"}
        </h1>
      </div>

      <div className="ms-auto d-flex align-items-center gap-1 gap-sm-2">
        <NotificationsMenu />
        {/* The app's: e.g. the working context menu */}
        <TopbarExtras />
        <div className="vr d-none d-sm-block my-2" />
        <UserMenu />
      </div>
    </header>
  );
}

export default Topbar;
