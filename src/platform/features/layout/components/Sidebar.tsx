import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useMenuText, useModuleLabel } from "../hooks/useModuleLabel";
import { MENU_GROUPS } from "@app/modules";
import type { AppModule } from "@platform/app/contract";
import { useAppDispatch, useAppSelector } from "@platform/app/store";
import Tooltip from "@platform/components/ui/Tooltip";
import {
  DESKTOP_MEDIA_QUERY,
  useMediaQuery,
} from "@platform/hooks/useMediaQuery";
import {
  closeMobileSidebar,
  selectMobileSidebarOpen,
  selectSidebarCollapsed,
  toggleSidebarCollapsed,
} from "../layoutSlice";
import { SIDEBAR_ID } from "../constants";
import AppSwitcher from "@platform/features/appSwitcher/AppSwitcher";
import BrandLogo from "@platform/components/brand/BrandLogo";
import { useCanManageUsers } from "@platform/features/users/useCanManageUsers";

function SidebarLink({
  module,
  showTooltip,
}: {
  module: AppModule;
  showTooltip: boolean;
}) {
  const label = useModuleLabel()(module);
  const link = (
    <NavLink
      to={module.path}
      className="app-sidebar-link"
      aria-label={label}
    >
      <i className={`bi ${module.icon} app-sidebar-icon`} aria-hidden="true" />
      <span className="app-sidebar-label">{label}</span>
    </NavLink>
  );

  return showTooltip ? (
    <Tooltip text={label} className="d-block">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

function Sidebar() {
  const { t } = useTranslation("layout");
  const { sectionLabel } = useMenuText();
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(selectSidebarCollapsed);
  const mobileOpen = useAppSelector(selectMobileSidebarOpen);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);

  // Labels are hidden only on the collapsed desktop rail
  const showTooltips = collapsed && isDesktop;
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
        {/* The whole brand opens the app switcher (Home is in the menu) */}
        <AppSwitcher>
          <BrandLogo size="sm" className="app-sidebar-label" />
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
                  <SidebarLink module={module} showTooltip={showTooltips} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="app-sidebar-footer d-none d-lg-block">
        <button
          type="button"
          className="app-sidebar-link"
          aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          aria-controls={SIDEBAR_ID}
          aria-expanded={!collapsed}
          onClick={() => dispatch(toggleSidebarCollapsed())}
        >
          <i
            className={`bi ${collapsed ? "bi-chevron-double-right" : "bi-chevron-double-left"} app-sidebar-icon`}
            aria-hidden="true"
          />
          <span className="app-sidebar-label">{t("collapse")}</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
