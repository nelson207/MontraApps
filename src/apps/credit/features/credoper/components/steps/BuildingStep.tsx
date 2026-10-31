import InputField from "@platform/components/ui/InputField";
import type { BuildingDto } from "@platform/api/generated/MontraPOSApi";
import type { CredOperAssetDto } from "@platform/api/legacy/legacyApi";
import { selectCredoper, useAppDispatch, useAppSelector } from "@credit/store";
import { patchCredoper } from "../../credoperSlice";
import { buildingOf } from "../../model/business";
import type { StepProps } from "../../wizard/stepTypes";

const toNumber = (raw: string): number | null => (raw.trim() === "" ? null : Number(raw));

// The building of the operation (asset type 2): what it is and its purchase. Its amounts for the
// financing are on Financial data, as for a vehicle.
function BuildingStep({ errors }: StepProps) {
  const dispatch = useAppDispatch();
  const op = useAppSelector(selectCredoper);
  if (!op) return null;
  const building = buildingOf(op.assets?.[0]) ?? {};
  const error = (field: keyof BuildingDto) => errors[`assets.0.building.${field}`] ?? undefined;

  const set = (changes: Partial<BuildingDto>) => {
    const [first, ...rest] = op.assets?.length ? op.assets : [{}];
    const asset = { ...first, building: { ...building, ...changes } } as CredOperAssetDto;
    dispatch(patchCredoper({ assets: [asset, ...rest] }));
  };

  return (
    <div className="row gx-3">
      <div className="col-12">
        <InputField
          label="Description"
          id="credoper.building.descr"
          value={building.descr ?? ""}
          onChange={(e) => set({ descr: e.target.value })}
          invalidMessage={error("descr")}
        />
      </div>
      <div className="col-md-4">
        <InputField
          label="Building year"
          id="credoper.building.buildingYear"
          type="number"
          min={1800}
          step={1}
          value={building.buildingYear ?? ""}
          onChange={(e) => set({ buildingYear: toNumber(e.target.value) })}
          invalidMessage={error("buildingYear")}
        />
      </div>
      <div className="col-md-4">
        <InputField
          label="Purchase date"
          id="credoper.building.purchaseDate"
          type="date"
          value={building.purchaseDate?.slice(0, 10) ?? ""}
          onChange={(e) => set({ purchaseDate: e.target.value || null })}
          invalidMessage={error("purchaseDate")}
        />
      </div>
      <div className="col-md-4">
        <InputField
          label="Purchase amount"
          id="credoper.building.purchaseAmount"
          type="number"
          placeholder="0.00"
          min={0}
          step={0.01}
          value={building.purchaseAmount ?? ""}
          onChange={(e) => set({ purchaseAmount: toNumber(e.target.value) })}
          inputGroupSpan="€"
          invalidMessage={error("purchaseAmount")}
        />
      </div>
    </div>
  );
}

export default BuildingStep;
