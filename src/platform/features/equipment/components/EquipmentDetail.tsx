import type { ReactNode } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import InputField from "@platform/components/ui/InputField";
import SelectField from "@platform/components/ui/SelectField";
import { problemMessage } from "@platform/api/problemCode";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import {
  useGetEquipmentBrandsQuery,
  useGetEquipmentCategoriesQuery,
  useGetEquipmentModelsQuery,
  useGetEquipmentStatesQuery,
  useGetEquipmentTypesQuery,
  useGetEquipmentVersionsQuery,
} from "../api/equipmentApi";
import type { CodeItem } from "../api/equipmentLists";
import {
  OPTIONAL_FIELD,
  type EquipmentField,
  type EquipmentFieldRule,
  type EquipmentValue,
} from "../equipmentModel";

type Props = {
  value: EquipmentValue;
  onChange: (changes: Partial<EquipmentValue>) => void;
  /** Element ids: `${idPrefix}-brand`, … (unique per vehicle on the page) */
  idPrefix: string;
  /** The company whose equipment types and categories are listed (when the app has one) */
  companyId?: number | null;
  /** Validation message per field (only once errors should show) */
  error?: (field: EquipmentField) => string | null | undefined;
  /** Visible / required / read-only per field; every field visible, optional and editable by default */
  rule?: (field: EquipmentField) => EquipmentFieldRule;
  /** Ask for the VIN (Stock Credit) */
  withVin?: boolean;
  /** The informative commercial value next to the "Vehicle" title */
  showCommercialValue?: boolean;
  /** More fields in the Usage row (e.g. Renting's vehicle amount) */
  usageExtra?: ReactNode;
};

const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

/** What a change clears: every list after it depends on it */
const AFTER_BRAND = { model: null, version: null };
const AFTER_CATEGORY = { brand: null, ...AFTER_BRAND };
const AFTER_TYPE = { equipmentCategoryId: null, ...AFTER_CATEGORY };

const toNumber = (raw: string): number | null => (raw.trim() === "" ? null : Number(raw));

const asCodeOptions = (items?: CodeItem[]) =>
  items?.map((item) => ({ value: item.code, label: item.abbreviation, title: item.description }));

// The vehicle: type → category → brand → model → version (each list waits for the one before and
// changing one clears the ones after it), state, (VIN,) plate, registration date and description,
// then its usage: km, engine size and doors. The lists come from the API (cached and shared);
// brand, model and version are kept as the API's codes. The app owns the value, the field rules
// and the validation.
function EquipmentDetail({
  value,
  onChange,
  idPrefix,
  companyId,
  error = () => null,
  rule = () => OPTIONAL_FIELD,
  withVin = false,
  showCommercialValue = false,
  usageExtra,
}: Props) {
  const typeId = value.equipmentTypeId ?? null;
  const categoryId = value.equipmentCategoryId ?? null;
  const brand = value.brand ?? "";
  const model = value.model ?? "";

  const types = useGetEquipmentTypesQuery({ companyId });
  const categories = useGetEquipmentCategoriesQuery(typeId ? { companyId, equipmentTypeId: typeId } : skipToken);
  const brands = useGetEquipmentBrandsQuery(typeId && categoryId ? { equipmentTypeId: typeId, categoryId } : skipToken);
  const models = useGetEquipmentModelsQuery(typeId && categoryId && brand ? { equipmentTypeId: typeId, categoryId, brand } : skipToken);
  const versions = useGetEquipmentVersionsQuery(
    typeId && categoryId && brand && model ? { equipmentTypeId: typeId, categoryId, brand, model } : skipToken,
  );
  const states = useGetEquipmentStatesQuery();
  const listError = [types, categories, brands, models, versions, states].find((list) => list.isError);

  const id = (field: string) => `${idPrefix}-${field}`;

  /** The field per its rule: hidden → nothing; read-only → disabled; required → "*" */
  const field = (name: EquipmentField, render: (props: { required: boolean; disabled: boolean; invalidMessage: string | null }) => ReactNode) => {
    const r = rule(name);
    if (!r.visible) return null;
    return render({ required: r.required, disabled: r.readOnly, invalidMessage: error(name) ?? null });
  };

  const numberField = (name: "odometer" | "enginesize" | "doors", label: string, unit: string) =>
    field(name, (props) => (
      <InputField
        label={label}
        id={id(name)}
        type="number"
        min={0}
        step={1}
        inputGroupSpan={unit}
        value={value[name] ?? ""}
        onChange={(e) => onChange({ [name]: toNumber(e.target.value) })}
        {...props}
      />
    ));

  const codeSelect = (
    name: "equipmentTypeId" | "equipmentCategoryId" | "equipmentStateId",
    label: string,
    list: { currentData?: CodeItem[]; isFetching: boolean },
    changes: (code: number) => Partial<EquipmentValue>,
    placeholder?: string,
    disabled = false,
  ) =>
    field(name, (props) => (
      <SelectField
        label={label}
        id={id(name)}
        placeholder={placeholder}
        isLoading={list.isFetching}
        value={value[name] ?? undefined}
        options={asCodeOptions(list.currentData)}
        onChange={(e) => onChange(changes(Number(e.target.value)))}
        disabled={props.disabled || disabled}
        invalidMessage={props.invalidMessage}
      />
    ));

  const vinVisible = withVin && rule("vin").visible;

  return (
    <>
      {listError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
          <span className="flex-grow-1">
            {problemMessage(listError.error) ?? getApiErrorMessage(listError.error) ?? "Couldn't load the vehicle lists."}
          </span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => listError.refetch()}>
            Retry
          </button>
        </div>
      )}

      <div className="app-form-section justify-content-between flex-wrap gap-2">
        <h4 className="fs-6 fw-semibold mb-0 text-reset">
          <i className="bi bi-car-front me-2" aria-hidden="true" />
          Vehicle
        </h4>
        {showCommercialValue && (
          <div className="app-commercial-value" title="Informative value">
            <span>Commercial value</span>
            <strong>{value.baseMarketValue != null ? money.format(value.baseMarketValue) : "—"}</strong>
          </div>
        )}
      </div>

      <div className="row gx-3">
        <div className="col-md-4">
          {/* Everything after the type depends on it */}
          {codeSelect("equipmentTypeId", "Equipment type", types, (code) => ({
            equipmentTypeId: code,
            ...AFTER_TYPE,
          }))}
        </div>
        <div className="col-md-4">
          {codeSelect(
            "equipmentCategoryId",
            "Equipment category",
            categories,
            (code) => ({ equipmentCategoryId: code, ...AFTER_CATEGORY }),
            typeId ? undefined : "Select a type first",
            !typeId,
          )}
        </div>
        <div className="col-md-4">
          {codeSelect("equipmentStateId", "Equipment state", states, (code) => ({ equipmentStateId: code }))}
        </div>
        <div className="col-md-4">
          {field("brand", (props) => (
            <SelectField
              label="Brand"
              id={id("brand")}
              placeholder={categoryId ? "Select a brand" : "Select a category first"}
              isLoading={brands.isFetching}
              value={brand || undefined}
              // currentData: never offer the previous category or brand's list while the new one loads
              options={asCodeOptions(brands.currentData)}
              onChange={(e) => onChange({ brand: e.target.value, ...AFTER_BRAND })}
              disabled={props.disabled || !categoryId}
              invalidMessage={props.invalidMessage}
            />
          ))}
        </div>
        <div className="col-md-4">
          {field("model", (props) => (
            <SelectField
              label="Model"
              id={id("model")}
              placeholder={brand ? "Select a model" : "Select a brand first"}
              isLoading={models.isFetching}
              value={model || undefined}
              options={asCodeOptions(models.currentData)}
              onChange={(e) => onChange({ model: e.target.value, version: null })}
              disabled={props.disabled || !brand}
              invalidMessage={props.invalidMessage}
            />
          ))}
        </div>
        <div className="col-md-4">
          {field("version", (props) => (
            <SelectField
              label="Version"
              id={id("version")}
              placeholder={model ? "Select a version" : "Select a model first"}
              isLoading={versions.isFetching}
              value={value.version || undefined}
              options={asCodeOptions(versions.currentData)}
              onChange={(e) => onChange({ version: e.target.value })}
              disabled={props.disabled || !model}
              invalidMessage={props.invalidMessage}
            />
          ))}
        </div>

        {vinVisible && (
          <div className="col-md-4">
            {field("vin", (props) => (
              <InputField
                label="VIN"
                id={id("vin")}
                placeholder="17 characters"
                value={value.vin ?? ""}
                // VINs are upper case, 17 characters
                onChange={(e) => onChange({ vin: e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 17) })}
                {...props}
              />
            ))}
          </div>
        )}
        <div className="col-md-4">
          {field("licencePlate", (props) => (
            <InputField
              label="License plate"
              id={id("licencePlate")}
              value={value.licencePlate ?? ""}
              onChange={(e) => onChange({ licencePlate: e.target.value })}
              {...props}
            />
          ))}
        </div>
        <div className="col-md-4">
          {field("registrationDate", (props) => (
            <InputField
              label="Registration date"
              id={id("registrationDate")}
              type="date"
              min="1900-01-01"
              max={today()}
              value={value.registrationDate?.slice(0, 10) ?? ""}
              onChange={(e) => onChange({ registrationDate: e.target.value || null })}
              {...props}
            />
          ))}
        </div>
        <div className={vinVisible ? "col-12" : "col-md-4"}>
          {field("description", (props) => (
            <InputField
              label="Description"
              id={id("description")}
              value={value.description ?? ""}
              onChange={(e) => onChange({ description: e.target.value })}
              {...props}
            />
          ))}
        </div>
      </div>

      <h4 className="app-form-section">
        <i className="bi bi-speedometer2 me-2" aria-hidden="true" />
        Usage
      </h4>
      <div className="row gx-3">
        <div className="col-md-4">{numberField("odometer", "Km", "km")}</div>
        <div className="col-md-4">{numberField("enginesize", "Engine size", "cc")}</div>
        <div className="col-md-4">{numberField("doors", "Doors", "#")}</div>
        {usageExtra}
      </div>
    </>
  );
}

export default EquipmentDetail;
