import InputField from "../../../components/ui/inputField";
import SelectField from "../../../components/ui/selectField";
import {
  setCredOperField,
  setEquipmentField,
  setFinConditionsField,
} from "../utils/functions";
import { selectCredoper, useAppSelector } from "../../../app/store";
import { useEffect, useState } from "react";
import type { QuotationDataProps } from "../types/credoperTypes";

function FinancialData({
  dispatchCredOper,
  options,
  fetchingOptions,
  termTicks,
}: QuotationDataProps) {
  const credoper = useAppSelector(selectCredoper);
  const [updatingFromAmount, SetUpdatingFromAmount] = useState(false);

  useEffect(() => {
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

          if (credoper?.assets?.at(0)?.equipment?.netAmount) {
            if (
              (credoper?.assets?.at(0)?.equipment?.netAmount ?? 0) <
              (credoper?.assets?.at(0)?.equipment?.retakeAmount ?? 0)
            ) {
              setEquipmentField(
                dispatchCredOper,
                credoper,
                0,
                "retakeAmount",
                credoper?.assets?.at(0)?.equipment?.netAmount,
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

  const GetRetakePercentageFromAmount = (amount: string | number): number => {
    const baseAmount = credoper?.assets?.at(0)?.equipment?.netAmount;
    let amountProp = Number(amount);

    if (!amountProp) amountProp = 0;

    if (amountProp <= 0 || !baseAmount || baseAmount <= 0) return 0;

    const percentage = (amountProp / baseAmount) * 100; // example: 10%
    return Math.round(Math.min(percentage, 100)); // cap at 100%
  };

  const GetRetakeAmountFromPercentage = (
    percentage: string | number,
  ): number => {
    const baseAmount = credoper?.assets?.at(0)?.equipment?.netAmount;
    let percentageProp = Number(percentage);

    if (!percentageProp) percentageProp = 0;

    if (percentageProp <= 0 || !baseAmount || baseAmount <= 0) return 0;

    const amount = (percentageProp * baseAmount) / 100; // example: 10%
    return Math.round(Math.min(amount, baseAmount)); // cap at 100%
  };

  return (
    <>
      <div className="row g-3 align-items-end my-2">
        <div className="col-md-4">
          <SelectField
            label="Equipment Type"
            id="credoper.equipmentType"
            isLoading={fetchingOptions.equipmentTypes}
            value={
              credoper?.assets?.at(0)?.equipment?.equipmentTypeId ?? undefined
            }
            options={options?.equipmentTypes?.map((type) => ({
              value: type.code,
              label: type.abbreviation,
              title: type.description,
            }))}
            onChange={(e) =>
              setEquipmentField(
                dispatchCredOper,
                credoper,
                0,
                "equipmentTypeId",
                Number(e.target.value),
              )
            }
          />
        </div>
        <div className="col-md-4">
          <SelectField
            label="Equipment Category"
            id="credoper.equipmentCategory"
            isLoading={fetchingOptions.equipmentCategories}
            value={
              credoper?.assets?.at(0)?.equipment?.equipmentCategoryId ??
              undefined
            }
            options={options?.equipmentCategories?.map((cat) => ({
              value: cat.code,
              label: cat.abbreviation,
              title: cat.description,
            }))}
            onChange={(e) =>
              setEquipmentField(
                dispatchCredOper,
                credoper,
                0,
                "equipmentCategoryId",
                Number(e.target.value),
              )
            }
            disabled={false}
          />
        </div>
        <div className="col-md-4">
          <SelectField
            label="Equipment State"
            id="credoper.equipmentState"
            isLoading={fetchingOptions.equipmentStates}
            value={
              credoper?.assets?.at(0)?.equipment?.equipmentStateId ?? undefined
            }
            options={options?.equipmentStates?.map((state) => ({
              value: state.code,
              label: state.abbreviation,
              title: state.description,
            }))}
            onChange={(e) =>
              setEquipmentField(
                dispatchCredOper,
                credoper,
                0,
                "equipmentStateId",
                Number(e.target.value),
              )
            }
          />
        </div>
      </div>
      <div className="row g-3 align-items-end my-2">
        <div className="col-md-4">
          <InputField
            label="License Plate"
            id="credoper.equipmentLicensePlate"
            value={
              credoper?.assets?.at(0)?.equipment?.licencePlate ?? undefined
            }
            onChange={(e) =>
              setEquipmentField(
                dispatchCredOper,
                credoper,
                0,
                "licencePlate",
                e.target.value,
              )
            }
            actionButtonShow={true}
            actionButtonLabel="IMTT"
            actionButtonOnClick={() => alert("Action button clicked!")}
          />
        </div>
        <div className="col-md-4">
          <InputField
            label="Date of Registration"
            id="credoper.equipmentRegistrationDate"
            type="date"
            min="1900-01-01"
            max="2999-12-31"
            value={
              credoper?.assets?.at(0)?.equipment?.registrationDate ?? undefined
            }
            onChange={(e) =>
              setEquipmentField(
                dispatchCredOper,
                credoper,
                0,
                "registrationDate",
                e.target.value,
              )
            }
          />
        </div>
        <div className="col-md-4">
          <InputField
            label="Description"
            id="credoper.equipmentDescription"
            value={credoper?.assets?.at(0)?.equipment?.description ?? undefined}
            onChange={(e) =>
              setEquipmentField(
                dispatchCredOper,
                credoper,
                0,
                "description",
                e.target.value,
              )
            }
          />
        </div>
      </div>
      <div className="row g-3 align-items-end my-2">
        <div className="col-md-4">
          <SelectField
            label="Customer Type"
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
          />
        </div>
      </div>
      <div className="row g-3 align-items-end my-2">
        <div className="col-md-3">
          <SelectField
            label="Financial Product"
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
          />
        </div>
        <div className="col-md-3">
          <InputField
            label="Equipment Amount"
            id="credoper.equipmentAmount"
            type="number"
            placeholder="0.00"
            min={0}
            step={0.01}
            value={credoper?.assets?.at(0)?.equipment?.netAmount ?? undefined}
            onChange={(e) =>
              setEquipmentField(
                dispatchCredOper,
                credoper,
                0,
                "netAmount",
                Number(e.target.value),
              )
            }
            inputGroupSpan="€"
          />
        </div>
        <div className="col-md-3">
          <InputField
            label="Initial Entry Amount"
            id="credoper.equipmentInitialEntryAmount"
            type="number"
            placeholder="0.00"
            min={0}
            max={credoper?.assets?.at(0)?.equipment?.netAmount ?? undefined}
            step={0.01}
            value={
              credoper?.assets?.at(0)?.equipment?.retakeAmount ?? undefined
            }
            onChange={(e) => {
              SetUpdatingFromAmount(true);
              setEquipmentField(
                dispatchCredOper,
                credoper,
                0,
                "retakeAmount",
                Number(e.target.value),
              );
            }}
            inputGroupSpan="€"
          />
        </div>
        <div className="col-md-3">
          <InputField
            label="Initial Entry Percentage"
            id="credoper.equipmentInitialEntryPercentage"
            type="number"
            placeholder="0.00"
            min={-0}
            max={100}
            step={0.01}
            value={
              credoper?.assets?.at(0)?.equipment?.retakePercentage ?? undefined
            }
            onChange={(e) => {
              SetUpdatingFromAmount(false);
              setEquipmentField(
                dispatchCredOper,
                credoper,
                0,
                "retakePercentage",
                Number(e.target.value),
              );
            }}
            inputGroupSpan="%"
          />
        </div>
      </div>
      <div className="row g-3 align-items-end my-2">
        <InputField
          label="Term"
          id="credoper.term"
          type="range"
          min={0}
          max={120}
          step={6}
          value={credoper?.conditions?.at(0)?.term ?? 0}
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
        <div className="d-flex justify-content-between small">
          {termTicks?.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </>
  );
}

export default FinancialData;
