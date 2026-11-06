import { selectCredoper, useAppDispatch, useAppSelector } from "@credit/store";
import type { DraftLegalDoc } from "@platform/api/legacy/legacyApi";
import InputField from "@platform/components/ui/InputField";
import SelectField from "@platform/components/ui/SelectField";
import { newId } from "@platform/utils/newId";
import { optionLabel, useCountryOptions, useLegalDocTypes } from "../../hooks/useEntityOptions";
import type { InterventionFormProps } from "../../types/credoperTypes";
import { setInterventionDetailField } from "../../utils/fieldSetters";
import { toLocalDate } from "../../validation/localDate";
import LazySelectField from "./LazySelectField";

// The entity's legal documents: those it has are shown only (they can't be changed from here), new
// ones can be added. The NIF isn't asked for (the API creates it from entity.vatNumber), and which
// one is the main document is the API's to decide.
export default function InterventionLegalDocForm({ index = 0, intervention, errors }: InterventionFormProps) {
  const dispatch = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);
  const types = useLegalDocTypes();
  const { options: countries, isLoading: loadingCountries } = useCountryOptions();
  const documents = intervention?.entity?.documents ?? [];

  const setDocuments = (next: DraftLegalDoc[]) => setInterventionDetailField(dispatch, credoper, index, "entity", "documents", next);
  const updateDocument = (position: number, patch: Partial<DraftLegalDoc>) =>
    setDocuments(documents.map((document, i) => (i === position ? { ...document, ...patch } : document)));

  const typeName = (document: DraftLegalDoc) => {
    const type = types.items.find((item) => item.id === document.legalDocTypeId);
    return document.documentName?.trim() || document.typeLabel || (type ? optionLabel(type) : "Legal document");
  };
  const onFile = documents.some((document) => document.id);

  return (
    <div className="mb-3">
      <h6 className="border-bottom pb-2">Legal documents</h6>

      {documents.length === 0 && <p className="text-body-secondary small">No legal documents added.</p>}

      {onFile && (
        <ul className="list-unstyled mb-3">
          {documents.map(
            (document) =>
              document.id && (
                <li key={document.id} className="d-flex flex-wrap align-items-baseline gap-2 border rounded-2 px-3 py-2 mb-2">
                  <span className="fw-medium">{typeName(document)}</span>
                  {document.legalDocNumber && <span>{document.legalDocNumber}</span>}
                  {document.validDate && <small className="text-body-secondary ms-auto">Valid until {toLocalDate(document.validDate)}</small>}
                </li>
              ),
          )}
        </ul>
      )}

      {documents.map((document, position) => {
        if (document.id) return null;
        const prefix = `interventions.${intervention?.correlationID}.entity.documents.${position}`;
        const fieldId = (field: string) => `intervention-${index}-document-${position}-${field}`;
        return (
          <div className="border rounded-2 p-3 mb-3" key={document.correlationID ?? position}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-medium">New document</span>
              <button
                type="button"
                className="btn btn-sm btn-ghost text-danger"
                aria-label="Remove this new document"
                onClick={() => setDocuments(documents.filter((_, i) => i !== position))}
              >
                <i className="bi bi-trash" aria-hidden="true" />
              </button>
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <LazySelectField
                  id={fieldId("type")}
                  label="Document type"
                  required
                  invalidMessage={errors?.[`${prefix}.legalDocTypeId`]}
                  value={document.legalDocTypeId}
                  list={types}
                  selectedLabel={document.typeLabel}
                  onPick={(type, label) => updateDocument(position, { legalDocTypeId: type.id, typeLabel: label })}
                />
              </div>
              <div className="col-md-4">
                <InputField
                  id={fieldId("number")}
                  label="Document number"
                  value={document.legalDocNumber ?? ""}
                  onChange={(e) => updateDocument(position, { legalDocNumber: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <SelectField
                  id={fieldId("country")}
                  label="Country"
                  isLoading={loadingCountries}
                  value={document.countryId ?? ""}
                  options={countries}
                  onChange={(e) => updateDocument(position, { countryId: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <InputField
                  id={fieldId("issue")}
                  label="Issue date"
                  type="date"
                  value={toLocalDate(document.issueDate) ?? ""}
                  onChange={(e) => updateDocument(position, { issueDate: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <InputField
                  id={fieldId("expiration")}
                  label="Expiry date"
                  type="date"
                  invalidMessage={errors?.[`${prefix}.validDate`]}
                  value={toLocalDate(document.validDate) ?? ""}
                  onChange={(e) => updateDocument(position, { validDate: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <InputField id={fieldId("issued-by")} label="Issued by" value={document.issuedBy ?? ""} onChange={(e) => updateDocument(position, { issuedBy: e.target.value })} />
              </div>
            </div>
          </div>
        );
      })}

      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setDocuments([...documents, { correlationID: newId(), legalDocTypeId: null }])}>
        <i className="bi bi-plus-lg me-1" aria-hidden="true" />
        Add legal document
      </button>
    </div>
  );
}
