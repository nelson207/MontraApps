import InputField from "@platform/components/ui/InputField";
import SelectField from "@platform/components/ui/SelectField";
import { selectCredoper, useAppSelector } from "@credit/store";
import { type CSSProperties } from "react";
import { DEFAULT_TERM_RESTRICTIONS } from "../../constants";
import type { QuotationDataProps } from "../../types/credoperTypes";
import {
  setAssetAmount,
  setCredOperField,
  setFinConditionsField,
  setRetake,
} from "../../utils/fieldSetters";
import { fieldRule, type FieldErrors } from "../../validation/fieldRules";
import { retakeOverBase } from "../../validation/stepValidation";
import { amountLabel, equipmentModeOf, retakeBaseOf } from "../../model/business";
import OperationField from "../OperationField";

type Props = Pick<
  QuotationDataProps,
  "dispatchCredOper" | "options" | "fetchingOptions" | "termTicks"
> & {
  errors?: FieldErrors;
};

// Financing: contract classification, product, equipment amount, initial entry (amount ⇄ %), term.
// Shared by the quotation and the proposal Financial data step.
function FinancingFields({
  dispatchCredOper,
  options,
  fetchingOptions,
  termTicks,
  errors = {},
}: Props) {
  const credoper = useAppSelector(selectCredoper);

  // What the initial entry is a share of: the vehicle (or loan) amount; Renting: all vehicles
  const renting = !!credoper && equipmentModeOf(credoper) === "multiple";
  const baseLabel = credoper ? amountLabel(credoper) : "Equipment amount";
  const financedBase = credoper ? retakeBaseOf(credoper) : null;
  // The initial entry is a share of it: nothing to type until it has a value
  const hasBase = !!financedBase && financedBase > 0;

  const equipment = credoper?.assets?.at(0)?.equipment;
  const equipmentMeta = equipment?.metadataResponse;
  const operationMeta = credoper?.metadataResponse;
  const termMeta = credoper?.conditions?.at(0)?.metadataResponse;
  const error = (key: string) => errors[key] ?? null;
  /** A number typed, none when cleared */
  const typedNumber = (value: string) => (value === "" ? null : Number(value));
  const { minValue, maxValue, stepValue } = DEFAULT_TERM_RESTRICTIONS;
  const term = credoper?.conditions?.at(0)?.term ?? minValue;

  return (
    <div className="row gx-3">
      <div className="col-md-6">
        <OperationField
          rule={fieldRule(operationMeta, "credOperClassification")}
          error={error("credOperClassification")}
        >
          {(field) => (
            <SelectField
              label="Contract classification"
              id="credoper.credoperClassification"
              isLoading={fetchingOptions.credOperClassifications}
              // None offered: the app's settings list no classification for this business
              placeholder={
                !fetchingOptions.credOperClassifications && !options?.credOperClassifications?.length
                  ? "Nothing configured for this business"
                  : undefined
              }
              value={credoper?.credOperClassification ?? undefined}
              options={options?.credOperClassifications?.map((coc) => ({
                value: coc.code,
                label: coc.abbreviation,
                title: coc.description,
              }))}
              onChange={(e) =>
                setCredOperField(
                  dispatchCredOper,
                  "credOperClassification",
                  Number(e.target.value),
                )
              }
              disabled={field.disabled}
              invalidMessage={field.invalidMessage}
            />
          )}
        </OperationField>
      </div>
      <div className="col-md-6">
        <OperationField
          rule={fieldRule(operationMeta, "financialProduct")}
          error={error("financialProduct")}
        >
          {(field) => (
            <SelectField
              label="Financial product"
              id="credoper.financialProduct"
              value={credoper?.financialProduct ?? undefined}
              isLoading={fetchingOptions.financialProducts}
              options={options?.financialProducts?.map((fp) => ({
                value: fp.code,
                label: fp.abbreviation,
                title: fp.description,
              }))}
              onChange={(e) =>
                setCredOperField(
                  dispatchCredOper,
                  "financialProduct",
                  Number(e.target.value),
                )
              }
              disabled={field.disabled}
              invalidMessage={field.invalidMessage}
            />
          )}
        </OperationField>
      </div>
      <div className="col-md-4">
        {renting ? (
          // Renting: each vehicle has its amount (Vehicles step); this is their total
          <InputField
            label="Total of the vehicles"
            id="credoper.equipmentAmount"
            type="number"
            value={financedBase ?? 0}
            onChange={() => undefined}
            inputGroupSpan="€"
            disabled
          />
        ) : (
          <OperationField
            rule={fieldRule(equipmentMeta, "netAmount")}
            error={error("assets.0.equipment.netAmount")}
          >
            {(field) => (
              <InputField
                label={baseLabel}
                id="credoper.equipmentAmount"
                type="number"
                placeholder="0.00"
                min={0}
                step={0.01}
                value={equipment?.netAmount ?? ""}
                onChange={(e) =>
                  setAssetAmount(dispatchCredOper, credoper, 0, Number(e.target.value))
                }
                inputGroupSpan="€"
                {...field}
              />
            )}
          </OperationField>
        )}
      </div>
      <div className="col-md-4">
        <OperationField
          rule={fieldRule(equipmentMeta, "retakeAmount")}
          // Too high: shown as typed, not only after Next
          error={error("assets.0.equipment.retakeAmount") ?? (credoper ? retakeOverBase(credoper) : null)}
        >
          {(field) => (
            <InputField
              label="Initial entry amount"
              id="credoper.equipmentInitialEntryAmount"
              type="number"
              placeholder="0.00"
              min={0}
              max={financedBase ?? undefined}
              step={0.01}
              value={equipment?.retakeAmount ?? ""}
              onChange={(e) => setRetake(dispatchCredOper, credoper, { amount: typedNumber(e.target.value) })}
              inputGroupSpan="€"
              {...field}
              disabled={field.disabled || !hasBase}
            />
          )}
        </OperationField>
      </div>
      <div className="col-md-4">
        <OperationField
          rule={fieldRule(equipmentMeta, "retakePercentage")}
          error={error("assets.0.equipment.retakePercentage")}
        >
          {(field) => (
            <InputField
              label="Initial entry percentage"
              id="credoper.equipmentInitialEntryPercentage"
              type="number"
              placeholder="0.00"
              min={0}
              max={100}
              step={0.01}
              value={equipment?.retakePercentage ?? ""}
              onChange={(e) => setRetake(dispatchCredOper, credoper, { percentage: typedNumber(e.target.value) })}
              inputGroupSpan="%"
              {...field}
              disabled={field.disabled || !hasBase}
            />
          )}
        </OperationField>
      </div>
      <div className="col-12">
        <OperationField
          rule={fieldRule(termMeta, "term")}
          error={error("conditions.0.term")}
        >
          {(field) => (
            <div className="mb-2">
              <label
                htmlFor="credoper.term"
                className="form-label d-flex justify-content-between"
              >
                <span>
                  Term
                  {field.required && (
                    <span className="text-danger ms-1">*</span>
                  )}
                </span>
                <strong>{term} months</strong>
              </label>
              <input
                id="credoper.term"
                type="range"
                className="form-range"
                min={minValue}
                max={maxValue}
                step={stepValue}
                value={term}
                disabled={field.disabled}
                aria-invalid={field.invalidMessage ? true : undefined}
                onChange={(e) =>
                  setFinConditionsField(
                    dispatchCredOper,
                    credoper,
                    0,
                    "term",
                    Number(e.target.value),
                  )
                }
              />
              {/* Each value under its point of the slider; on small screens every other one
                  (always keeping the last), so they don't run together */}
              <div className="app-term-ticks small text-body-secondary" aria-hidden="true">
                {termTicks?.map((t, i) => (
                  <span
                    key={t}
                    className={(termTicks.length - 1 - i) % 2 ? "is-minor" : undefined}
                    style={{ "--tick": maxValue > minValue ? (t - minValue) / (maxValue - minValue) : 0 } as CSSProperties}
                  >
                    {t}
                  </span>
                ))}
              </div>
              {field.invalidMessage && (
                <div className="invalid-feedback d-block">
                  {field.invalidMessage}
                </div>
              )}
            </div>
          )}
        </OperationField>
      </div>
    </div>
  );
}

export default FinancingFields;
