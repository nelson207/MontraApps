import {
  selectCredoper,
  useAppDispatch,
  useAppSelector,
} from "@credit/store";
import InputField from "@platform/components/ui/InputField";
import type { InterventionFormProps } from "../../types/credoperTypes";
import { setInterventionDetailField } from "../../utils/fieldSetters";

export default function InterventionDetailsForm({
  index,
  intervention,
  errors,
}: InterventionFormProps) {
  const dispatchCredOper = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);

  return (
    <div className="mb-4">
      <h6 className="border-bottom pb-2">Details</h6>

      <div className="row g-3">
        <div className="col-md-6">
          <InputField
            id={`intervention-${index ?? 0}-name`}
            label="Name"
            invalidMessage={errors?.[`interventions.${intervention?.correlationID}.entity.fullName`]}
            value={intervention?.entity?.fullName || ""}
            onChange={(e) =>
              setInterventionDetailField(
                dispatchCredOper,
                credoper,
                index ?? 0,
                "entity",
                "fullName",
                e.target.value,
              )
            }
          />
        </div>

        <div className="col-md-6">
          <InputField
            id={`intervention-${index ?? 0}-email`}
            label="Email"
            type="email"
            value={intervention?.entityEmail?.email || ""}
            onChange={(e) =>
              setInterventionDetailField(
                dispatchCredOper,
                credoper,
                index ?? 0,
                "entityEmail",
                "email",
                e.target.value,
              )
            }
          />
        </div>

        <div className="col-md-6">
          <InputField
            id={`intervention-${index ?? 0}-mobile-phone`}
            label="Mobile Phone"
            value={intervention?.entityMobilePhone?.phoneNumber || ""}
            onChange={(e) =>
              setInterventionDetailField(
                dispatchCredOper,
                credoper,
                index ?? 0,
                "entityMobilePhone",
                "phoneNumber",
                e.target.value,
              )
            }
          />
        </div>

        <div className="col-md-6">
          <InputField
            id={`intervention-${index ?? 0}-landline-phone`}
            label="Landline Phone"
            value={intervention?.entityLandlinePhone?.phoneNumber || ""}
            onChange={(e) =>
              setInterventionDetailField(
                dispatchCredOper,
                credoper,
                index ?? 0,
                "entityLandlinePhone",
                "phoneNumber",
                e.target.value,
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
