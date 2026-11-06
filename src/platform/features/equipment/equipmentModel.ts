import type { EquipmentDto } from "@platform/api/legacy/legacyApi";

// The equipment (vehicle) detail shared by the Montra apps that finance vehicles: Credit's
// operations and Stock Credit's stock units. Field names are the API's (EquipmentDto), plus the
// VIN, which only Stock Credit asks for.

export type EquipmentValue = Pick<
  EquipmentDto,
  | "brand"
  | "model"
  | "version"
  | "equipmentTypeId"
  | "equipmentCategoryId"
  | "equipmentStateId"
  | "licencePlate"
  | "description"
  | "odometer"
  | "enginesize"
  | "doors"
  | "baseMarketValue"
> & {
  /** Vehicle identification number (17 characters) */
  vin?: string | null;
  /** The vehicle's year and month */
  equipYear?: number | null;
  equipMonth?: number | null;
};

export type EquipmentField = Exclude<keyof EquipmentValue, "baseMarketValue">;

/** How a field shows: Credit takes it from the server's field metadata, Stock Credit sets its own */
export type EquipmentFieldRule = { visible: boolean; required: boolean; readOnly: boolean };

export const OPTIONAL_FIELD: EquipmentFieldRule = { visible: true, required: false, readOnly: false };

// Which vehicle fields are mandatory depends on the screen; each one passes its own rule.
/** Identify the kind of vehicle (e.g. a quotation) */
export const VEHICLE_KIND_FIELDS = ["equipmentTypeId", "equipmentCategoryId", "equipmentStateId"] as const satisfies readonly EquipmentField[];
/** And the exact vehicle (e.g. a proposal or a stock unit) */
export const VEHICLE_FULL_FIELDS = [...VEHICLE_KIND_FIELDS, "brand", "model", "version"] as const satisfies readonly EquipmentField[];

/** Every vehicle field whose being mandatory depends on the screen and the state */
export const VEHICLE_RULED_FIELDS = [...VEHICLE_FULL_FIELDS, "equipYear", "equipMonth"] as const satisfies readonly EquipmentField[];

/** Equipment states of a used vehicle (the API's ids: Usado, Importado Usado) */
const USED_EQUIPMENT_STATES = [1, 3];

export const isUsedEquipmentState = (stateId: number | null | undefined): boolean => stateId != null && USED_EQUIPMENT_STATES.includes(stateId);

/** The vehicle's date, on every screen: the year always, and the month when it is used */
const vehicleDateFields = (stateId: number | null | undefined): EquipmentField[] => ["equipYear", ...(isUsedEquipmentState(stateId) ? (["equipMonth"] as const) : [])];

/** The kind of vehicle and its date (e.g. a quotation) */
export const vehicleKindFieldsRequired = (stateId: number | null | undefined): EquipmentField[] => [...VEHICLE_KIND_FIELDS, ...vehicleDateFields(stateId)];

/** The exact vehicle and its date (e.g. a proposal or a stock unit) */
export const vehicleFieldsRequired = (stateId: number | null | undefined): EquipmentField[] => [...VEHICLE_FULL_FIELDS, ...vehicleDateFields(stateId)];

/** From 1900 to next year: a new vehicle can already be next year's model */
export const isValidVehicleYear = (year: number, today: string): boolean =>
  Number.isInteger(year) && year >= 1900 && year <= Number(today.slice(0, 4)) + 1;

export const isValidVehicleMonth = (month: number): boolean => Number.isInteger(month) && month >= 1 && month <= 12;
