import { useState } from "react";
import { useTranslation } from "react-i18next";
import Tooltip from "@platform/components/ui/Tooltip";
import { useDropdown } from "@platform/hooks/useDropdown";
import {
  HIERARCHY_LEVELS,
  isComplete,
  type ContextSelection,
  type WorkProfile,
} from "../hierarchy";
import { useWorkContext } from "../hooks/useWorkContext";
import HierarchySelects from "./HierarchySelects";
import { useWorkContextTexts } from "../useWorkContextTexts";

type PanelProps = {
  profile: WorkProfile;
  selection: ContextSelection;
  isSample: boolean;
  onApply: (next: ContextSelection) => void;
  onClose: () => void;
};

// Mounted only while the menu is open, so the draft starts from the current context each time.
// No "Apply": as soon as a change completes the context (the vendor is picked, or filled in
// because it's the only one), it's applied and the menu closes. Closing earlier (Esc, a click
// outside) keeps the context as it was.
function WorkContextPanel({ profile, selection, isSample, onApply, onClose }: PanelProps) {
  const { t } = useTranslation("workContext");
  const texts = useWorkContextTexts();
  const [draft, setDraft] = useState<ContextSelection>(selection);
  const isSupervisor = profile.role === "supervisor";

  const change = (next: ContextSelection) => {
    setDraft(next);
    if (isComplete(next)) {
      onApply(next);
      onClose();
    }
  };

  return (
    <div className="p-3">
      <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
        <h6 className="mb-0 fw-semibold">{t("title")}</h6>
        {isSample && (
          <span
            className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border"
            title={t("sampleTitle")}
          >
            {t("sample")}
          </span>
        )}
      </div>
      <p className="small text-body-secondary mb-3">
        {texts.purpose}
        {!isSupervisor && ` ${t("memberNote", { role: texts.memberRole })}`}
      </p>

      <HierarchySelects value={draft} profile={profile} onChange={change} idPrefix="work-context" />

      {isSupervisor && (
        <p className="small text-body-secondary mb-0">
          <i className="bi bi-info-circle me-1" aria-hidden="true" />
          {t("onBehalf", { member: texts.name("member") })}
        </p>
      )}
    </div>
  );
}

// Top bar: shows who you're acting as, and lets you change it.
function WorkContextMenu() {
  const { t } = useTranslation("workContext");
  const texts = useWorkContextTexts();
  const { profile, selection, isImpersonating, isSample, isError, setSelection } = useWorkContext();
  const { ref, isOpen, toggle, close } = useDropdown();

  // Don't silently disappear: say why the context can't be chosen
  if (isError) {
    return (
      <button
        type="button"
        className="app-topbar-btn gap-2 px-2 text-warning-emphasis"
        disabled
        title={t("unavailableTitle", { levels: HIERARCHY_LEVELS.map(texts.name).join(" / ") })}
        aria-label={t("unavailableLabel")}
      >
        <i className="bi bi-exclamation-triangle fs-5" />
        <span className="d-none d-lg-inline small">{t("unavailable")}</span>
      </button>
    );
  }

  if (!profile || !selection) return null; // still loading

  // Full names on hover: the button has a fixed width and trims them
  const details = HIERARCHY_LEVELS.map((level) =>
    t("detail", { level: texts.label(level), name: selection[level]?.name ?? t("notChosen") }),
  ).join("\n");
  // Levels with several options start empty: ask for the first one missing
  const missing = HIERARCHY_LEVELS.find((level) => !selection[level]);

  return (
    <div ref={ref} className="dropdown">
      <Tooltip text={details} placement="bottom" enabled={!isOpen} className="d-block">
        <button
          type="button"
          className={`app-topbar-btn app-context-btn gap-2 px-2 ${isImpersonating ? "is-impersonating" : ""}`}
          aria-label={
            isComplete(selection)
              ? t("label", { member: selection.member.name, unit: selection.unit.name, organization: selection.organization.name })
              : t("labelNotChosen")
          }
          aria-expanded={isOpen}
          onClick={toggle}
        >
          <i
            className={`bi ${isImpersonating ? "bi-person-badge" : missing ? "bi-diagram-3 text-warning-emphasis" : "bi-diagram-3"} fs-5`}
          />
          <span className="d-none d-lg-block text-start lh-sm app-context-text">
            {!isComplete(selection) ? (
              <>
                <span className="d-block small fw-semibold text-truncate">{t("title")}</span>
                <span className="d-block small text-warning-emphasis text-truncate">
                  {t("choose", { level: texts.name(missing ?? "member") })}
                </span>
              </>
            ) : (
              <>
                <span className="d-block small fw-semibold text-truncate">
                  {isImpersonating ? t("actingAs", { name: selection.member.name }) : selection.unit.name}
                </span>
                <span className="d-block small text-body-secondary text-truncate">
                  {isImpersonating
                    ? `${selection.unit.name} · ${selection.organization.name}`
                    : selection.organization.name}
                </span>
              </>
            )}
          </span>
          <i className="bi bi-chevron-down small d-none d-lg-inline" />
        </button>
      </Tooltip>

      <div
        className={`dropdown-menu dropdown-menu-end shadow border-0 p-0 app-context-menu ${isOpen ? "show" : ""}`}
        data-bs-popper="static"
      >
        {isOpen && (
          <WorkContextPanel
            profile={profile}
            selection={selection}
            isSample={isSample}
            onApply={setSelection}
            onClose={close}
          />
        )}
      </div>
    </div>
  );
}

export default WorkContextMenu;
