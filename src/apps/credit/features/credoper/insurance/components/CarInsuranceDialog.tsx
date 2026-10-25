import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import InputField from "@platform/components/ui/InputField";
import SelectField from "@platform/components/ui/SelectField";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import {
  assetLabel,
  customerOf,
  interventionName,
  type CarInsurance,
  type CredOperDraft,
} from "../../model/credOperDraft";
import { todayLocal } from "../../validation/localDate";
import { useGetInsuranceProtectionsQuery, useGetInsuranceTypesQuery } from "../insuranceApi";
import { DUPLICATE_MESSAGE, isDuplicate, validateInsurance } from "../insuranceRules";
import InsuranceDialog from "./InsuranceDialog";
import { newId } from "@platform/utils/newId";

type Props = {
  operation: CredOperDraft;
  initial?: CarInsurance;
  onSave: (insurance: CarInsurance) => void;
  onClose: () => void;
};

function LoadError({ error, onRetry, what }: { error: unknown; onRetry: () => void; what: string }) {
  return (
    <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
      <span className="flex-grow-1">{getApiErrorMessage(error) ?? `Couldn't load ${what}.`}</span>
      <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

// Car insurance: vehicle, type, driver information and protections (from the API per type).
function CarInsuranceDialog({ operation, initial, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<CarInsurance>(
    () =>
      initial ?? {
        id: newId(),
        kind: "car",
        insuranceTypeId: 0,
        assetRef: operation.assets?.[0]?.correlationID ?? "",
        driver: { licenseExpiryDate: "", mainDriverIsCustomer: true },
        protectionIds: [],
      },
  );
  const [submitted, setSubmitted] = useState(false);
  const types = useGetInsuranceTypesQuery("Car");
  const protections = useGetInsuranceProtectionsQuery(draft.insuranceTypeId > 0 ? draft.insuranceTypeId : skipToken);

  const mandatoryIds = (protections.data ?? []).filter((p) => p.mandatory).map((p) => p.id);
  // Mandatory protections are always part of the insurance
  const candidate: CarInsurance = { ...draft, protectionIds: [...new Set([...mandatoryIds, ...draft.protectionIds])] };

  const others = operation.insurances.filter((i) => i.id !== draft.id);
  const errors = validateInsurance(candidate, operation, todayLocal());
  const duplicate = isDuplicate(candidate, [...others, candidate]);
  const show = (field: string) => (submitted ? (errors[`insurances.${draft.id}.${field}`] ?? null) : null);
  const customer = customerOf(operation);

  const setDriver = (changes: Partial<CarInsurance["driver"]>) =>
    setDraft((d) => ({ ...d, driver: { ...d.driver, ...changes } }));

  const toggleProtection = (id: number, checked: boolean) =>
    setDraft((d) => ({
      ...d,
      protectionIds: checked ? [...d.protectionIds, id] : d.protectionIds.filter((p) => p !== id),
    }));

  const save = () => {
    setSubmitted(true);
    if (Object.keys(errors).length === 0 && !duplicate) onSave(candidate);
  };

  return (
    <InsuranceDialog title={initial ? "Edit car insurance" : "Add car insurance"} onSave={save} onClose={onClose}>
      <div className="row gx-3">
        <div className="col-md-6">
          <SelectField
            id="insurance-vehicle"
            label="Vehicle"
            value={draft.assetRef}
            options={(operation.assets ?? []).map((asset, index) => ({
              value: asset.correlationID ?? "",
              label: assetLabel(asset, index),
            }))}
            onChange={(e) => setDraft((d) => ({ ...d, assetRef: e.target.value }))}
            invalidMessage={show("link")}
          />
        </div>
        <div className="col-md-6">
          {types.isError ? (
            <LoadError error={types.error} onRetry={() => types.refetch()} what="insurance types" />
          ) : (
            <SelectField
              id="insurance-type"
              label="Insurance type"
              value={draft.insuranceTypeId || undefined}
              isLoading={types.isLoading}
              placeholder="Select an insurance type"
              options={types.data?.map((t) => ({ value: t.id, label: t.name, title: t.description }))}
              // A different type has different protections: start over
              onChange={(e) => setDraft((d) => ({ ...d, insuranceTypeId: Number(e.target.value), protectionIds: [] }))}
              invalidMessage={show("insuranceTypeId")}
            />
          )}
        </div>
      </div>

      <h3 className="app-form-section">
        <i className="bi bi-person-vcard me-2" aria-hidden="true" />
        Driver
      </h3>
      <div className="row gx-3">
        <div className="col-md-6">
          <InputField
            id="insurance-license-expiry"
            label="Driver license expiry date"
            type="date"
            min={todayLocal()}
            required
            value={draft.driver.licenseExpiryDate}
            onChange={(e) => setDriver({ licenseExpiryDate: e.target.value })}
            invalidMessage={show("driver.licenseExpiryDate")}
          />
        </div>
        <div className="col-md-6 d-flex align-items-center">
          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="insurance-main-driver"
              checked={draft.driver.mainDriverIsCustomer}
              onChange={(e) => setDriver({ mainDriverIsCustomer: e.target.checked })}
            />
            <label className="form-check-label" htmlFor="insurance-main-driver">
              Main driver is the customer
              {customer && <span className="d-block small text-body-secondary">{interventionName(customer)}</span>}
            </label>
          </div>
        </div>
        {!draft.driver.mainDriverIsCustomer && (
          <>
            <div className="col-md-6">
              <InputField
                id="insurance-driver-name"
                label="Driver name"
                required
                value={draft.driver.name ?? ""}
                onChange={(e) => setDriver({ name: e.target.value })}
                invalidMessage={show("driver.name")}
              />
            </div>
            <div className="col-md-6">
              <InputField
                id="insurance-driver-license"
                label="Driver license number"
                required
                value={draft.driver.licenseNumber ?? ""}
                onChange={(e) => setDriver({ licenseNumber: e.target.value })}
                invalidMessage={show("driver.licenseNumber")}
              />
            </div>
          </>
        )}
      </div>

      <h3 className="app-form-section">
        <i className="bi bi-shield-check me-2" aria-hidden="true" />
        Protections
      </h3>
      {draft.insuranceTypeId === 0 ? (
        <p className="small text-body-secondary">Select an insurance type to see its protections.</p>
      ) : protections.isError ? (
        <LoadError error={protections.error} onRetry={() => protections.refetch()} what="protections" />
      ) : protections.isFetching ? (
        <div className="d-flex align-items-center gap-2 small text-body-secondary">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          Loading protections…
        </div>
      ) : (
        <fieldset aria-describedby={show("protectionIds") ? "insurance-protections-error" : undefined}>
          <legend className="visually-hidden">Protections</legend>
          <div className="row g-2">
            {protections.data?.map((protection) => (
              <div key={protection.id} className="col-md-6">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`protection-${protection.id}`}
                    checked={candidate.protectionIds.includes(protection.id)}
                    disabled={protection.mandatory}
                    onChange={(e) => toggleProtection(protection.id, e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor={`protection-${protection.id}`}>
                    {protection.name}
                    {protection.mandatory && <span className="text-body-secondary"> (mandatory)</span>}
                    <span className="d-block small text-body-secondary">{protection.description}</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
          {show("protectionIds") && (
            <div id="insurance-protections-error" className="invalid-feedback d-block">
              {show("protectionIds")}
            </div>
          )}
        </fieldset>
      )}

      {submitted && duplicate && (
        <div className="alert alert-warning py-2 mt-3 mb-0" role="alert">
          {DUPLICATE_MESSAGE}
        </div>
      )}
    </InsuranceDialog>
  );
}

export default CarInsuranceDialog;
