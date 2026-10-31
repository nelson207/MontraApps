import { problemMessage } from "@platform/api/problemCode";
import { selectCredoper, useAppDispatch, useAppSelector } from "@credit/store";
import { useAssetTypeChoices } from "../../business/useAssetTypeChoices";
import { patchCredoper, setInsurances } from "../../credoperSlice";
import { assetTypeOf, BUILDING_ASSET, businessOf, changeAssetType, EQUIPMENT_ASSET, type AssetTypeOption } from "../../model/business";
import type { StepProps } from "../../wizard/stepTypes";

const ICONS: Record<string, string> = { [EQUIPMENT_ASSET]: "bi-car-front", [BUILDING_ASSET]: "bi-house", none: "bi-slash-circle" };
const iconOf = (id: AssetTypeOption["id"]) => ICONS[id ?? "none"] ?? "bi-box";

// After Company, only when the business offers several asset types in the company (otherwise it's
// decided for the user and this step isn't shown): equipment (vehicles), a building, or no asset.
// Changing it later asks first when that removes data (vehicle or building details).
function AssetTypeStep({ stage, errors, advance }: StepProps) {
  const dispatch = useAppDispatch();
  const op = useAppSelector(selectCredoper);
  const { data: assetTypes, isError, error, refetch } = useAssetTypeChoices(stage, op);
  if (!op) return null;
  const current = assetTypeOf(op);

  const choose = (option: AssetTypeOption) => {
    if (option.id === current) return advance();
    const { next, removed } = changeAssetType(op, option.id);
    if (removed.length > 0 && !window.confirm(`Change to ${option.label}? This removes ${removed.join(" and ")}.`)) return;
    dispatch(patchCredoper({ assetTypeId: next.assetTypeId, assets: next.assets }));
    if (next.insurances !== op.insurances) dispatch(setInsurances(next.insurances));
    advance();
  };

  if (isError) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
        <span className="flex-grow-1">{problemMessage(error) ?? "Couldn't load the asset types."}</span>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <fieldset>
      <legend className="text-body-secondary fs-6 mb-3">
        What does this {businessOf(op)?.label.toLowerCase() ?? "operation"} finance?
      </legend>
      {!assetTypes ? (
        <div className="d-flex align-items-center gap-2 small text-body-secondary">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          Loading…
        </div>
      ) : assetTypes.length === 0 ? (
        <div className="alert alert-warning mb-0" role="status">
          No asset type is configured for this business in this company
        </div>
      ) : (
        <div className="row g-3" role="radiogroup" aria-label="Asset type">
          {assetTypes.map((option) => {
            const selected = option.id === current;
            return (
              <div key={option.id ?? "none"} className="col-12 col-sm-6 col-xl-4">
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`app-business-card w-100 h-100 text-start ${selected ? "is-selected" : ""}`}
                  onClick={() => choose(option)}
                >
                  <span className="app-business-icon">
                    <i className={`bi ${iconOf(option.id)}`} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-grow-1 fw-semibold">{option.label}</span>
                  {selected && <i className="bi bi-check-circle-fill app-business-check" aria-hidden="true" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {errors.assetTypeId && <div className="invalid-feedback d-block mt-2">{errors.assetTypeId}</div>}
    </fieldset>
  );
}

export default AssetTypeStep;
