import type { MissingField } from "../model/interventionRequired";

export type SectionStatus = { id: number; label: string; status: string; tone: "done" | "todo" | "optional" };

type Props = {
  missing: MissingField[];
  sections: SectionStatus[];
  onOpenField: (field: MissingField) => void;
  onOpenSection: (id: number) => void;
};

// Beside the person's form, as the calculation is beside Financial data: what's still needed to
// save (each one opens its tab, at its field) and how each tab stands.
function InterventionSummaryPanel({ missing, sections, onOpenField, onOpenSection }: Props) {
  return (
    <aside className="border rounded-3 p-3 app-summary-panel" aria-label="Summary of this person">
      {missing.length > 0 ? (
        <>
          <div className="h3 fw-bold mb-0">{missing.length}</div>
          <div className="fw-semibold">{missing.length === 1 ? "field" : "fields"} needed to save</div>
          <ul className="list-unstyled small mt-2 mb-0">
            {missing.map((field) => (
              <li key={field.key} className="border-top">
                <button type="button" className="btn btn-link btn-sm text-start w-100 px-0" onClick={() => onOpenField(field)}>
                  {field.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="fw-semibold text-success-emphasis">
          <i className="bi bi-check-circle me-2" aria-hidden="true" />
          Nothing missing to save
        </div>
      )}

      <ul className="list-unstyled small mt-3 mb-0">
        {sections.map((section) => (
          <li key={section.id} className="border-top">
            <button type="button" className="btn btn-sm d-flex justify-content-between gap-2 w-100 px-0 text-body" onClick={() => onOpenSection(section.id)}>
              <span>{section.label}</span>
              <span className={section.tone === "done" ? "text-success-emphasis" : section.tone === "todo" ? "text-warning-emphasis" : "text-body-secondary"}>{section.status}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default InterventionSummaryPanel;
