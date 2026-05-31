import { useEffect, useState } from "react";
import { INITIAL_OPTIONS } from "../utils/quotations.constants";
import type {
  OptionsState,
  UseQuotationOptionsParams,
} from "../types/credoperTypes";
import useQuotationBootstrap from "./useQuotationBootstrap";

export function useQuotationOptions({
  equipmentTypeId,
}: UseQuotationOptionsParams) {
  const [options, setOptions] = useState<OptionsState>(INITIAL_OPTIONS);
  const {
    GetFinancialProducts,
    GetEquipmentTypes,
    GetEquipmentStates,
    GetCredoperClassifications,
    GetEquipmentCategories,
  } = useQuotationBootstrap();

  useEffect(() => {
    void Promise.all([
      loadOption("equipmentTypes"),
      loadOption("equipmentStates"),
      loadOption("credOperClassifications"),
      loadOption("financialProducts"),
    ]);
  }, []);

  useEffect(() => {
    if (equipmentTypeId) {
      void loadOption("equipmentCategories");
    } else {
      setOptions((prev) => ({ ...prev, equipmentCategories: [] }));
    }
  }, [equipmentTypeId]);

  const loadOption = async (key: keyof OptionsState) => {
    try {
      let data;

      switch (key) {
        case "financialProducts":
          data = await GetFinancialProducts({
            getFinancialProductBasicListCustomRequest: {
              addProductsWithoutImporters: true,
            },
          }).unwrap();
          break;

        case "equipmentTypes":
          data = await GetEquipmentTypes({
            getEquipmentTypeByKeysV2Request: {},
          }).unwrap();
          break;

        case "equipmentStates":
          data = await GetEquipmentStates({
            getEquipmentStateByKeysV2Request: {},
          }).unwrap();
          break;

        case "credOperClassifications":
          data = await GetCredoperClassifications({
            getCredOperClassificationByKeysV2Request: {},
          }).unwrap();
          break;

        case "equipmentCategories":
          data = await GetEquipmentCategories({
            getEquipmentCategoryDataListCustomRequest: {
              equipmentTypeId: Number(equipmentTypeId ?? 0),
            },
          }).unwrap();
          break;
      }

      setOptions((prev) => ({
        ...prev,
        [key]: data ?? [],
      }));
    } catch (err) {
      console.error(`Failed to fetch ${key}:`, err);
    }
  };

  return {
    options,
    reloadOption: loadOption, // optional external trigger
  };
}
