import { selectCredoper, useAppDispatch, useAppSelector } from "@credit/store";
import InputField from "@platform/components/ui/InputField";
import EquipmentDetail from "@platform/features/equipment/components/EquipmentDetail";
import { setEquipmentFields } from "../../utils/fieldSetters";
import { fieldRule } from "../../validation/fieldRules";
import type { FieldErrors } from "../../validation/fieldRules";
import OperationField from "../OperationField";

type Props = {
  assetIndex: number;
  errors: FieldErrors;
  /** Renting: each vehicle has its own amount */
  showAmount?: boolean;
};

const toNumber = (raw: string): number | null => (raw.trim() === "" ? null : Number(raw));

// One vehicle of the operation: the shared equipment detail (platform/features/equipment), with the
// server's field rules (metadataResponse), the commercial value and, for Renting, its amount.
function VehicleEditor({ assetIndex, errors, showAmount = false }: Props) {
  const dispatch = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);
  const equipment = credoper?.assets?.at(assetIndex)?.equipment ?? {};
  const meta = equipment.metadataResponse;
  const error = (field: string) => errors[`assets.${assetIndex}.equipment.${field}`] ?? null;
  const idPrefix = assetIndex === 0 ? "credoper.equipment" : `credoper.equipment-${assetIndex}`;

  return (
    <EquipmentDetail
      value={equipment}
      onChange={(changes) => setEquipmentFields(dispatch, credoper, assetIndex, changes)}
      idPrefix={idPrefix}
      companyId={credoper?.aplCompanyId}
      error={error}
      rule={(field) => fieldRule(meta, field)}
      showCommercialValue
      usageExtra={
        showAmount && (
          <div className="col-md-4">
            <OperationField rule={fieldRule(meta, "netAmount")} error={error("netAmount")}>
              {(props) => (
                <InputField
                  label="Vehicle amount"
                  id={`${idPrefix}-netAmount`}
                  type="number"
                  min={0}
                  step={0.01}
                  inputGroupSpan="€"
                  value={equipment.netAmount ?? ""}
                  onChange={(e) => setEquipmentFields(dispatch, credoper, assetIndex, { netAmount: toNumber(e.target.value) })}
                  {...props}
                />
              )}
            </OperationField>
          </div>
        )
      }
    />
  );
}

export default VehicleEditor;
