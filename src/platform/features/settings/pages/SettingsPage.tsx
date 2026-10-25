import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import ProfileSettings from "@platform/features/account/components/ProfileSettings";
import ChangePasswordSettings from "@platform/features/auth/components/ChangePasswordSettings";
import TwoFactorSettings from "@platform/features/auth/components/TwoFactorSettings";
import ThemeSettings from "@platform/features/theme/components/ThemeSettings";
import ApplicationSettings from "@platform/features/appSettings/components/ApplicationSettings";
import { useIsAdministrator } from "@platform/features/appSettings/useIsAdministrator";

// Tabs are driven by the URL hash so sections can be linked to,
// e.g. /settings#security from a notification.
const TABS = [
  { id: "account", icon: "bi-person" },
  { id: "security", icon: "bi-shield-lock" },
  { id: "appearance", icon: "bi-palette" },
  // Administrators only
  { id: "application", icon: "bi-sliders" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function SettingsPage() {
  const { t } = useTranslation("settings");
  const { hash } = useLocation();
  const isAdmin = useIsAdministrator();
  const tabs = TABS.filter((tab) => tab.id !== "application" || isAdmin);
  const activeTab: TabId =
    tabs.find((tab) => `#${tab.id}` === hash)?.id ?? "account";

  return (
    <div className="d-flex flex-column gap-4 app-settings">
      <ul className="nav nav-pills flex-nowrap overflow-x-auto gap-1" role="tablist">
        {tabs.map((tab) => (
          <li className="nav-item flex-shrink-0" key={tab.id} role="presentation">
            <Link
              to={{ hash: tab.id }}
              replace
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
            >
              <i className={`bi ${tab.icon} me-2`} />
              {t(`tabs.${tab.id}`)}
            </Link>
          </li>
        ))}
      </ul>

      <div role="tabpanel">
        {activeTab === "account" && <ProfileSettings />}
        {activeTab === "security" && (
          <div className="d-flex flex-column gap-4">
            <ChangePasswordSettings />
            <TwoFactorSettings />
          </div>
        )}
        {activeTab === "appearance" && <ThemeSettings />}
        {activeTab === "application" && <ApplicationSettings />}
      </div>
    </div>
  );
}

export default SettingsPage;
