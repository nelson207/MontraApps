import { emptySplitApi as api } from "../emptyApi";

// LEGACY (TODO): the previous generated API (2026-10-05), kept by hand while the backend's new API
// (generated/MontraPOSApi.ts, 2026-10-21) doesn't cover everything the apps use:
//   - endpoints the new API dropped (save / search / quotation → proposal, basic lists, product
//     details, term restriction, password requirements, notifications…): placeholders until the
//     backend adds them back; the demo backend answers them in development;
//   - the old DTO shapes, still the apps' working shapes (e.g. the Credit wizard's draft keeps the
//     customer and the people, which the new CredOperDto no longer carries).
// Only the endpoints still used are kept (removed as the apps move to the new API). Don't
// regenerate this file.
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiBasicListsFetchEquipmentType: build.mutation<
      PostApiBasicListsFetchEquipmentTypeApiResponse,
      PostApiBasicListsFetchEquipmentTypeApiArg
    >({
      query: (queryArg) => ({
        url: `/api/BasicLists/FetchEquipmentType`,
        method: "POST",
        body: queryArg.getEquipmentTypeByKeysV2Request,
      }),
    }),
    postApiBasicListsFetchEquipmentCategory: build.mutation<
      PostApiBasicListsFetchEquipmentCategoryApiResponse,
      PostApiBasicListsFetchEquipmentCategoryApiArg
    >({
      query: (queryArg) => ({
        url: `/api/BasicLists/FetchEquipmentCategory`,
        method: "POST",
        body: queryArg.getEquipmentCategoryDataListCustomRequest,
      }),
    }),
    postApiBasicListsFetchEquipmentState: build.mutation<
      PostApiBasicListsFetchEquipmentStateApiResponse,
      PostApiBasicListsFetchEquipmentStateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/BasicLists/FetchEquipmentState`,
        method: "POST",
        body: queryArg.getEquipmentStateByKeysV2Request,
      }),
    }),
    postApiBasicListsFetchCredOperClassification: build.mutation<
      PostApiBasicListsFetchCredOperClassificationApiResponse,
      PostApiBasicListsFetchCredOperClassificationApiArg
    >({
      query: (queryArg) => ({
        url: `/api/BasicLists/FetchCredOperClassification`,
        method: "POST",
        body: queryArg.getCredOperClassificationByKeysV2Request,
      }),
    }),
    postApiCreditOperationsSearchOperations: build.mutation<
      PostApiCreditOperationsSearchOperationsApiResponse,
      PostApiCreditOperationsSearchOperationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/CreditOperations/SearchOperations`,
        method: "POST",
        body: queryArg.creditOperationSearchRequest,
      }),
    }),
    postApiCreditOperationsQuotationToProposal: build.mutation<
      PostApiCreditOperationsQuotationToProposalApiResponse,
      PostApiCreditOperationsQuotationToProposalApiArg
    >({
      query: (queryArg) => ({
        url: `/api/CreditOperations/QuotationToProposal`,
        method: "POST",
        body: queryArg.credOperDto,
      }),
    }),
    postApiCreditOperationsSaveCredOper: build.mutation<
      PostApiCreditOperationsSaveCredOperApiResponse,
      PostApiCreditOperationsSaveCredOperApiArg
    >({
      query: (queryArg) => ({
        url: `/api/CreditOperations/SaveCredOper`,
        method: "POST",
        body: queryArg.credOperDto,
      }),
    }),
    postApiCreditOperationsGetFinancialProductTermRestriction: build.mutation<
      PostApiCreditOperationsGetFinancialProductTermRestrictionApiResponse,
      PostApiCreditOperationsGetFinancialProductTermRestrictionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/CreditOperations/GetFinancialProductTermRestriction`,
        method: "POST",
        body: queryArg.credOperDto,
      }),
    }),
    postApiSimulationsGetFinancialProductDetails: build.mutation<
      PostApiSimulationsGetFinancialProductDetailsApiResponse,
      PostApiSimulationsGetFinancialProductDetailsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Simulations/GetFinancialProductDetails`,
        method: "POST",
        body: queryArg.financialProductDetailsRequest,
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as LegacyApi };
export type PostApiAuthLoginApiResponse = /** status 200 OK */ LoginResponseDto;
export type PostApiAuthLoginApiArg = {
  loginRequestDto: LoginRequestDto;
};
export type PostApiAuthRecoverPasswordApiResponse = /** status 200 OK */ string;
export type PostApiAuthRecoverPasswordApiArg = {
  recoverPasswordDto: RecoverPasswordDto;
};
export type PostApiAuthLogoutApiResponse = unknown;
export type PostApiAuthLogoutApiArg = void;
export type PostApiAuthChangePasswordApiResponse = unknown;
export type PostApiAuthChangePasswordApiArg = {
  changePasswordDto: ChangePasswordDto;
};
export type PostApiAuthGetPasswordRequirementsApiResponse = unknown;
export type PostApiAuthGetPasswordRequirementsApiArg = void;
export type PostApiAuthSetupAuthenticatorApiResponse =
  /** status 200 OK */ SetupAuthenticatorResponseDto;
export type PostApiAuthSetupAuthenticatorApiArg = void;
export type PostApiAuthVerifyAuthenticatorApiResponse = unknown;
export type PostApiAuthVerifyAuthenticatorApiArg = {
  verifyAuthenticatorRequestDto: VerifyAuthenticatorRequestDto;
};
export type PostApiAuthValidate2FaApiResponse =
  /** status 200 OK */ LoginResponseDto;
export type PostApiAuthValidate2FaApiArg = {
  validateTwoFactorRequestDto: ValidateTwoFactorRequestDto;
};
export type PostApiBasicListsFetchEquipmentTypeApiResponse =
  /** status 200 OK */ CodeAbbreviation[];
export type PostApiBasicListsFetchEquipmentTypeApiArg = {
  getEquipmentTypeByKeysV2Request: GetEquipmentTypeByKeysV2Request;
};
export type PostApiBasicListsFetchEquipmentCategoryApiResponse =
  /** status 200 OK */ CodeAbbreviation[];
export type PostApiBasicListsFetchEquipmentCategoryApiArg = {
  getEquipmentCategoryDataListCustomRequest: GetEquipmentCategoryDataListCustomRequest;
};
export type PostApiBasicListsFetchEquipmentStateApiResponse =
  /** status 200 OK */ CodeAbbreviation[];
export type PostApiBasicListsFetchEquipmentStateApiArg = {
  getEquipmentStateByKeysV2Request: GetEquipmentStateByKeysV2Request;
};
export type PostApiBasicListsFetchCredOperClassificationApiResponse =
  /** status 200 OK */ CodeAbbreviation[];
export type PostApiBasicListsFetchCredOperClassificationApiArg = {
  getCredOperClassificationByKeysV2Request: GetCredOperClassificationByKeysV2Request;
};
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
export type PostApiBasicListsFetchValidFinancialProductsApiResponse =
  /** status 200 OK */ CodeAbbreviation[];
export type PostApiBasicListsFetchValidFinancialProductsApiArg = {
  getFinancialProductBasicListCustomRequest: GetFinancialProductBasicListCustomRequest;
};
export type PostApiBasicListsFetchCompaniesApiResponse = unknown;
export type PostApiBasicListsFetchCompaniesApiArg = void;
export type PostApiBasicListsFetchBusinessesByCompanyApiResponse = unknown;
export type PostApiBasicListsFetchBusinessesByCompanyApiArg = {
  getAplBusinessIdDataListCustomRequest: GetAplBusinessIdDataListCustomRequest;
};
export type GetApiCreditOperationsGetNewCredOperApiResponse =
  /** status 200 OK */ CredOperDto;
export type GetApiCreditOperationsGetNewCredOperApiArg = {
  includeCustomer?: boolean;
};
export type GetApiCreditOperationsGetNewIntervCustomerApiResponse =
  /** status 200 OK */ CredOperIntervDto;
export type GetApiCreditOperationsGetNewIntervCustomerApiArg = void;
export type GetApiCreditOperationsGetNewIntervOthersApiResponse =
  /** status 200 OK */ CredOperIntervDto;
export type GetApiCreditOperationsGetNewIntervOthersApiArg = void;
export type GetApiCreditOperationsGetNewIntervGuarantorApiResponse =
  /** status 200 OK */ CredOperIntervDto;
export type GetApiCreditOperationsGetNewIntervGuarantorApiArg = void;
export type PostApiCreditOperationsSearchOperationsApiResponse =
  /** status 200 OK */ CredOperDto[];
export type PostApiCreditOperationsSearchOperationsApiArg = {
  creditOperationSearchRequest: CreditOperationSearchRequest;
};
export type PostApiCreditOperationsCalculateOperationsApiResponse =
  /** status 200 OK */ CredOperDto;
export type PostApiCreditOperationsCalculateOperationsApiArg = {
  credOperDto: CredOperDto;
};
export type PostApiCreditOperationsQuotationToProposalApiResponse =
  /** status 200 OK */ CredOperDto;
export type PostApiCreditOperationsQuotationToProposalApiArg = {
  credOperDto: CredOperDto;
};
export type PostApiCreditOperationsSaveCredOperApiResponse =
  /** status 200 OK */ CredOperDto;
export type PostApiCreditOperationsSaveCredOperApiArg = {
  credOperDto: CredOperDto;
};
export type PostApiCreditOperationsGetDefaultValuesFromFinancialProductApiResponse =
  /** status 200 OK */ CredOperDto;
export type PostApiCreditOperationsGetDefaultValuesFromFinancialProductApiArg =
  {
    credOperDto: CredOperDto;
  };
export type PostApiCreditOperationsGetFinancialProductTermRestrictionApiResponse =
  /** status 200 OK */ SymbolLimit;
export type PostApiCreditOperationsGetFinancialProductTermRestrictionApiArg = {
  credOperDto: CredOperDto;
};
export type PostApiCreditOperationsCalculateInitialDateApiResponse =
  /** status 200 OK */ string;
export type PostApiCreditOperationsCalculateInitialDateApiArg = {
  calculateInitialDateCustomRequest: CalculateInitialDateCustomRequest;
};
export type GetApiEntitiesGetNewPersonEntityApiResponse =
  /** status 200 OK */ EntityDto;
export type GetApiEntitiesGetNewPersonEntityApiArg = void;
export type GetApiEntitiesGetNewCompanyEntityApiResponse =
  /** status 200 OK */ EntityDto;
export type GetApiEntitiesGetNewCompanyEntityApiArg = void;
export type GetApiEntitiesGetNewsApiResponse =
  /** status 200 OK */ AplCompanyNewsDto[];
export type GetApiEntitiesGetNewsApiArg = void;
export type GetApiNotificationsSendMessageApiResponse = unknown;
export type GetApiNotificationsSendMessageApiArg = {
  message?: string;
};
export type PostApiSimulationsGetFinancialProductDetailsApiResponse =
  /** status 200 OK */ FinancialProductDto;
export type PostApiSimulationsGetFinancialProductDetailsApiArg = {
  financialProductDetailsRequest: FinancialProductDetailsRequest;
};
export type InstanceStatus = 1 | 2 | 3 | 4;
export type LoginMethod =
  "Password" | "Otp" | "MagicLink" | "OAuth" | "Passkey";
export type LoginMethodApiFieldMetadataDto = {
  fieldId?: LoginMethod;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type LoginResponseDto = {
  id?: number | null;
  correlationID?: string;
  status?: InstanceStatus;
  success?: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenType?: string | null;
  expiresInSeconds?: number;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string | null;
  challengeId?: string | null;
  errorCode?: string | null;
  message?: string | null;
  userId?: string | null;
  email?: string | null;
  rememberMe?: boolean;
  roles?: string[] | null;
  expiresAt?: string | null;
  metadataResponse?: LoginMethodApiFieldMetadataDto[] | null;
};
export type AplUserLoginInfoField = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type AplUserLoginInfoFieldApiFieldMetadataDto = {
  fieldId?: AplUserLoginInfoField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type LoginRequestDto = {
  id?: number | null;
  correlationID?: string;
  status?: InstanceStatus;
  method: LoginMethod;
  identifier?: string | null;
  password?: string | null;
  otpCode?: string | null;
  magicLinkToken?: string | null;
  provider?: string | null;
  authorizationCode?: string | null;
  redirectUri?: string | null;
  credentialId?: string | null;
  clientDataJson?: string | null;
  authenticatorData?: string | null;
  signature?: string | null;
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  rememberMe?: boolean;
  metadataResponse?: AplUserLoginInfoFieldApiFieldMetadataDto[] | null;
};
export type RecoverPasswordDto = {
  userEmail: string | null;
  userLogin: string | null;
};
export type ChangePasswordDto = {
  id?: number | null;
  correlationID?: string;
  status?: InstanceStatus;
  oldpassword: string;
  newpassword?: string | null;
  metadataResponse?: AplUserLoginInfoFieldApiFieldMetadataDto[] | null;
};
export type SetupAuthenticatorResponseDto = {
  manualEntryKey?: string | null;
  authenticatorUri?: string | null;
};
export type VerifyAuthenticatorRequestDto = {
  code?: string | null;
};
export type ValidateTwoFactorRequestDto = {
  twoFactorToken?: string | null;
  otpCode?: string | null;
  rememberMe?: boolean;
};
export type ExtensionDataObject = object;
export type PermissionFlags = 0 | 1 | 2 | 4 | 8 | 16 | 32;
export type CodeAbbreviation = {
  extensionData?: ExtensionDataObject;
  abbreviation?: string | null;
  code?: string | null;
  description?: string | null;
  fetchLevel?: number;
  invalidDate?: string | null;
  isDefault?: boolean;
  isInvalid?: boolean;
  permissionFlags?: PermissionFlags;
};
export type GetEquipmentTypeByKeysV2Request = object;
export type GetEquipmentCategoryDataListCustomRequest = {
  equipmentTypeId?: number;
  finProductId?: number | null;
};
export type GetEquipmentStateByKeysV2Request = object;
export type GetCredOperClassificationByKeysV2Request = object;
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
  noResidualValueOrBalloon?: boolean | null;
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
export type FinConditionsFlowsField =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24;
export type FinConditionsFlowsFieldApiFieldMetadataDto = {
  fieldId?: FinConditionsFlowsField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type FinConditionsFlowsDto = {
  id?: number | null;
  correlationID?: string;
  status?: InstanceStatus;
  amount?: number | null;
  amountUnrounded?: number | null;
  balloonRentIncludeNormalRent?: boolean | null;
  customerRentalAmount?: number | null;
  customerRentalAmountWithTax?: number | null;
  factor?: number | null;
  finConditionsId?: number | null;
  finFlowControlTypeId?: number | null;
  implicitRate?: number | null;
  invoiceEntityId?: number | null;
  invoiceRuleId?: number | null;
  isToIndex?: boolean | null;
  isVariableFlow?: boolean | null;
  numOfRepetitions?: number | null;
  percentageAmount?: number | null;
  periodId?: number | null;
  periodQuantity?: number | null;
  quantity?: number | null;
  sequenceNr?: number | null;
  spread?: number | null;
  userInputFieldId?: number | null;
  valueDate?: string | null;
  metadataResponse?: FinConditionsFlowsFieldApiFieldMetadataDto[] | null;
};
export type FinConditionsField =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50
  | 51
  | 52
  | 53
  | 54
  | 55
  | 56
  | 57
  | 58
  | 59
  | 60
  | 61
  | 62
  | 63
  | 64
  | 65
  | 66
  | 67
  | 68
  | 69
  | 70
  | 71
  | 72
  | 73
  | 74
  | 75
  | 76
  | 77
  | 78
  | 79
  | 80
  | 81
  | 82
  | 83
  | 84
  | 85
  | 86
  | 87
  | 88
  | 89
  | 90
  | 91
  | 92
  | 93
  | 94
  | 95
  | 96
  | 97
  | 98
  | 99
  | 100
  | 101
  | 102
  | 103
  | 104
  | 105
  | 106
  | 107
  | 108
  | 109
  | 110;
export type FinConditionsFieldApiFieldMetadataDto = {
  fieldId?: FinConditionsField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type FinConditionDto = {
  id?: string | null;
  correlationID?: string;
  status?: InstanceStatus;
  initialDate?: string;
  valueDate?: string | null;
  transferDate?: string | null;
  rentTaxTypeId?: number | null;
  saleTaxTypeId?: number | null;
  interestTaxTypeId?: number | null;
  finInterestControlTypeId?: number | null;
  spreadDate?: string | null;
  term?: number | null;
  period?: number | null;
  dueRegime?: number | null;
  implicitRate?: number | null;
  annualRate?: number | null;
  dayRent?: number | null;
  simulationType?: number | null;
  finInitialEntryTypeId?: number | null;
  financialValue?: number;
  flows?: FinConditionsFlowsDto[] | null;
  metadataResponse?: FinConditionsFieldApiFieldMetadataDto[] | null;
};
export type EquipmentField =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50
  | 51
  | 52
  | 53
  | 54
  | 55
  | 56
  | 57
  | 58
  | 59
  | 60
  | 61
  | 62
  | 63
  | 64
  | 65
  | 66
  | 67
  | 68
  | 69
  | 70
  | 71
  | 72
  | 73
  | 74
  | 75
  | 76
  | 77
  | 78
  | 79
  | 80
  | 81
  | 82
  | 83
  | 84
  | 85
  | 86
  | 87
  | 88
  | 89
  | 90
  | 91
  | 92
  | 93
  | 94
  | 95
  | 96
  | 97
  | 98
  | 99
  | 100
  | 101
  | 102
  | 103
  | 104
  | 105
  | 106
  | 107
  | 108
  | 109
  | 110
  | 111
  | 112
  | 113
  | 114
  | 115
  | 116
  | 117
  | 118
  | 119
  | 120
  | 121
  | 122
  | 123
  | 124
  | 125
  | 126
  | 127
  | 128
  | 129
  | 130
  | 131
  | 132
  | 133
  | 134
  | 135
  | 136
  | 137
  | 138
  | 139
  | 140
  | 141
  | 142
  | 143
  | 144
  | 145
  | 146
  | 147
  | 148
  | 149
  | 150
  | 151
  | 152
  | 153
  | 154
  | 155
  | 156
  | 157;
export type EquipmentFieldApiFieldMetadataDto = {
  fieldId?: EquipmentField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type EquipmentDto = {
  id?: string | null;
  correlationID?: string;
  status?: string | null;
  equipmentTypeId?: number | null;
  equipmentStateId?: number | null;
  equipmentCategoryId?: number | null;
  baseMarketValue?: number | null;
  baseNetAmount?: number | null;
  basePurchaseAmount?: number | null;
  purchaseAmount?: number | null;
  netAmount?: number | null;
  retakePercentage?: number | null;
  retakeAmount?: number | null;
  taxAmount?: number | null;
  licencePlate?: string | null;
  registrationDate?: string | null;
  description?: string | null;
  brand?: string | null;
  model?: string | null;
  version?: string | null;
  enginesize?: number | null;
  doors?: number | null;
  odometer?: number | null;
  metadataResponse?: EquipmentFieldApiFieldMetadataDto[] | null;
};
export type CredOperAssetField =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50
  | 51
  | 52
  | 53;
export type CredOperAssetFieldApiFieldMetadataDto = {
  fieldId?: CredOperAssetField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type CredOperAssetDto = {
  id?: string | null;
  correlationID?: string;
  status?: string | null;
  assetType?: number | null;
  isRelocation?: boolean;
  baseAmount?: number | null;
  beginDate?: string | null;
  assetItem?: number | null;
  currencyId?: string | null;
  equipment?: EquipmentDto;
  metadataResponse?: CredOperAssetFieldApiFieldMetadataDto[] | null;
};
export type EntityAddressField =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31;
export type EntityAddressFieldApiFieldMetadataDto = {
  fieldId?: EntityAddressField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type EntityAddressDto = {
  id?: string | null;
  correlationID?: string;
  status?: InstanceStatus;
  addressInUseSince?: string | null;
  addressTypeId?: number | null;
  apartment?: string | null;
  building?: string | null;
  council?: string | null;
  councilCode?: number | null;
  countryId?: string | null;
  district?: string | null;
  districtCode?: number | null;
  entityId?: number | null;
  houseNumber?: string | null;
  isFiscal?: boolean | null;
  isHeadquarters?: boolean | null;
  isPoBox?: boolean | null;
  isPostal?: boolean | null;
  isResidentialAddress?: boolean | null;
  locality?: string | null;
  parish?: string | null;
  parishCode?: string | null;
  place?: string | null;
  poBox?: string | null;
  postalCode?: string | null;
  region?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  streetTypeId?: number | null;
  metadataResponse?: EntityAddressFieldApiFieldMetadataDto[] | null;
};
export type MailType = 0 | 1 | 2;
export type EntityEmailField = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type EntityEmailFieldApiFieldMetadataDto = {
  fieldId?: EntityEmailField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type EntityEmailDto = {
  id?: string | null;
  correlationID?: string;
  status?: InstanceStatus;
  email?: string | null;
  isPrimary?: boolean;
  type?: MailType;
  metadataResponse?: EntityEmailFieldApiFieldMetadataDto[] | null;
};
export type PhoneType = 0 | 1 | 2;
export type EntityPhoneField = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type EntityPhoneFieldApiFieldMetadataDto = {
  fieldId?: EntityPhoneField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type EntityPhoneDto = {
  id?: string | null;
  correlationID?: string;
  status?: InstanceStatus;
  phoneNumber?: string | null;
  countryCode?: string | null;
  isPrimary?: boolean;
  type?: PhoneType;
  entityId?: number | null;
  metadataResponse?: EntityPhoneFieldApiFieldMetadataDto[] | null;
};
export type EntityRoleField = 0 | 1 | 2 | 3;
export type EntityRoleFieldApiFieldMetadataDto = {
  fieldId?: EntityRoleField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type EntityRoleDto = {
  id?: number | null;
  correlationID?: string;
  status?: InstanceStatus;
  entityId?: number | null;
  entityRoleTypeId?: number | null;
  metadataResponse?: EntityRoleFieldApiFieldMetadataDto[] | null;
};
export type EntityLegalDocField =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;
export type EntityLegalDocFieldApiFieldMetadataDto = {
  fieldId?: EntityLegalDocField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type EntityLegalDocDto = {
  id?: string | null;
  correlationID?: string;
  /** App-only: the kind of document chosen in the form (1 ID card, 2 passport); never a record id */
  legalDocTypeId?: number | null;
  status?: InstanceStatus;
  legalDocNumber?: string | null;
  countryCode?: string | null;
  issueDate?: string | null;
  validDate?: string | null;
  metadataResponse?: EntityLegalDocFieldApiFieldMetadataDto[] | null;
};
export type CustomerField =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18;
export type CustomerFieldApiFieldMetadataDto = {
  fieldId?: CustomerField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type CustomerDto = {
  id?: number | null;
  correlationID?: string;
  status?: InstanceStatus;
  communicationMediaId?: number | null;
  entityId?: number | null;
  metadataResponse?: CustomerFieldApiFieldMetadataDto[] | null;
};
export type EntityContactField =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type EntityContactFieldApiFieldMetadataDto = {
  fieldId?: EntityContactField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type EntityContactDto = {
  id?: number | null;
  correlationID?: string;
  status?: InstanceStatus;
  contactName?: string | null;
  emails?: EntityEmailDto[] | null;
  entityId?: number | null;
  entityPositionId?: number | null;
  isPrimaryContact?: boolean | null;
  observations?: string | null;
  phones?: EntityPhoneDto[] | null;
  titleId?: number | null;
  metadataResponse?: EntityContactFieldApiFieldMetadataDto[] | null;
};
export type BankAccountField =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22;
export type BankAccountFieldApiFieldMetadataDto = {
  fieldId?: BankAccountField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type BankAccountDto = {
  id?: number | null;
  correlationID?: string;
  status?: InstanceStatus;
  account?: string | null;
  accountName?: string | null;
  accountSeniority?: number | null;
  agencyId?: number | null;
  agencyName?: string | null;
  autUserStateId?: number | null;
  bankAccountTypeId?: number | null;
  bankId?: number | null;
  bankName?: string | null;
  countryId?: string | null;
  currencyId?: string | null;
  entityId?: number | null;
  iban?: string | null;
  isMain?: boolean | null;
  nib?: string | null;
  refExternal?: string | null;
  swift?: string | null;
  stateDate?: string | null;
  metadataResponse?: BankAccountFieldApiFieldMetadataDto[] | null;
};
export type CompanyField =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37;
export type CompanyFieldApiFieldMetadataDto = {
  fieldId?: CompanyField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type CompanyDto = {
  id?: string | null;
  correlationID?: string;
  status?: InstanceStatus;
  amlReference?: string | null;
  activityBeginDate?: string | null;
  activityPurpose?: string | null;
  buFinancialResponsability?: boolean | null;
  buMajorParticipation?: boolean | null;
  beginYear?: number | null;
  businessVolumeYear1?: number | null;
  businessVolumeYear1Amount?: number | null;
  businessVolumeYear2?: number | null;
  businessVolumeYear2Amount?: number | null;
  commercialRegistryValidDate?: string | null;
  countryId?: string | null;
  currencyId?: string | null;
  deedDate?: string | null;
  economicFinality?: string | null;
  economicGroupId?: number | null;
  employees?: number | null;
  equityCapital?: number | null;
  fiscalValidationCode?: string | null;
  groupActivityTypeId?: number | null;
  hasRealEstate?: boolean | null;
  headQuartersCountryId?: string | null;
  isListedCompany?: boolean | null;
  isManagedByGovernment?: boolean | null;
  leafActivityTypeId?: number | null;
  publicContractObligation?: boolean | null;
  publicSectorClassId?: number | null;
  publicSectorId?: number | null;
  registryDescription?: string | null;
  registryNumber?: string | null;
  metadataResponse?: CompanyFieldApiFieldMetadataDto[] | null;
};
export type PersonField =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50
  | 51
  | 52
  | 53
  | 54
  | 55
  | 56
  | 57
  | 58
  | 59
  | 60
  | 61
  | 62
  | 63
  | 64
  | 65
  | 66
  | 67
  | 68
  | 69
  | 70
  | 71
  | 72
  | 73
  | 74
  | 75
  | 76
  | 77
  | 78
  | 79
  | 80
  | 81
  | 82
  | 83
  | 84
  | 85
  | 86
  | 87
  | 88
  | 89
  | 90
  | 91
  | 92
  | 93
  | 94
  | 95
  | 96
  | 97
  | 98;
export type PersonFieldApiFieldMetadataDto = {
  fieldId?: PersonField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type PersonDto = {
  id?: string | null;
  correlationID?: string;
  status?: InstanceStatus;
  amlReference?: string | null;
  activityBeginDate?: string | null;
  activityPurpose?: string | null;
  activityTypeContextId?: number | null;
  buFinancialResponsability?: boolean | null;
  buMajorParticipation?: boolean | null;
  birthCountryId?: string | null;
  birthDate?: string | null;
  birthLocality?: string | null;
  birthName?: string | null;
  birthPlace?: string | null;
  birthZipCode?: string | null;
  businessIncome?: number | null;
  businessVolumeAmount?: number | null;
  councilCode?: number | null;
  countryId?: string | null;
  disposableIncome?: number | null;
  districtCode?: number | null;
  economicFinality?: string | null;
  employerCountryId?: string | null;
  employerEntityPositionId?: number | null;
  employerFiscalNumber?: string | null;
  employmentAddress?: string | null;
  employmentCompany?: string | null;
  employmentEntityAddressId?: string | null;
  financialDuties?: number | null;
  firstName?: string | null;
  fiscalActivityTypeContextId?: number | null;
  fiscalValidationCode?: string | null;
  genderId?: number | null;
  groupActivityTypeNodeId?: number | null;
  groupFiscalActivityTypeNodeId?: number | null;
  handicappedDegree?: number | null;
  hasDualNationality?: boolean | null;
  hasPoliticalExposure?: boolean | null;
  hasPublicOfficePosition?: boolean | null;
  householdIncome?: number | null;
  isHandicapped?: boolean | null;
  isSalaryValidityProlonged?: boolean | null;
  labourAggreementBeginDate?: string | null;
  labourAggreementEndDate?: string | null;
  labourAgreementTypeId?: number | null;
  labourSeniority?: number | null;
  lastName?: string | null;
  lastProfessionId?: number | null;
  leafActivityTypeNodeId?: number | null;
  leafFiscalActivityTypeNodeId?: number | null;
  maritalAgreementId?: number | null;
  maritalStatusId?: number | null;
  numOfDependents?: number | null;
  otherCredits?: number | null;
  otherDuties?: number | null;
  otherIncomes?: number | null;
  parishCode?: string | null;
  pension?: number | null;
  professionDescr?: string | null;
  professionId?: number | null;
  qualificationTypeId?: number | null;
  rentalIncome?: number | null;
  residenceDebt?: number | null;
  residenceDuties?: number | null;
  residenceSeniority?: number | null;
  residenceTypeId?: number | null;
  salaryAmount?: number | null;
  salaryDate?: string | null;
  savings?: number | null;
  savingsDate?: string | null;
  secondCountryId?: string | null;
  titleId?: number | null;
  titleNobleId?: number | null;
  totalDuties?: number | null;
  totalIncome?: number | null;
  metadataResponse?: PersonFieldApiFieldMetadataDto[] | null;
};
export type EntityField =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40;
export type EntityFieldApiFieldMetadataDto = {
  fieldId?: EntityField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type EntityDto = {
  id?: string | null;
  correlationID?: string;
  status?: InstanceStatus;
  autUserStateId?: number | null;
  consentUseData?: boolean | null;
  consentUseDataMarketing?: boolean | null;
  councilCode?: number | null;
  countryId?: string | null;
  districtCode?: number | null;
  entityTypeId?: number | null;
  fullName?: string | null;
  hasDocumentsValidated?: boolean | null;
  isNameReadOnly?: boolean | null;
  juridicalTypeId?: number | null;
  localFullName?: string | null;
  officialCode?: string | null;
  parishCode?: string | null;
  shortName?: string | null;
  stateDate?: string | null;
  taxRegimeId?: number | null;
  webSite?: string | null;
  addresses?: EntityAddressDto[] | null;
  roles?: EntityRoleDto[] | null;
  phones?: EntityPhoneDto[] | null;
  legalDocs?: EntityLegalDocDto[] | null;
  emails?: EntityEmailDto[] | null;
  customer?: CustomerDto;
  contacts?: EntityContactDto[] | null;
  bankAccounts?: BankAccountDto[] | null;
  company?: CompanyDto;
  person?: PersonDto;
  metadataResponse?: EntityFieldApiFieldMetadataDto[] | null;
};
export type CredOperIntervField =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50
  | 51
  | 52
  | 53
  | 54
  | 55
  | 56
  | 57
  | 58
  | 59
  | 60
  | 61
  | 62
  | 63
  | 64
  | 65;
export type CredOperIntervFieldApiFieldMetadataDto = {
  fieldId?: CredOperIntervField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type CredOperIntervDto = {
  id?: string | null;
  correlationID?: string;
  status?: InstanceStatus;
  beginDate?: string | null;
  communicationMediaId?: number | null;
  consentUseData?: boolean | null;
  credOperIntervType?: number | null;
  fiscalEntityAddress?: EntityAddressDto;
  entityAddress?: EntityAddressDto;
  entityEmail?: EntityEmailDto;
  entityMobilePhone?: EntityPhoneDto;
  entityLandlinePhone?: EntityPhoneDto;
  entity?: EntityDto;
  company?: CompanyDto;
  person?: PersonDto;
  metadataResponse?: CredOperIntervFieldApiFieldMetadataDto[] | null;
};
export type CredOperField =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50
  | 51
  | 52
  | 53
  | 54
  | 55
  | 56
  | 57
  | 58
  | 59
  | 60
  | 61
  | 62
  | 63
  | 64
  | 65
  | 66
  | 67
  | 68
  | 69
  | 70
  | 71
  | 72
  | 73
  | 74
  | 75
  | 76
  | 77
  | 78
  | 79
  | 80
  | 81
  | 82
  | 83
  | 84
  | 85
  | 86
  | 87
  | 88
  | 89
  | 90
  | 91
  | 92
  | 93
  | 94
  | 95
  | 96
  | 97
  | 98
  | 99
  | 100
  | 101
  | 102
  | 103
  | 104
  | 105
  | 106
  | 107
  | 108
  | 109
  | 110
  | 111
  | 112
  | 113
  | 114
  | 115
  | 116
  | 117
  | 118
  | 119
  | 120
  | 121
  | 122
  | 123
  | 124
  | 125
  | 126
  | 127
  | 128
  | 129
  | 130
  | 131
  | 132
  | 133
  | 134
  | 135
  | 136
  | 137;
export type CredOperFieldApiFieldMetadataDto = {
  fieldId?: CredOperField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type CredOperDto = {
  id?: string | null;
  correlationID?: string;
  status?: InstanceStatus;
  financialProduct?: number | null;
  credOperNumber?: number | null;
  amount?: number | null;
  beginDate?: string;
  aplBusinessId?: number;
  credOperTypeId?: number;
  aplCompanyId?: number;
  finProductVersion?: number;
  aplBusinessPurposeTypeId?: number | null;
  credOperChannelId?: number;
  currencyId?: string | null;
  hasFinConditions?: boolean;
  entryMoment?: string;
  entryDate?: string;
  autUserStateId?: number;
  stateDate?: string;
  credOperStep?: number;
  creditIntermediaryStructNode?: string | null;
  showRoomStructNode?: string | null;
  salePersonStructNode?: string | null;
  credOperClassification?: number | null;
  customerName?: string | null;
  description?: string | null;
  conditions?: FinConditionDto[] | null;
  assets?: CredOperAssetDto[] | null;
  interventions?: CredOperIntervDto[] | null;
  customerEmail?: EntityEmailDto;
  customerVAT?: EntityLegalDocDto;
  customerPhone?: EntityPhoneDto;
  customerLandLine?: EntityPhoneDto;
  metadataResponse?: CredOperFieldApiFieldMetadataDto[] | null;
};
export type CreditOperationStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 12 | 13 | 99;
export type CreditOperationSearchRequest = {
  credOperTypeId?: number | null;
  aplCompanyId?: number | null;
  aplBusinessId?: number | null;
  aplBusinessPurposeTypeId?: number | null;
  credOperChannelId?: number | null;
  currencyId?: string | null;
  credOperStep?: CreditOperationStep;
};
export type SymbolLimitDate = {
  extensionData?: ExtensionDataObject;
  isDefault?: boolean | null;
  mandatory?: boolean | null;
  symbolDate?: string;
};
export type FinSymbolConstraintType = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type FinSymbolKind =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50
  | 51
  | 52
  | 53
  | 54
  | 55
  | 56
  | 57
  | 58
  | 59
  | 60
  | 61
  | 62
  | 63
  | 64
  | 65
  | 66
  | 67
  | 68
  | 69
  | 70
  | 71
  | 72
  | 73
  | 74
  | 75
  | 76
  | 77
  | 78
  | 79
  | 80
  | 81
  | 82
  | 83
  | 84
  | 85
  | 86
  | 87
  | 88
  | 89
  | 90
  | 91
  | 92
  | 93
  | 94
  | 95
  | 96
  | 97
  | 98
  | 99
  | 100
  | 101
  | 102
  | 103
  | 104
  | 105
  | 106
  | 107
  | 108
  | 109
  | 110
  | 111
  | 112
  | 113
  | 114
  | 115
  | 116
  | 117
  | 118
  | 119
  | 120
  | 121
  | 122
  | 123
  | 124
  | 125
  | 126
  | 127
  | 128
  | 129
  | 130
  | 131
  | 132
  | 133
  | 134
  | 135
  | 136
  | 137
  | 138
  | 139
  | 140
  | 141
  | 142
  | 143
  | 144
  | 145
  | 146
  | 147
  | 148
  | 149
  | 150
  | 151
  | 152
  | 153
  | 154
  | 155
  | 156
  | 157
  | 158
  | 159
  | 160
  | 161
  | 162
  | 163
  | 164
  | 165
  | 166
  | 167
  | 168
  | 169
  | 170
  | 171
  | 172
  | 173
  | 174
  | 175
  | 176
  | 177
  | 178
  | 179
  | 180
  | 183
  | 184
  | 185
  | 186
  | 187
  | 188
  | 189
  | 190
  | 191
  | 192
  | 193
  | 194
  | 195
  | 196
  | 197
  | 198
  | 199
  | 200
  | 201
  | 202
  | 203
  | 204
  | 205
  | 206
  | 207
  | 208
  | 209
  | 210
  | 211
  | 212
  | 213
  | 214
  | 215
  | 216
  | 217
  | 218
  | 219
  | 220
  | 221
  | 222
  | 223
  | 224
  | 225
  | 226
  | 227
  | 228
  | 229
  | 230
  | 231
  | 232
  | 233
  | 234
  | 235
  | 236
  | 237
  | 238
  | 239
  | 240
  | 241
  | 242
  | 243
  | 244
  | 245
  | 246
  | 247
  | 248
  | 249
  | 250
  | 251
  | 252
  | 253
  | 254
  | 255
  | 256
  | 257
  | 258
  | 259
  | 260
  | 261
  | 262
  | 263
  | 264
  | 265
  | 266
  | 267
  | 268
  | 269
  | 270
  | 271
  | 272
  | 273
  | 274
  | 275
  | 276
  | 277
  | 278
  | 279
  | 280
  | 281
  | 282
  | 283
  | 284
  | 285
  | 286
  | 287
  | 288
  | 289
  | 290
  | 291
  | 292
  | 293
  | 294
  | 295
  | 296
  | 297
  | 298
  | 299
  | 300
  | 301
  | 302
  | 303
  | 304
  | 305
  | 306
  | 307
  | 308
  | 309
  | 310
  | 311
  | 312
  | 313
  | 314
  | 315
  | 316
  | 317
  | 318
  | 319
  | 320
  | 321
  | 322
  | 323
  | 324
  | 325
  | 326
  | 327
  | 328
  | 329
  | 330
  | 331
  | 332
  | 333
  | 334
  | 335
  | 336
  | 337
  | 338
  | 339
  | 340
  | 341
  | 342
  | 343
  | 344
  | 345
  | 346
  | 347
  | 348
  | 349
  | 350
  | 351
  | 352
  | 353
  | 354
  | 355
  | 356
  | 357
  | 358
  | 359
  | 360
  | 361;
export type BasicList = {
  extensionData?: ExtensionDataObject;
  cleanInvalidElement?: boolean;
  enumName?: string | null;
  list?: CodeAbbreviation[] | null;
  tableId?: number | null;
  tableName?: string | null;
};
export type SymbolLimitId = {
  extensionData?: ExtensionDataObject;
  isDefault?: boolean | null;
  mandatory?: boolean | null;
  symbolId?: number;
};
export type SymbolLimitString = {
  extensionData?: ExtensionDataObject;
  isDefault?: boolean | null;
  mandatory?: boolean | null;
  symbolString?: string | null;
};
export type SymbolLimitValue = {
  extensionData?: ExtensionDataObject;
  isDefault?: boolean | null;
  mandatory?: boolean | null;
  symbolValue?: number;
};
export type SymbolLimit = {
  extensionData?: ExtensionDataObject;
  dataSourceAlias?: string | null;
  dateList?: SymbolLimitDate[] | null;
  defaultSymbolDate?: string | null;
  defaultSymbolId?: number | null;
  defaultSymbolString?: string | null;
  defaultSymbolValue?: number | null;
  equalityConstraintTypeId?: FinSymbolConstraintType;
  finSymbolId?: number;
  internalFinSymboAsEnum?: FinSymbolKind;
  internalFinSymbolId?: number;
  limitBasicList?: BasicList;
  maxConstraintTypeId?: FinSymbolConstraintType;
  maxDate?: string | null;
  maxValue?: number | null;
  minConstraintTypeId?: FinSymbolConstraintType;
  minDate?: string | null;
  minValue?: number | null;
  relatedId?: number | null;
  stepValue?: number | null;
  symbolIdList?: SymbolLimitId[] | null;
  symbolStringList?: SymbolLimitString[] | null;
  valuesList?: SymbolLimitValue[] | null;
};
export type CalculateInitialDateCustomRequest = {
  credOperTypeId?: number;
  entryDate?: string;
  clientSignatureDate?: string | null;
};
export type AplCompanyNewsDto = {
  id?: number | null;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  aplCompanyNewsType?: string | null;
  validityBeginDate?: string | null;
  validityEndDate?: string | null;
  image?: string | null;
};
export type FinancialProductField =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23;
export type FinancialProductFieldApiFieldMetadataDto = {
  fieldId?: FinancialProductField;
  propertyName?: string | null;
  jsonName?: string | null;
  dataType?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};
export type FinancialProductDto = {
  id?: number | null;
  correlationID?: string;
  status?: InstanceStatus;
  abrev?: string | null;
  aplBusinessId?: number | null;
  aplCompanyId?: number | null;
  currencyId?: string | null;
  descr?: string | null;
  finProductVersion?: number | null;
  invalidDate?: string | null;
  validityBeginDate?: string | null;
  validityEndDate?: string | null;
  OperType?: number | null;
  metadataResponse?: FinancialProductFieldApiFieldMetadataDto[] | null;
};
export type FinancialProductDetailsRequest = {
  finProductId?: number;
};
export const {
  usePostApiBasicListsFetchEquipmentTypeMutation,
  usePostApiBasicListsFetchEquipmentCategoryMutation,
  usePostApiBasicListsFetchEquipmentStateMutation,
  usePostApiBasicListsFetchCredOperClassificationMutation,
  usePostApiCreditOperationsSearchOperationsMutation,
  usePostApiCreditOperationsQuotationToProposalMutation,
  usePostApiCreditOperationsSaveCredOperMutation,
  usePostApiCreditOperationsGetFinancialProductTermRestrictionMutation,
  usePostApiSimulationsGetFinancialProductDetailsMutation,
} = injectedRtkApi;
