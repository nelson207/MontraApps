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
  | "registrationDate"
  | "description"
  | "odometer"
  | "enginesize"
  | "doors"
  | "baseMarketValue"
> & {
  /** Vehicle identification number (17 characters) */
  vin?: string | null;
};

export type EquipmentField = Exclude<keyof EquipmentValue, "baseMarketValue">;

/** How a field shows: Credit takes it from the server's field metadata, Stock Credit sets its own */
export type EquipmentFieldRule = { visible: boolean; required: boolean; readOnly: boolean };

export const OPTIONAL_FIELD: EquipmentFieldRule = { visible: true, required: false, readOnly: false };
