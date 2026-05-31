import {
  selectCredoper,
  useAppDispatch,
  useAppSelector,
} from "../../../app/store";
import InputField from "../../../components/ui/inputField";
import type { InterventionFormProps } from "../types/credoperTypes";
import { setInterventionDetailField } from "../utils/functions";

export default function InterventionDetailsForm({
  index,
  intervention,
}: InterventionFormProps) {
  const dispatchCredOper = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);

  return (
    <div className="mb-4">
      <h6 className="border-bottom pb-2">Details</h6>

      <div className="row g-3">
        <div className="col-md-6">
          <InputField
            id="intervention-name"
            label="Name"
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
            id="intervention-name"
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
            id="intervention-name"
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
            id="intervention-name"
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
