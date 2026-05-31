import {
  selectCredoper,
  useAppDispatch,
  useAppSelector,
} from "../../../app/store";
import InputField from "../../../components/ui/inputField";
import SelectField from "../../../components/ui/selectField";
import type { InterventionFormProps } from "../types/credoperTypes";
import { setInterventionDetailField } from "../utils/functions";

export default function InterventionLegalDocForm({
  index,
  intervention,
}: InterventionFormProps) {
  const dispatchCredOper = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);

  return (
    <div className="mb-4">
      <h6 className="border-bottom pb-2">Legal Document</h6>

      <div className="row g-3">
        <div className="col-md-4">
          <SelectField
            id="intervention-legal-doc-number"
            label="Document Type"
            value={intervention?.entity?.legalDocs?.at(0)?.id || ""}
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
                    id: Number(e.target.value),
                  },
                ],
              )
            }
          />
        </div>

        <div className="col-md-4">
          <InputField
            id="intervention-legal-doc-number"
            label="Document Number"
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
            id="intervention-legal-doc-number"
            label="Expiration Date"
            type="date"
            value={intervention?.entity?.legalDocs?.at(0)?.validDate || ""}
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
