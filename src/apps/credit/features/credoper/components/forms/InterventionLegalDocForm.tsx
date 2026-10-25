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

export default function InterventionLegalDocForm({
  index,
  intervention,
  errors,
}: InterventionFormProps) {
  const dispatchCredOper = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);

  return (
    <div className="mb-4">
      <h6 className="border-bottom pb-2">Legal Document</h6>

      <div className="row g-3">
        <div className="col-md-4">
          <SelectField
            id={`intervention-${index ?? 0}-document-type`}
            label="Document Type"
            value={intervention?.entity?.legalDocs?.at(0)?.legalDocTypeId ?? ""}
            options={[
              { value: 1, label: "ID Card" },
              { value: 2, label: "Passport" },
            ]}
            onChange={(e) =>
              setInterventionDetailField(
                dispatchCredOper,
                credoper,
                index ?? 0,
                "entity",
                "legalDocs",
                [
                  {
                    ...intervention?.entity?.legalDocs?.at(0),
                    legalDocTypeId: e.target.value ? Number(e.target.value) : null,
                  },
                ],
              )
            }
          />
        </div>

        <div className="col-md-4">
          <InputField
            id={`intervention-${index ?? 0}-document-number`}
            label="Document Number"
            invalidMessage={errors?.[`interventions.${intervention?.correlationID}.entity.legalDocs.0.legalDocNumber`]}
            value={intervention?.entity?.legalDocs?.at(0)?.legalDocNumber || ""}
            onChange={(e) =>
              setInterventionDetailField(
                dispatchCredOper,
                credoper,
                index ?? 0,
                "entity",
                "legalDocs",
                [
                  {
                    ...intervention?.entity?.legalDocs?.at(0),
                    legalDocNumber: e.target.value,
                  },
                ],
              )
            }
          />
        </div>

        <div className="col-md-4">
          <InputField
            id={`intervention-${index ?? 0}-expiration-date`}
            label="Expiration Date"
            invalidMessage={errors?.[`interventions.${intervention?.correlationID}.entity.legalDocs.0.validDate`]}
            type="date"
            value={toLocalDate(intervention?.entity?.legalDocs?.at(0)?.validDate) ?? ""}
            onChange={(e) =>
              setInterventionDetailField(
                dispatchCredOper,
                credoper,
                index ?? 0,
                "entity",
                "legalDocs",
                [
                  {
                    ...intervention?.entity?.legalDocs?.at(0),
                    validDate: e.target.value,
                  },
                ],
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
