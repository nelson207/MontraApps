import { emptySplitApi as api } from "./emptyApi";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiAuthLogin: build.mutation<
      PostApiAuthLoginApiResponse,
      PostApiAuthLoginApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Auth/Login`,
        method: "POST",
        body: queryArg.loginRequest,
      }),
    }),
    postApiAuthLogout: build.mutation<
      PostApiAuthLogoutApiResponse,
      PostApiAuthLogoutApiArg
    >({
      query: () => ({ url: `/api/Auth/Logout`, method: "POST" }),
    }),
    postApiBasicListsFetchEquipmentBrand: build.mutation<
      PostApiBasicListsFetchEquipmentBrandApiResponse,
      PostApiBasicListsFetchEquipmentBrandApiArg
    >({
      query: (queryArg) => ({
        url: `/api/BasicLists/FetchEquipmentBrand`,
        method: "POST",
        body: queryArg.eqpPricingParam,
      }),
    }),
    postApiBasicListsFetchEquipmentModel: build.mutation<
      PostApiBasicListsFetchEquipmentModelApiResponse,
      PostApiBasicListsFetchEquipmentModelApiArg
    >({
      query: (queryArg) => ({
        url: `/api/BasicLists/FetchEquipmentModel`,
        method: "POST",
        body: queryArg.eqpPricingParam,
      }),
    }),
    postApiBasicListsFetchEquipmentVersion: build.mutation<
      PostApiBasicListsFetchEquipmentVersionApiResponse,
      PostApiBasicListsFetchEquipmentVersionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/BasicLists/FetchEquipmentVersion`,
        method: "POST",
        body: queryArg.eqpPricingParam,
      }),
    }),
    postApiBasicListsFetchValidFinancialProducts: build.mutation<
      PostApiBasicListsFetchValidFinancialProductsApiResponse,
      PostApiBasicListsFetchValidFinancialProductsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/BasicLists/FetchValidFinancialProducts`,
        method: "POST",
        body: queryArg.getFinancialProductBasicListCustomRequest,
      }),
    }),
    postApiBasicListsFetchCompanies: build.mutation<
      PostApiBasicListsFetchCompaniesApiResponse,
      PostApiBasicListsFetchCompaniesApiArg
    >({
      query: () => ({ url: `/api/BasicLists/FetchCompanies`, method: "POST" }),
    }),
    postApiBasicListsFetchBusinessesByCompany: build.mutation<
      PostApiBasicListsFetchBusinessesByCompanyApiResponse,
      PostApiBasicListsFetchBusinessesByCompanyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/BasicLists/FetchBusinessesByCompany`,
        method: "POST",
        body: queryArg.getAplBusinessIdDataListCustomRequest,
      }),
    }),
    postApiCreditOperationsCalculateOperations: build.mutation<
      PostApiCreditOperationsCalculateOperationsApiResponse,
      PostApiCreditOperationsCalculateOperationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/CreditOperations/CalculateOperations`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postApiCreditOperationsCalculateInitialDate: build.mutation<
      PostApiCreditOperationsCalculateInitialDateApiResponse,
      PostApiCreditOperationsCalculateInitialDateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/CreditOperations/CalculateInitialDate`,
        method: "POST",
        body: queryArg.calculateInitialDateCustomRequest,
      }),
    }),
    getApiNotificationsSendMessage: build.query<
      GetApiNotificationsSendMessageApiResponse,
      GetApiNotificationsSendMessageApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Notifications/SendMessage`,
        params: {
          message: queryArg.message,
        },
      }),
    }),
    postApiSimulationsCalculateOperations: build.mutation<
      PostApiSimulationsCalculateOperationsApiResponse,
      PostApiSimulationsCalculateOperationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Simulations/CalculateOperations`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as ArNextAPI };
export type PostApiAuthLoginApiResponse = unknown;
export type PostApiAuthLoginApiArg = {
  loginRequest: LoginRequest;
};
export type PostApiAuthLogoutApiResponse = unknown;
export type PostApiAuthLogoutApiArg = void;
export type PostApiBasicListsFetchEquipmentBrandApiResponse = unknown;
export type PostApiBasicListsFetchEquipmentBrandApiArg = {
  eqpPricingParam: EqpPricingParam;
};
export type PostApiBasicListsFetchEquipmentModelApiResponse = unknown;
export type PostApiBasicListsFetchEquipmentModelApiArg = {
  eqpPricingParam: EqpPricingParam;
};
export type PostApiBasicListsFetchEquipmentVersionApiResponse = unknown;
export type PostApiBasicListsFetchEquipmentVersionApiArg = {
  eqpPricingParam: EqpPricingParam;
};
export type PostApiBasicListsFetchValidFinancialProductsApiResponse = unknown;
export type PostApiBasicListsFetchValidFinancialProductsApiArg = {
  getFinancialProductBasicListCustomRequest: GetFinancialProductBasicListCustomRequest;
};
export type PostApiBasicListsFetchCompaniesApiResponse = unknown;
export type PostApiBasicListsFetchCompaniesApiArg = void;
export type PostApiBasicListsFetchBusinessesByCompanyApiResponse = unknown;
export type PostApiBasicListsFetchBusinessesByCompanyApiArg = {
  getAplBusinessIdDataListCustomRequest: GetAplBusinessIdDataListCustomRequest;
};
export type PostApiCreditOperationsCalculateOperationsApiResponse = unknown;
export type PostApiCreditOperationsCalculateOperationsApiArg = {
  body: string;
};
export type PostApiCreditOperationsCalculateInitialDateApiResponse = unknown;
export type PostApiCreditOperationsCalculateInitialDateApiArg = {
  calculateInitialDateCustomRequest: CalculateInitialDateCustomRequest;
};
export type GetApiNotificationsSendMessageApiResponse = unknown;
export type GetApiNotificationsSendMessageApiArg = {
  message?: string;
};
export type PostApiSimulationsCalculateOperationsApiResponse = unknown;
export type PostApiSimulationsCalculateOperationsApiArg = {
  body: string;
};
export type LoginRequest = {
  email: string | null;
  password: string | null;
  twoFactorCode?: string | null;
  twoFactorRecoveryCode?: string | null;
};
export type ExtensionDataObject = object;
export type EqpPricingOptionContext = 0 | 1 | 2 | 7;
export type EqpPricingRvCalcSource = 0 | 1 | 2 | 3 | 4 | 5;
export type EqpPricingRvCalcInfo = {
  extensionData?: ExtensionDataObject;
  accountDatek__BackingField?: string;
  calcSourcek__BackingField?: EqpPricingRvCalcSource;
  credOperAssetIdk__BackingField?: number | null;
  equipmentIdk__BackingField?: number | null;
  isRVUserDefinedk__BackingField?: boolean | null;
  newAssetUsagek__BackingField?: number | null;
  newTermk__BackingField?: number | null;
  oldAssetUsagek__BackingField?: number | null;
  oldTermk__BackingField?: number | null;
  relatedAplTableIdk__BackingField?: number | null;
  relatedIdk__BackingField?: number | null;
  valueDatek__BackingField?: string;
};
export type EqpOptionPricingInfo = {
  extensionData?: ExtensionDataObject;
  abrev?: string | null;
  basePrice?: number | null;
  code?: string | null;
  description?: string | null;
  discountAmount?: number | null;
  discountId?: number | null;
  discountInputModeId?: number | null;
  discountPercentage?: number | null;
  entityId?: number | null;
  isManual?: boolean | null;
  marketValue?: number | null;
  month?: number | null;
  netAmount?: number | null;
  optionContextId?: number | null;
  purchaseAmount?: number | null;
  reason?: string | null;
  taxAmount?: number | null;
  taxTypeId?: number | null;
  year?: number | null;
};
export type EqpPricingInputField = 0 | 1;
export type EqpPricingParam = {
  extensionData?: ExtensionDataObject;
  age?: number | null;
  annualUsage?: number | null;
  assetPurposeId?: number | null;
  baseNetAmount?: number | null;
  brand?: string | null;
  brandsList?: string[] | null;
  calculationDate?: string | null;
  carConfiguratorId?: string | null;
  clientTaxRegimeId?: number | null;
  currencyId?: string | null;
  currentUsage?: number | null;
  customerEntityId?: number | null;
  equipmentCategory?: number | null;
  equipmentNetAmount?: number | null;
  equipmentPolicyId?: number | null;
  equipmentPurchaseAmount?: number | null;
  equipmentState?: number | null;
  equipmentType?: number | null;
  finalAge?: number | null;
  finalUsage?: number | null;
  financialProductId?: number | null;
  firstRegistrationDate?: string | null;
  fiscalC02Emissions?: number | null;
  fiscalHorsePower?: number | null;
  fuelType?: number | null;
  horsePower?: number | null;
  importerStructNodeId?: number | null;
  initialEntryPercentage?: number | null;
  isRelocation?: boolean | null;
  licensePlate?: string | null;
  manufacturerKeyNumber?: string | null;
  marketValue?: number | null;
  maxLoadCapacity?: number | null;
  model?: string | null;
  modelCode?: string | null;
  modelsList?: string[] | null;
  month?: number | null;
  numOfDoors?: number | null;
  operationBeginDate?: string | null;
  operationChannelId?: number | null;
  operationEntryMoment?: string | null;
  operationType?: number | null;
  optionsContext?: EqpPricingOptionContext;
  otherSerialNumber?: string | null;
  preModelCode?: string | null;
  preModelCodeInputModeId?: number | null;
  productLineId?: number | null;
  purposeTypeId?: number | null;
  rvCalcInfo?: EqpPricingRvCalcInfo;
  relocatedEquipmentId?: number | null;
  remarketingCosts?: number | null;
  residualValue?: number | null;
  residualValuePerc?: number | null;
  selectedOptions?: EqpOptionPricingInfo[] | null;
  serialNumber?: string | null;
  sourceApplicationId?: number | null;
  supplierDiscountPercentage?: number | null;
  supplierEntityId?: number | null;
  tableCode?: string | null;
  tableCodesList?: string[] | null;
  taxTypeId?: number | null;
  term?: number | null;
  totalAccessoriesAmount?: number | null;
  totalGrantsAmount?: number | null;
  totalOptionsAmount?: number | null;
  totalOptionsBaseMarketValue?: number | null;
  totalOptionsBaseNetAmount?: number | null;
  traction?: string | null;
  typeKeyNumber?: string | null;
  usage?: number | null;
  userInputField?: EqpPricingInputField;
  valueDate?: string | null;
  variant?: string | null;
  vehicleTransmissionTypeId?: number | null;
  vendorProtocolId?: number | null;
  version?: string | null;
  versionsList?: string[] | null;
  year?: number | null;
};
export type GetFinancialProductBasicListCustomRequest = {
  aplCompanyId?: number | null;
  aplBusinessId?: number | null;
  importerId?: number | null;
  purposeTypeId?: number | null;
  marketCampaignId?: number | null;
  customerTypeId?: number | null;
  addProductsWithoutImporters?: boolean;
  credOperChannelId?: number | null;
  productPurpose?: number | null;
  credOperTypeId?: number | null;
};
export type GetAplBusinessIdDataListCustomRequest = {
  aplCompanyId?: number;
  wantedAplBusinessId?: number[] | null;
};
export type CalculateInitialDateCustomRequest = {
  credOperTypeId?: number;
  entryDate?: string;
  clientSignatureDate?: string | null;
};
export const {
  usePostApiAuthLoginMutation,
  usePostApiAuthLogoutMutation,
  usePostApiBasicListsFetchEquipmentBrandMutation,
  usePostApiBasicListsFetchEquipmentModelMutation,
  usePostApiBasicListsFetchEquipmentVersionMutation,
  usePostApiBasicListsFetchValidFinancialProductsMutation,
  usePostApiBasicListsFetchCompaniesMutation,
  usePostApiBasicListsFetchBusinessesByCompanyMutation,
  usePostApiCreditOperationsCalculateOperationsMutation,
  usePostApiCreditOperationsCalculateInitialDateMutation,
  useGetApiNotificationsSendMessageQuery,
  usePostApiSimulationsCalculateOperationsMutation,
} = injectedRtkApi;
