import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import LanguageSwitch from "@platform/i18n/LanguageSwitch";
import LogoutButton from "@platform/features/auth/components/LogoutButton";
import { useCurrentUser } from "@platform/features/auth/hooks/useCurrentUser";
import { useDropdown } from "@platform/hooks/useDropdown";
import ThemeModeSwitch from "@platform/features/theme/components/ThemeModeSwitch";
import { useIsAdministrator } from "@platform/features/appSettings/useIsAdministrator";

function UserMenu() {
  const { t } = useTranslation("layout");
  const { name, initials } = useCurrentUser();
  const isAdmin = useIsAdministrator();
  const { ref, isOpen, toggle, close } = useDropdown();

  return (
    <div ref={ref} className="dropdown">
      <button
        type="button"
        className="app-topbar-btn d-flex align-items-center gap-2 px-1 px-sm-2"
        aria-label={isAdmin ? t("userMenu.labelAdministrator") : t("userMenu.label")}
        aria-expanded={isOpen}
        onClick={toggle}
      >
        <span className="app-avatar position-relative">
          {initials}
          {isAdmin && (
            <span className="app-avatar-admin" title={t("userMenu.administrator")} aria-hidden="true">
              A
            </span>
          )}
        </span>
        <span className="d-none d-md-block text-start lh-sm">
          <span className="d-block small fw-semibold">{name}</span>
          <span className="d-block small text-body-secondary">{t("userMenu.myAccount")}</span>
        </span>
        <i className="bi bi-chevron-down small d-none d-md-inline" />
      </button>

      <div
        className={`dropdown-menu dropdown-menu-end shadow border-0 app-user-menu ${isOpen ? "show" : ""}`}
        data-bs-popper="static"
        onClick={close}
      >
        {/* Appearance and language: stays open while switching, so the change is seen */}
        <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
          <div className="small text-body-secondary mb-1">{t("userMenu.appearance")}</div>
          <ThemeModeSwitch compact />
          <div className="small text-body-secondary mb-1 mt-2">{t("userMenu.language")}</div>
          <LanguageSwitch compact label={t("userMenu.language")} />
        </div>
        <hr className="dropdown-divider" />
        <NavLink to="/settings" className="dropdown-item">
          <i className="bi bi-gear me-2" />
          {t("userMenu.settings")}
        </NavLink>
        <NavLink to="/notifications" className="dropdown-item">
          <i className="bi bi-bell me-2" />
          {t("userMenu.notifications")}
        </NavLink>
        <hr className="dropdown-divider" />
        <LogoutButton className="dropdown-item text-danger" />
      </div>
    </div>
  );
}

export default UserMenu;
