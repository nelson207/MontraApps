import { useState } from "react";
import { problemMessage } from "@platform/api/problemCode";
import { selectCredoper, useAppDispatch, useAppSelector } from "@credit/store";
import { newEquipment } from "../../api/credOperApi";
import { addAsset, removeAssetAt, removeInsurance } from "../../credoperSlice";
import { money } from "../../hooks/useCalculation";
import { equipmentModeOf } from "../../model/business";
import { assetLabel } from "../../model/credOperDraft";
import type { StepProps } from "../../wizard/stepTypes";
import VehicleEditor from "../forms/VehicleEditor";
import { newId } from "@platform/utils/newId";

// The vehicles of the operation (every business with equipment): one for Auto credit,
// Financial leasing and Auto insurance; a list for Renting (one contract, several vehicles,
// each with its own amount; the financing applies to their total).
function EquipmentStep({ errors }: StepProps) {
  const dispatch = useAppDispatch();
  const op = useAppSelector(selectCredoper);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<unknown>(null);
  if (!op) return null;
  const assets = op.assets ?? [];

  if (equipmentModeOf(op) !== "multiple") {
    return <VehicleEditor assetIndex={0} errors={errors} />;
  }

  const total = assets.reduce((sum, a) => sum + (a.equipment?.netAmount ?? 0), 0);
  const hasErrors = (index: number) => Object.keys(errors).some((key) => key.startsWith(`assets.${index}.`));

  // A new vehicle starts from the API's blank equipment (GET /api/equipments/new)
  const addVehicle = async () => {
    setAdding(true);
    setAddError(null);
    try {
      const equipment = await newEquipment(dispatch);
      dispatch(
        addAsset({
          correlationID: newId(),
          // Same server field rules as the first vehicle
          metadataResponse: assets[0]?.metadataResponse,
          equipment: { ...equipment, metadataResponse: assets[0]?.equipment?.metadataResponse },
        }),
      );
    } catch (error) {
      setAddError(error);
    } finally {
      setAdding(false);
    }
  };

  const removeVehicle = (index: number) => {
    const asset = assets[index];
    const insured = op.insurances.filter((i) => i.kind === "car" && i.assetRef === asset.correlationID);
    const extra = insured.length ? ` Its car insurance${insured.length > 1 ? "s" : ""} will be removed too.` : "";
    if (!window.confirm(`Remove ${assetLabel(asset, index)}?${extra}`)) return;
    insured.forEach((i) => dispatch(removeInsurance(i.id)));
    dispatch(removeAssetAt(index));
  };

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex flex-wrap align-items-center gap-2">
        <p className="text-body-secondary small mb-0 flex-grow-1">
          One renting contract for every vehicle below. The financing applies to their total.
        </p>
        <span className="app-commercial-value">
          <span>{assets.length === 1 ? "1 vehicle" : `${assets.length} vehicles`}</span>
          <strong>{money.format(total)}</strong>
        </span>
      </div>

      {assets.map((asset, index) => (
        <section
          key={asset.correlationID ?? index}
          className={`card app-vehicle-card ${hasErrors(index) ? "has-errors" : ""}`}
          aria-labelledby={`vehicle-${index}-title`}
        >
          <div className="card-header d-flex align-items-center gap-2">
            <span className="app-vehicle-number" aria-hidden="true">
              {index + 1}
            </span>
            <h3 id={`vehicle-${index}-title`} className="h6 fw-semibold mb-0 flex-grow-1 text-truncate">
              {assetLabel(asset, index)}
            </h3>
            {asset.equipment?.netAmount != null && (
              <span className="small text-body-secondary">{money.format(asset.equipment.netAmount)}</span>
            )}
            {assets.length > 1 && (
              <button
                type="button"
                className="btn btn-sm btn-link text-danger"
                aria-label={`Remove ${assetLabel(asset, index)}`}
                onClick={() => removeVehicle(index)}
              >
                <i className="bi bi-trash" />
              </button>
            )}
          </div>
          <div className="card-body pt-0">
            <VehicleEditor assetIndex={index} errors={errors} showAmount />
          </div>
        </section>
      ))}

      {!!addError && (
        <div className="alert alert-danger py-2 mb-0" role="alert">
          {problemMessage(addError) ?? "Couldn't add a vehicle. Please try again."}
        </div>
      )}
      <button type="button" className="btn btn-outline-primary align-self-start" onClick={() => void addVehicle()} disabled={adding}>
        {adding ? (
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
        ) : (
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
        )}
        Add vehicle
      </button>
    </div>
  );
}

export default EquipmentStep;
