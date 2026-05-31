import {
  usePostApiBasicListsFetchCredOperClassificationMutation,
  usePostApiBasicListsFetchEquipmentCategoryMutation,
  usePostApiBasicListsFetchEquipmentStateMutation,
  usePostApiBasicListsFetchEquipmentTypeMutation,
  usePostApiBasicListsFetchValidFinancialProductsMutation,
  usePostApiCreditOperationsGetDefaultValuesFromFinancialProductMutation,
  usePostApiCreditOperationsGetFinancialProductTermRestrictionMutation,
  usePostApiSimulationsGetFinancialProductDetailsMutation,
} from "../../../services/api/generated/MontraPOSApi";

export default function useQuotationBootstrap() {
  const [GetFinancialProducts, { isLoading: fetchingFinancialProducts }] =
    usePostApiBasicListsFetchValidFinancialProductsMutation();

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

  const [GetDefaultValuesFromFinancialProduct] =
    usePostApiCreditOperationsGetDefaultValuesFromFinancialProductMutation();

  const [GetFinancialProductTermRestriction] =
    usePostApiCreditOperationsGetFinancialProductTermRestrictionMutation();

  return {
    GetFinancialProducts,
    GetEquipmentTypes,
    GetEquipmentStates,
    GetEquipmentCategories,
    GetCredoperClassifications,
    GetFinancialProductDetail,
    GetDefaultValuesFromFinancialProduct,
    GetFinancialProductTermRestriction,
    fetchingFinancialProducts,
    fetchingEquipmentTypes,
    fetchingEquipmentStates,
    fetchingEquipmentCategories,
    fetchingCredoperClassifications,
  };
}
