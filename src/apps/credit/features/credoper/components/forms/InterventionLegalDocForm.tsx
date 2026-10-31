import {
  selectCredoper,
  useAppDispatch,
  useAppSelector,
} from "@credit/store";
import InputField from "@platform/components/ui/InputField";
import { toLocalDate } from "../../validation/localDate";
import SelectField from "@platform/components/ui/SelectField";
import type { InterventionFormProps } from "../../types/credoperTypes";
import { setInterventionDetailField } from "../../utils/fieldSetters";
import type { EntityLegalDocDto } from "@platform/api/legacy/legacyApi";
import { LEGAL_DOCUMENT_TYPES } from "../../model/legalDocumentTypes";
import { newId } from "@platform/utils/newId";

export default function InterventionLegalDocForm({
  index,
  intervention,
  errors,
}: InterventionFormProps) {
  const dispatchCredOper = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);
  const legalDocs = intervention?.entity?.legalDocs ?? [];

  const setLegalDocs = (documents: EntityLegalDocDto[]) =>
    setInterventionDetailField(
      dispatchCredOper,
      credoper,
      index ?? 0,
      "entity",
      "legalDocs",
      documents,
    );

  const updateLegalDoc = (documentIndex: number, patch: Partial<EntityLegalDocDto>) => {
    const documents = [...legalDocs];
    documents[documentIndex] = { ...documents[documentIndex], ...patch };
    setLegalDocs(documents);
  };

  return (
    <div className="mb-4">
      <h6 className="border-bottom pb-2">Legal Documents</h6>

      {legalDocs.length === 0 && (
        <p className="text-body-secondary small">No legal documents added.</p>
      )}

      {legalDocs.map((document, documentIndex) => {
        const documentPrefix = `interventions.${intervention?.correlationID}.entity.legalDocs.${documentIndex}`;
        return (
          <div className="border rounded-2 p-3 mb-3" key={document.correlationID ?? documentIndex}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="mb-0">Document {documentIndex + 1}</h6>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                aria-label={`Remove document ${documentIndex + 1}`}
                onClick={() => setLegalDocs(legalDocs.filter((_, i) => i !== documentIndex))}
              >
                <i className="bi bi-trash" aria-hidden="true" />
              </button>
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <SelectField
                  id={`intervention-${index ?? 0}-document-${documentIndex}-type`}
                  label="Document Type"
                  value={document.legalDocTypeId ?? ""}
                  options={[...LEGAL_DOCUMENT_TYPES]}
                  onChange={(e) =>
                    updateLegalDoc(documentIndex, {
                      legalDocTypeId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div className="col-md-4">
                <InputField
                  id={`intervention-${index ?? 0}-document-${documentIndex}-number`}
                  label="Document Number"
                  invalidMessage={errors?.[`${documentPrefix}.legalDocNumber`]}
                  value={document.legalDocNumber ?? ""}
                  onChange={(e) => updateLegalDoc(documentIndex, { legalDocNumber: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <InputField
                  id={`intervention-${index ?? 0}-document-${documentIndex}-expiration`}
                  label="Expiration Date"
                  invalidMessage={errors?.[`${documentPrefix}.validDate`]}
                  type="date"
                  value={toLocalDate(document.validDate) ?? ""}
                  onChange={(e) => updateLegalDoc(documentIndex, { validDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        className="btn btn-sm btn-outline-primary"
        onClick={() =>
          setLegalDocs([
            ...legalDocs,
            { correlationID: newId(), legalDocTypeId: null, legalDocNumber: "", validDate: null },
          ])
        }
      >
        <i className="bi bi-plus-lg me-1" aria-hidden="true" />
        Add legal document
      </button>
    </div>
  );
}
