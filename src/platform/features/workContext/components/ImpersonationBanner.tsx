import { Trans, useTranslation } from "react-i18next";
import { isComplete } from "../hierarchy";
import { useWorkContext } from "../hooks/useWorkContext";
import { useWorkContextTexts } from "../useWorkContextTexts";

// Visible on every page while a supervisor is acting as another member.
function ImpersonationBanner() {
  const { t } = useTranslation("workContext");
  const texts = useWorkContextTexts();
  const { selection, isImpersonating, canActAsMyself, actAsMyself } = useWorkContext();
  if (!isImpersonating || !selection || !isComplete(selection)) return null;

  return (
    <div className="alert alert-warning d-flex flex-wrap align-items-center gap-2 py-2 mb-3" role="status">
      <i className="bi bi-person-badge fs-5" />
      <span className="flex-grow-1 small">
        <Trans
          t={t}
          i18nKey="banner"
          values={{
            member: selection.member.name,
            unit: selection.unit.name,
            organization: selection.organization.name,
            note: texts.impersonationNote,
          }}
          components={{ strong: <strong /> }}
        />
      </span>
      {/* Only when the user has their own node on this supplier (otherwise they pick it in the menu) */}
      {canActAsMyself && (
        <button type="button" className="btn btn-sm btn-outline-dark" onClick={actAsMyself}>
          {t("actAsMyself")}
        </button>
      )}
    </div>
  );
}

export default ImpersonationBanner;
