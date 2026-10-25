import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { APP_NAME, BRAND } from "@app/brand";
import { selectAuthToken, useAppSelector } from "@platform/app/store";
import { useDropdown } from "@platform/hooks/useDropdown";
import { accessibleApps, appIdsFromToken } from "./appAccess";
import { MONTRA_APPS } from "./montraApps";

const CURRENT_APP_ID = BRAND.id;

function claimsOf(token: string | null): Record<string, unknown> | null {
  if (!token) return null;
  try {
    return jwtDecode<Record<string, unknown>>(token);
  } catch {
    return null;
  }
}

// Top-left app switcher (Atlassian style): the Montra apps this user has (JWT "apps" claim).
// `children` (the product brand) is part of the trigger, next to the grid icon.
function AppSwitcher({ children }: { children?: ReactNode }) {
  const token = useAppSelector(selectAuthToken);
  const apps = accessibleApps(
    MONTRA_APPS,
    appIdsFromToken(claimsOf(token)),
    CURRENT_APP_ID,
  );
  const { ref, isOpen, toggle, close } = useDropdown();

  return (
    <div ref={ref} className="app-switcher">
      <button
        type="button"
        className="app-switcher-trigger"
        aria-label={`${APP_NAME}: switch Montra app`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="app-switcher-panel"
        onClick={toggle}
      >
        <span className="app-switcher-grid">
          <i className="bi bi-grid-3x3-gap-fill" aria-hidden="true" />
        </span>
        {children}
      </button>

      {isOpen && (
        <div
          id="app-switcher-panel"
          className="app-switcher-panel shadow-lg"
          role="dialog"
          aria-label="Montra apps"
        >
          <div className="app-switcher-title">Switch to</div>
          <ul className="list-unstyled mb-0">
            {apps.map((app) => {
              const current = app.id === CURRENT_APP_ID;
              return (
                <li key={app.id}>
                  <a
                    href={app.url ?? undefined}
                    className={`app-switcher-item ${current ? "is-current" : ""}`}
                    aria-current={current ? "page" : undefined}
                    onClick={(e) => {
                      // Already here: just close
                      if (current) {
                        e.preventDefault();
                        close();
                      }
                    }}
                  >
                    <span className="app-switcher-icon">
                      <i className={`bi ${app.icon}`} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="d-block fw-semibold text-truncate">
                        {app.name}
                      </span>
                      <span className="d-block small text-body-secondary text-truncate">
                        {app.description}
                      </span>
                    </span>
                    {current && (
                      <span className="badge rounded-pill bg-body-tertiary text-body border ms-auto">
                        Current
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
          {apps.length === 1 && (
            <p className="app-switcher-note">
              Other Montra apps you have access to will appear here.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default AppSwitcher;
