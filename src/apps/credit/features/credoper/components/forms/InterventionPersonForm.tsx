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

export default function InterventionPersonForm({
  index,
  intervention,
  errors,
}: InterventionFormProps) {
  const dispatchCredOper = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);
  return (
    <div className="mb-4">
      <h6 className="border-bottom pb-2">Person Details</h6>

      <div className="row g-3">
        <div className="col-md-4">
          <InputField
            id={`intervention-${index ?? 0}-birth-date`}
            label="Birth Date"
            invalidMessage={errors?.[`interventions.${intervention?.correlationID}.person.birthDate`]}
            type="date"
            value={toLocalDate(intervention?.person?.birthDate) ?? ""}
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
            id={`intervention-${index ?? 0}-nationality`}
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
            id={`intervention-${index ?? 0}-marital-status`}
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
