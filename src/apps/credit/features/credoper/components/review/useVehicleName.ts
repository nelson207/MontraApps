import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetEquipmentBrandsQuery,
  useGetEquipmentModelsQuery,
  useGetEquipmentVersionsQuery,
} from "@platform/features/equipment/api/equipmentApi";
import { labelOfCode } from "@platform/features/equipment/api/equipmentLists";
import type { CredOperDraft } from "../../model/credOperDraft";

/** A vehicle's name: brand, model and version once their lists are in, else what else tells it apart */
export function useVehicleName(op: CredOperDraft, index: number): string | null {
  const equipment = op.assets?.[index]?.equipment;
  const typeId = equipment?.equipmentTypeId;
  const categoryId = equipment?.equipmentCategoryId;
  const brand = equipment?.brand;
  const model = equipment?.model;
  const brands = useGetEquipmentBrandsQuery(typeId && categoryId ? { equipmentTypeId: typeId, categoryId } : skipToken);
  const models = useGetEquipmentModelsQuery(typeId && categoryId && brand ? { equipmentTypeId: typeId, categoryId, brand } : skipToken);
  const versions = useGetEquipmentVersionsQuery(
    typeId && categoryId && brand && model ? { equipmentTypeId: typeId, categoryId, brand, model } : skipToken,
  );
  const named = [labelOfCode(brands.data, brand), labelOfCode(models.data, model), labelOfCode(versions.data, equipment?.version)]
    .filter(Boolean)
    .join(" ");
  return named || equipment?.description || equipment?.licencePlate || null;
}
