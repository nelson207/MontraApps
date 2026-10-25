import {
  selectCredoper,
  useAppDispatch,
  useAppSelector,
} from "@credit/store";
import InputField from "@platform/components/ui/InputField";
import SelectField from "@platform/components/ui/SelectField";
import type { InterventionFormProps } from "../../types/credoperTypes";
import { setInterventionDetailField } from "../../utils/fieldSetters";

export default function InterventionAddressForm({
  index,
  intervention,
}: InterventionFormProps) {
  const dispatchCredOper = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);
  return (
    <div className="mb-4">
      <h6 className="border-bottom pb-2">Address</h6>

      <div className="row g-3">
        <div className="col-md-6">
          <InputField
            id={`intervention-${index ?? 0}-address`}
            label="Address"
            value={intervention?.fiscalEntityAddress?.street || ""}
            onChange={(e) =>
              setInterventionDetailField(
                dispatchCredOper,
                credoper,
                index ?? 0, // Assuming you want to update the first intervention
                "fiscalEntityAddress",
                "street",
                e.target.value,
              )
            }
          />
        </div>

        <div className="col-md-3">
          <InputField
            id={`intervention-${index ?? 0}-postal-code`}
            label="Postal Code"
            value={intervention?.fiscalEntityAddress?.postalCode || ""}
            onChange={(e) =>
              setInterventionDetailField(
                dispatchCredOper,
                credoper,
                index ?? 0,
                "fiscalEntityAddress",
                "postalCode",
                e.target.value,
              )
            }
          />
        </div>

        <div className="col-md-3">
          <InputField
            id={`intervention-${index ?? 0}-city`}
            label="City"
            value={intervention?.fiscalEntityAddress?.district || ""}
            onChange={(e) =>
              setInterventionDetailField(
                dispatchCredOper,
                credoper,
                index ?? 0,
                "fiscalEntityAddress",
                "district",
                e.target.value,
              )
            }
          />
        </div>

        <div className="col-md-4">
          <SelectField
            id={`intervention-${index ?? 0}-country`}
            label="Country"
            value={intervention?.fiscalEntityAddress?.countryId || ""}
            options={[
              { value: "PRT", label: "Portugal" },
              { value: "ESP", label: "Spain" },
            ]}
            onChange={(e) =>
              setInterventionDetailField(
                dispatchCredOper,
                credoper,
                index ?? 0,
                "fiscalEntityAddress",
                "countryId",
                e.target.value,
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
