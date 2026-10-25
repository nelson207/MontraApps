import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useMenuText, useModuleLabel } from "../hooks/useModuleLabel";
import { APP_MODULES, MENU_GROUPS } from "@app/modules";
import { BRAND } from "@app/brand";
import type { AppModule } from "@platform/app/contract";
import { useAppDispatch, useAppSelector } from "@platform/app/store";
import { closeMobileSidebar, selectMobileSidebarOpen } from "../layoutSlice";
import { SIDEBAR_ID } from "../constants";
import AppSwitcher from "@platform/features/appSwitcher/AppSwitcher";
import BrandLogo from "@platform/components/brand/BrandLogo";
import { useCanManageUsers } from "@platform/features/users/useCanManageUsers";

// Settings sits apart, at the bottom of the menu (when the app offers it)
const SETTINGS_MODULE = APP_MODULES.find((module) => module.path === "/settings");

function SidebarLink({ module }: { module: AppModule }) {
  const label = useModuleLabel()(module);
  return (
    <NavLink to={module.path} className="app-sidebar-link">
      <span className="app-sidebar-icon" aria-hidden="true">
        <i className={`bi ${module.icon}`} />
      </span>
      <span className="app-sidebar-label">{label}</span>
    </NavLink>
  );
}

// Desktop: a slim rail, each module's icon over its name. Mobile: the same menu as a drawer.
function Sidebar() {
  const { t } = useTranslation("layout");
  const { sectionLabel } = useMenuText();
  const dispatch = useAppDispatch();
  const mobileOpen = useAppSelector(selectMobileSidebarOpen);

  // Modules that need an access are listed once it's known the user has it
  const canManageUsers = useCanManageUsers();
  const groups = MENU_GROUPS.map((group) => ({
    ...group,
    modules: group.modules.filter((module) => module.access !== "manageUsers" || canManageUsers === true),
  })).filter((group) => group.modules.length > 0);

  return (
    <aside
      id={SIDEBAR_ID}
      className={`app-sidebar ${mobileOpen ? "is-open" : ""}`}
      aria-label={t("mainNavigation")}
    >
      <div className="app-sidebar-brand">
        {/* The brand opens the app switcher (Home is in the menu): the mark on the rail,
            grid icon + wordmark in the drawer */}
        <AppSwitcher>
          <span className="app-rail-mark" aria-hidden="true">
            {BRAND.mark}
          </span>
          <BrandLogo size="sm" />
        </AppSwitcher>

        <button
          type="button"
          className="app-sidebar-icon-btn ms-auto d-lg-none"
          aria-label={t("closeMenu")}
          onClick={() => dispatch(closeMobileSidebar())}
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <nav className="app-sidebar-nav">
        {groups.map(({ section, modules }) => (
          <div key={section} className="app-sidebar-group">
            <div className="app-sidebar-section">{sectionLabel(section)}</div>
            <ul className="list-unstyled d-flex flex-column gap-1 mb-0">
              {modules.map((module) => (
                <li key={module.path}>
                  <SidebarLink module={module} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {SETTINGS_MODULE && (
        <div className="app-sidebar-footer">
          <SidebarLink module={SETTINGS_MODULE} />
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
