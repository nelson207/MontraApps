import InputField from "@platform/components/ui/InputField";
import SelectField from "@platform/components/ui/SelectField";
import { selectCredoper, useAppSelector } from "@credit/store";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DEFAULT_TERM_RESTRICTIONS } from "../../constants";
import type { QuotationDataProps } from "../../types/credoperTypes";
import {
  setCredOperField,
  setEquipmentField,
  setFinConditionsField,
} from "../../utils/fieldSetters";
import { fieldRule, type FieldErrors } from "../../validation/fieldRules";
import { businessOf, equipmentModeOf } from "../../model/business";
import OperationField from "../OperationField";

type Props = Pick<
  QuotationDataProps,
  "dispatchCredOper" | "options" | "fetchingOptions" | "termTicks"
> & {
  errors?: FieldErrors;
};

// Financing: customer type, product, equipment amount, initial entry (amount ⇄ %), term.
// Shared by the quotation and the proposal Financial data step.
function FinancingFields({
  dispatchCredOper,
  options,
  fetchingOptions,
  termTicks,
  errors = {},
}: Props) {
  const credoper = useAppSelector(selectCredoper);
  const [updatingFromAmount, SetUpdatingFromAmount] = useState(false);
  // Loaded values are already consistent: derive only after the user changes one
  const retakeKey = (op: typeof credoper) =>
    `${op?.assets?.at(0)?.equipment?.retakeAmount}|${op?.assets?.at(0)?.equipment?.retakePercentage}`;
  const lastRetake = useRef(retakeKey(credoper));

  // What the initial entry is a share of: the vehicle (or loan) amount; Renting: all vehicles
  const renting = !!credoper && equipmentModeOf(credoper) === "multiple";
  const personalLoan = !!credoper && businessOf(credoper)?.equipment === "none";
  const financedBase = renting
    ? (credoper?.assets ?? []).reduce(
        (sum, a) => sum + (a.equipment?.netAmount ?? 0),
        0,
      )
    : credoper?.assets?.at(0)?.equipment?.netAmount;

  const GetRetakePercentageFromAmount = (amount: string | number): number => {
    const baseAmount = financedBase;
    let amountProp = Number(amount);

    if (!amountProp) amountProp = 0;

    if (amountProp <= 0 || !baseAmount || baseAmount <= 0) return 0;

    const percentage = (amountProp / baseAmount) * 100; // example: 10%
    return Math.round(Math.min(percentage, 100)); // cap at 100%
  };

  const GetRetakeAmountFromPercentage = (
    percentage: string | number,
  ): number => {
    const baseAmount = financedBase;
    let percentageProp = Number(percentage);

    if (!percentageProp) percentageProp = 0;

    if (percentageProp <= 0 || !baseAmount || baseAmount <= 0) return 0;

    const amount = (percentageProp * baseAmount) / 100; // example: 10%
    return Math.round(Math.min(amount, baseAmount)); // cap at 100%
  };

  useEffect(() => {
    if (retakeKey(credoper) === lastRetake.current) return;
    lastRetake.current = retakeKey(credoper);
    if (updatingFromAmount) {
      if (credoper?.assets?.at(0)?.equipment?.retakeAmount) {
        if (credoper?.assets?.at(0)?.equipment?.retakeAmount) {
          setEquipmentField(
            dispatchCredOper,
            credoper,
            0,
            "retakePercentage",
            GetRetakePercentageFromAmount(
              credoper?.assets?.at(0)?.equipment?.retakeAmount ?? 0,
            ),
          );

          if (financedBase) {
            if (
              financedBase <
              (credoper?.assets?.at(0)?.equipment?.retakeAmount ?? 0)
            ) {
              setEquipmentField(
                dispatchCredOper,
                credoper,
                0,
                "retakeAmount",
                financedBase,
              );
            }
          }
        }
      }
    } else {
      if (credoper?.assets?.at(0)?.equipment?.retakePercentage) {
        setEquipmentField(
          dispatchCredOper,
          credoper,
          0,
          "retakeAmount",
          GetRetakeAmountFromPercentage(
            credoper?.assets?.at(0)?.equipment?.retakePercentage ?? 0,
          ),
        );
      }
    }
  }, [
    credoper?.assets?.at(0)?.equipment?.retakeAmount,
    credoper?.assets?.at(0)?.equipment?.retakePercentage,
  ]);

  const equipment = credoper?.assets?.at(0)?.equipment;
  const equipmentMeta = equipment?.metadataResponse;
  const operationMeta = credoper?.metadataResponse;
  const termMeta = credoper?.conditions?.at(0)?.metadataResponse;
  const error = (key: string) => errors[key] ?? null;
  const setEquipment = (
    field: Parameters<typeof setEquipmentField>[3],
    value: never,
  ) => setEquipmentField(dispatchCredOper, credoper, 0, field, value);
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
              label="Customer type"
              id="credoper.credoperClassification"
              isLoading={fetchingOptions.credOperClassifications}
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
                label={personalLoan ? "Loan amount" : "Equipment amount"}
                id="credoper.equipmentAmount"
                type="number"
                placeholder="0.00"
                min={0}
                step={0.01}
                value={equipment?.netAmount ?? ""}
                onChange={(e) =>
                  setEquipment("netAmount", Number(e.target.value) as never)
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
          error={error("assets.0.equipment.retakeAmount")}
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
              onChange={(e) => {
                SetUpdatingFromAmount(true);
                setEquipment("retakeAmount", Number(e.target.value) as never);
              }}
              inputGroupSpan="€"
              {...field}
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
              onChange={(e) => {
                SetUpdatingFromAmount(false);
                setEquipment(
                  "retakePercentage",
                  Number(e.target.value) as never,
                );
              }}
              inputGroupSpan="%"
              {...field}
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
