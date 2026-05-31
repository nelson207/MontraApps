import {
  selectCredoper,
  useAppDispatch,
  useAppSelector,
} from "../../../app/store";
import InputField from "../../../components/ui/inputField";
import SelectField from "../../../components/ui/selectField";
import type { InterventionFormProps } from "../types/credoperTypes";
import { setInterventionDetailField } from "../utils/functions";

export default function InterventionPersonForm({
  index,
  intervention,
}: InterventionFormProps) {
  const dispatchCredOper = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);
  return (
    <div className="mb-4">
      <h6 className="border-bottom pb-2">Person Details</h6>

      <div className="row g-3">
        <div className="col-md-4">
          <InputField
            id="intervention-person-name"
            label="Birth Date"
            type="date"
            value={intervention?.person?.birthDate || ""}
            onChange={(e) =>
              setInterventionDetailField(
                dispatchCredOper,
                credoper,
                index ?? 0,
                "person",
                "birthDate",
                e.target.value,
              )
            }
          />
        </div>

        <div className="col-md-4">
          <SelectField
            id="intervention-person-name"
            label="Nationality"
            value={intervention?.person?.countryId || ""}
            options={[
              { value: "PRT", label: "Portugal" },
              { value: "ESP", label: "Spain" },
            ]}
            onChange={(e) =>
              setInterventionDetailField(
                dispatchCredOper,
                credoper,
                index ?? 0,
                "person",
                "countryId",
                e.target.value,
              )
            }
          />
        </div>

        <div className="col-md-4">
          <SelectField
            id="intervention-person-name"
            label="Marital Status"
            value={intervention?.person?.maritalStatusId || ""}
            options={[
              { value: 1, label: "Single" },
              { value: 2, label: "Married" },
            ]}
            onChange={(e) =>
              setInterventionDetailField(
                dispatchCredOper,
                credoper,
                index ?? 0,
                "person",
                "maritalStatusId",
                Number(e.target.value),
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
