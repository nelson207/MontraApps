import {
  usePostApiBasicListsFetchCredOperClassificationMutation,
  usePostApiBasicListsFetchEquipmentCategoryMutation,
  usePostApiBasicListsFetchEquipmentStateMutation,
  usePostApiBasicListsFetchEquipmentTypeMutation,
  usePostApiCreditOperationsGetFinancialProductTermRestrictionMutation,
  usePostApiSimulationsGetFinancialProductDetailsMutation,
} from "@platform/api/legacy/legacyApi";

export default function useQuotationBootstrap() {

  const [GetEquipmentTypes, { isLoading: fetchingEquipmentTypes }] =
    usePostApiBasicListsFetchEquipmentTypeMutation();

  const [GetEquipmentStates, { isLoading: fetchingEquipmentStates }] =
    usePostApiBasicListsFetchEquipmentStateMutation();

  const [GetEquipmentCategories, { isLoading: fetchingEquipmentCategories }] =
    usePostApiBasicListsFetchEquipmentCategoryMutation();

  const [
    GetCredoperClassifications,
    { isLoading: fetchingCredoperClassifications },
  ] = usePostApiBasicListsFetchCredOperClassificationMutation();

  const [GetFinancialProductDetail] =
    usePostApiSimulationsGetFinancialProductDetailsMutation();


  const [GetFinancialProductTermRestriction] =
    usePostApiCreditOperationsGetFinancialProductTermRestrictionMutation();

  return {
    GetEquipmentTypes,
    GetEquipmentStates,
    GetEquipmentCategories,
    GetCredoperClassifications,
    GetFinancialProductDetail,
    GetFinancialProductTermRestriction,
    fetchingEquipmentTypes,
    fetchingEquipmentStates,
    fetchingEquipmentCategories,
    fetchingCredoperClassifications,
  };
}
