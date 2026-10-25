import { emptySplitApi as api } from "../emptyApi";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiAuthLogin: build.mutation<
      PostApiAuthLoginApiResponse,
      PostApiAuthLoginApiArg
    >({
      query: (queryArg) => ({
        url: `/api/auth/login`,
        method: "POST",
        body: queryArg.loginRequest,
      }),
    }),
    postApiAuthLoginWindows: build.mutation<
      PostApiAuthLoginWindowsApiResponse,
      PostApiAuthLoginWindowsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/auth/login/windows`,
        method: "POST",
        body: queryArg.windowsLoginRequest,
      }),
    }),
    postApiAuthLoginIdp: build.mutation<
      PostApiAuthLoginIdpApiResponse,
      PostApiAuthLoginIdpApiArg
    >({
      query: (queryArg) => ({
        url: `/api/auth/login/idp`,
        method: "POST",
        body: queryArg.idpLoginRequest,
      }),
    }),
    postApiAuth2FaVerify: build.mutation<
      PostApiAuth2FaVerifyApiResponse,
      PostApiAuth2FaVerifyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/auth/2fa/verify`,
        method: "POST",
        body: queryArg.twoFactorVerifyRequest,
      }),
    }),
    postApiAuth2FaSetup: build.mutation<
      PostApiAuth2FaSetupApiResponse,
      PostApiAuth2FaSetupApiArg
    >({
      query: () => ({ url: `/api/auth/2fa/setup`, method: "POST" }),
    }),
    postApiAuth2FaEnable: build.mutation<
      PostApiAuth2FaEnableApiResponse,
      PostApiAuth2FaEnableApiArg
    >({
      query: (queryArg) => ({
        url: `/api/auth/2fa/enable`,
        method: "POST",
        body: queryArg.twoFactorEnableRequest,
      }),
    }),
    postApiAuthRefresh: build.mutation<
      PostApiAuthRefreshApiResponse,
      PostApiAuthRefreshApiArg
    >({
      query: () => ({ url: `/api/auth/refresh`, method: "POST" }),
    }),
    postApiAuthLogout: build.mutation<
      PostApiAuthLogoutApiResponse,
      PostApiAuthLogoutApiArg
    >({
      query: () => ({ url: `/api/auth/logout`, method: "POST" }),
    }),
    postApiAuthPasswordForgot: build.mutation<
      PostApiAuthPasswordForgotApiResponse,
      PostApiAuthPasswordForgotApiArg
    >({
      query: (queryArg) => ({
        url: `/api/auth/password/forgot`,
        method: "POST",
        body: queryArg.forgotPasswordRequest,
      }),
    }),
    postApiAuthPasswordChange: build.mutation<
      PostApiAuthPasswordChangeApiResponse,
      PostApiAuthPasswordChangeApiArg
    >({
      query: (queryArg) => ({
        url: `/api/auth/password/change`,
        method: "POST",
        body: queryArg.changePasswordRequest,
      }),
    }),
    postApiAuthPasswordChangeRequired: build.mutation<
      PostApiAuthPasswordChangeRequiredApiResponse,
      PostApiAuthPasswordChangeRequiredApiArg
    >({
      query: (queryArg) => ({
        url: `/api/auth/password/change-required`,
        method: "POST",
        body: queryArg.requiredPasswordChangeRequest,
      }),
    }),
    getApiBuildingsNew: build.query<
      GetApiBuildingsNewApiResponse,
      GetApiBuildingsNewApiArg
    >({
      query: () => ({ url: `/api/buildings/new` }),
    }),
    getApiCompanies: build.query<
      GetApiCompaniesApiResponse,
      GetApiCompaniesApiArg
    >({
      query: () => ({ url: `/api/companies` }),
    }),
    getApiCompaniesByIdBusinesses: build.query<
      GetApiCompaniesByIdBusinessesApiResponse,
      GetApiCompaniesByIdBusinessesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/companies/${queryArg.id}/businesses`,
      }),
    }),
    getApiCompaniesCountries: build.query<
      GetApiCompaniesCountriesApiResponse,
      GetApiCompaniesCountriesApiArg
    >({
      query: () => ({ url: `/api/companies/countries` }),
    }),
    getApiCreditOperationsBusinesses: build.query<
      GetApiCreditOperationsBusinessesApiResponse,
      GetApiCreditOperationsBusinessesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/credit-operations/businesses`,
        params: {
          application: queryArg.application,
          CompanyId: queryArg.companyId,
          BusinessId: queryArg.businessId,
          ImporterId: queryArg.importerId,
          PurposeTypeId: queryArg.purposeTypeId,
          MarketCampaignId: queryArg.marketCampaignId,
          CustomerTypeId: queryArg.customerTypeId,
          ChannelId: queryArg.channelId,
          ProductPurpose: queryArg.productPurpose,
          OperationTypeId: queryArg.operationTypeId,
          IncludeProductsWithoutImporters:
            queryArg.includeProductsWithoutImporters,
          credOperStep: queryArg.credOperStep,
        },
      }),
    }),
    getApiCreditOperationsSearch: build.query<
      GetApiCreditOperationsSearchApiResponse,
      GetApiCreditOperationsSearchApiArg
    >({
      query: (queryArg) => ({
        url: `/api/credit-operations/search`,
        params: {
          Number: queryArg["number"],
          Step: queryArg.step,
          StateId: queryArg.stateId,
          Page: queryArg.page,
          PageSize: queryArg.pageSize,
        },
      }),
    }),
    postApiCreditOperationsCalculate: build.mutation<
      PostApiCreditOperationsCalculateApiResponse,
      PostApiCreditOperationsCalculateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/credit-operations/calculate`,
        method: "POST",
        body: queryArg.calculateCreditOperationRequest,
      }),
    }),
    getApiCreditOperationsNewCredoper: build.query<
      GetApiCreditOperationsNewCredoperApiResponse,
      GetApiCreditOperationsNewCredoperApiArg
    >({
      query: (queryArg) => ({
        url: `/api/credit-operations/new-credoper`,
        params: {
          credOperStep: queryArg.credOperStep,
        },
      }),
    }),
    getApiCreditOperationsNewIntervention: build.query<
      GetApiCreditOperationsNewInterventionApiResponse,
      GetApiCreditOperationsNewInterventionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/credit-operations/new-intervention`,
        params: {
          kind: queryArg.kind,
        },
      }),
    }),
    getApiCreditOperationsNewInsurance: build.query<
      GetApiCreditOperationsNewInsuranceApiResponse,
      GetApiCreditOperationsNewInsuranceApiArg
    >({
      query: () => ({ url: `/api/credit-operations/new-insurance` }),
    }),
    postApiCreditOperationsCalculateCredoper: build.mutation<
      PostApiCreditOperationsCalculateCredoperApiResponse,
      PostApiCreditOperationsCalculateCredoperApiArg
    >({
      query: (queryArg) => ({
        url: `/api/credit-operations/calculate-credoper`,
        method: "POST",
        body: queryArg.credOperDto,
      }),
    }),
    getApiEquipmentsNew: build.query<
      GetApiEquipmentsNewApiResponse,
      GetApiEquipmentsNewApiArg
    >({
      query: () => ({ url: `/api/equipments/new` }),
    }),
    getApiEquipmentsCategories: build.query<
      GetApiEquipmentsCategoriesApiResponse,
      GetApiEquipmentsCategoriesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/equipments/categories`,
        params: {
          application: queryArg.application,
          companyId: queryArg.companyId,
          equipmentTypeId: queryArg.equipmentTypeId,
          financialProductId: queryArg.financialProductId,
        },
      }),
    }),
    getApiEquipmentsTypes: build.query<
      GetApiEquipmentsTypesApiResponse,
      GetApiEquipmentsTypesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/equipments/types`,
        params: {
          application: queryArg.application,
          companyId: queryArg.companyId,
          financialProductId: queryArg.financialProductId,
          purposeTypeId: queryArg.purposeTypeId,
        },
      }),
    }),
    getApiEquipmentsBrands: build.query<
      GetApiEquipmentsBrandsApiResponse,
      GetApiEquipmentsBrandsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/equipments/brands`,
        params: {
          equipmentTypeId: queryArg.equipmentTypeId,
          categoryId: queryArg.categoryId,
        },
      }),
    }),
    getApiEquipmentsModels: build.query<
      GetApiEquipmentsModelsApiResponse,
      GetApiEquipmentsModelsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/equipments/models`,
        params: {
          equipmentTypeId: queryArg.equipmentTypeId,
          categoryId: queryArg.categoryId,
          brand: queryArg.brand,
        },
      }),
    }),
    getApiEquipmentsVersions: build.query<
      GetApiEquipmentsVersionsApiResponse,
      GetApiEquipmentsVersionsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/equipments/versions`,
        params: {
          equipmentTypeId: queryArg.equipmentTypeId,
          categoryId: queryArg.categoryId,
          brand: queryArg.brand,
          model: queryArg.model,
        },
      }),
    }),
    getApiFinancialProducts: build.query<
      GetApiFinancialProductsApiResponse,
      GetApiFinancialProductsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/financial-products`,
        params: {
          CompanyId: queryArg.companyId,
          BusinessId: queryArg.businessId,
          ImporterId: queryArg.importerId,
          PurposeTypeId: queryArg.purposeTypeId,
          MarketCampaignId: queryArg.marketCampaignId,
          CustomerTypeId: queryArg.customerTypeId,
          ChannelId: queryArg.channelId,
          ProductPurpose: queryArg.productPurpose,
          OperationTypeId: queryArg.operationTypeId,
          IncludeProductsWithoutImporters:
            queryArg.includeProductsWithoutImporters,
        },
      }),
    }),
    postApiFinancialProductsDefaults: build.mutation<
      PostApiFinancialProductsDefaultsApiResponse,
      PostApiFinancialProductsDefaultsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/financial-products/defaults`,
        method: "POST",
        body: queryArg.credOperDto,
        params: {
          oldFinancialProductId: queryArg.oldFinancialProductId,
        },
      }),
    }),
    getApiNews: build.query<GetApiNewsApiResponse, GetApiNewsApiArg>({
      query: (queryArg) => ({
        url: `/api/news`,
        params: {
          portal: queryArg.portal,
        },
      }),
    }),
    getApiNewsSearch: build.query<
      GetApiNewsSearchApiResponse,
      GetApiNewsSearchApiArg
    >({
      query: (queryArg) => ({
        url: `/api/news/search`,
        params: {
          portal: queryArg.portal,
          search: queryArg.search,
          newsTypeId: queryArg.newsTypeId,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiNewsByIdImage: build.query<
      GetApiNewsByIdImageApiResponse,
      GetApiNewsByIdImageApiArg
    >({
      query: (queryArg) => ({ url: `/api/news/${queryArg.id}/image` }),
    }),
    getApiParametrizationScreenCustomizations: build.query<
      GetApiParametrizationScreenCustomizationsApiResponse,
      GetApiParametrizationScreenCustomizationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/parametrization/screen-customizations`,
        params: {
          screenIdentifier: queryArg.screenIdentifier,
        },
      }),
    }),
    postApiParametrizationScreenCustomizations: build.mutation<
      PostApiParametrizationScreenCustomizationsApiResponse,
      PostApiParametrizationScreenCustomizationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/parametrization/screen-customizations`,
        method: "POST",
        body: queryArg.saveScreenCustomizationRequest,
      }),
    }),
    getApiStructNodesMe: build.query<
      GetApiStructNodesMeApiResponse,
      GetApiStructNodesMeApiArg
    >({
      query: () => ({ url: `/api/struct-nodes/me` }),
    }),
    getApiStructNodesIntermediaries: build.query<
      GetApiStructNodesIntermediariesApiResponse,
      GetApiStructNodesIntermediariesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/struct-nodes/intermediaries`,
        params: {
          search: queryArg.search,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiStructNodesIntermediariesByIdSuppliers: build.query<
      GetApiStructNodesIntermediariesByIdSuppliersApiResponse,
      GetApiStructNodesIntermediariesByIdSuppliersApiArg
    >({
      query: (queryArg) => ({
        url: `/api/struct-nodes/intermediaries/${queryArg.id}/suppliers`,
        params: {
          search: queryArg.search,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiStructNodesSuppliersByIdPersons: build.query<
      GetApiStructNodesSuppliersByIdPersonsApiResponse,
      GetApiStructNodesSuppliersByIdPersonsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/struct-nodes/suppliers/${queryArg.id}/persons`,
        params: {
          search: queryArg.search,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiStructNodesLawOffices: build.query<
      GetApiStructNodesLawOfficesApiResponse,
      GetApiStructNodesLawOfficesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/struct-nodes/law-offices`,
        params: {
          search: queryArg.search,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiStructNodesLawOfficesByIdDepartments: build.query<
      GetApiStructNodesLawOfficesByIdDepartmentsApiResponse,
      GetApiStructNodesLawOfficesByIdDepartmentsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/struct-nodes/law-offices/${queryArg.id}/departments`,
        params: {
          search: queryArg.search,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiStructNodesDepartmentsByIdLawyers: build.query<
      GetApiStructNodesDepartmentsByIdLawyersApiResponse,
      GetApiStructNodesDepartmentsByIdLawyersApiArg
    >({
      query: (queryArg) => ({
        url: `/api/struct-nodes/departments/${queryArg.id}/lawyers`,
        params: {
          search: queryArg.search,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiStructNodesById: build.query<
      GetApiStructNodesByIdApiResponse,
      GetApiStructNodesByIdApiArg
    >({
      query: (queryArg) => ({ url: `/api/struct-nodes/${queryArg.id}` }),
    }),
    getApiUsersMe: build.query<GetApiUsersMeApiResponse, GetApiUsersMeApiArg>({
      query: () => ({ url: `/api/users/me` }),
    }),
    getApiUsersMeContacts: build.query<
      GetApiUsersMeContactsApiResponse,
      GetApiUsersMeContactsApiArg
    >({
      query: () => ({ url: `/api/users/me/contacts` }),
    }),
    getApiUsersMeContactDetails: build.query<
      GetApiUsersMeContactDetailsApiResponse,
      GetApiUsersMeContactDetailsApiArg
    >({
      query: () => ({ url: `/api/users/me/contact-details` }),
    }),
    putApiUsersMeContactDetails: build.mutation<
      PutApiUsersMeContactDetailsApiResponse,
      PutApiUsersMeContactDetailsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/users/me/contact-details`,
        method: "PUT",
        body: queryArg.updateMyContactsRequest,
      }),
    }),
    putApiUsersMePhoto: build.mutation<
      PutApiUsersMePhotoApiResponse,
      PutApiUsersMePhotoApiArg
    >({
      query: (queryArg) => ({
        url: `/api/users/me/photo`,
        method: "PUT",
        body: queryArg.body,
      }),
    }),
    postApiUsersConfirmEmail: build.mutation<
      PostApiUsersConfirmEmailApiResponse,
      PostApiUsersConfirmEmailApiArg
    >({
      query: (queryArg) => ({
        url: `/api/users/confirm-email`,
        method: "POST",
        body: queryArg.emailConfirmationRequest,
      }),
    }),
    postApiUsers: build.mutation<PostApiUsersApiResponse, PostApiUsersApiArg>({
      query: (queryArg) => ({
        url: `/api/users`,
        method: "POST",
        body: queryArg.createUserRequest,
      }),
    }),
    getApiUsersById: build.query<
      GetApiUsersByIdApiResponse,
      GetApiUsersByIdApiArg
    >({
      query: (queryArg) => ({ url: `/api/users/${queryArg.id}` }),
    }),
    putApiUsersById: build.mutation<
      PutApiUsersByIdApiResponse,
      PutApiUsersByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.id}`,
        method: "PUT",
        body: queryArg.updateUserRequest,
      }),
    }),
    getApiWorkItemsPositions: build.query<
      GetApiWorkItemsPositionsApiResponse,
      GetApiWorkItemsPositionsApiArg
    >({
      query: () => ({ url: `/api/work-items/positions` }),
    }),
    getApiWorkItemsDashboard: build.query<
      GetApiWorkItemsDashboardApiResponse,
      GetApiWorkItemsDashboardApiArg
    >({
      query: (queryArg) => ({
        url: `/api/work-items/dashboard`,
        params: {
          positionId: queryArg.positionId,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiWorkItemsSearch: build.query<
      GetApiWorkItemsSearchApiResponse,
      GetApiWorkItemsSearchApiArg
    >({
      query: (queryArg) => ({
        url: `/api/work-items/search`,
        params: {
          PositionId: queryArg.positionId,
          States: queryArg.states,
          TypeId: queryArg.typeId,
          Number: queryArg["number"],
          Sort: queryArg.sort,
          Page: queryArg.page,
          PageSize: queryArg.pageSize,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as MontraPOSApi };
export type PostApiAuthLoginApiResponse = /** status 200 OK */ LoginResponse;
export type PostApiAuthLoginApiArg = {
  loginRequest: LoginRequest;
};
export type PostApiAuthLoginWindowsApiResponse =
  /** status 200 OK */ LoginResponse;
export type PostApiAuthLoginWindowsApiArg = {
  windowsLoginRequest: WindowsLoginRequest;
};
export type PostApiAuthLoginIdpApiResponse = /** status 200 OK */ LoginResponse;
export type PostApiAuthLoginIdpApiArg = {
  idpLoginRequest: IdpLoginRequest;
};
export type PostApiAuth2FaVerifyApiResponse =
  /** status 200 OK */ LoginResponse;
export type PostApiAuth2FaVerifyApiArg = {
  twoFactorVerifyRequest: TwoFactorVerifyRequest;
};
export type PostApiAuth2FaSetupApiResponse =
  /** status 200 OK */ TwoFactorSetupResponse;
export type PostApiAuth2FaSetupApiArg = void;
export type PostApiAuth2FaEnableApiResponse = unknown;
export type PostApiAuth2FaEnableApiArg = {
  twoFactorEnableRequest: TwoFactorEnableRequest;
};
export type PostApiAuthRefreshApiResponse = /** status 200 OK */ LoginResponse;
export type PostApiAuthRefreshApiArg = void;
export type PostApiAuthLogoutApiResponse = unknown;
export type PostApiAuthLogoutApiArg = void;
export type PostApiAuthPasswordForgotApiResponse = unknown;
export type PostApiAuthPasswordForgotApiArg = {
  forgotPasswordRequest: ForgotPasswordRequest;
};
export type PostApiAuthPasswordChangeApiResponse = unknown;
export type PostApiAuthPasswordChangeApiArg = {
  changePasswordRequest: ChangePasswordRequest;
};
export type PostApiAuthPasswordChangeRequiredApiResponse =
  /** status 200 OK */ LoginResponse;
export type PostApiAuthPasswordChangeRequiredApiArg = {
  requiredPasswordChangeRequest: RequiredPasswordChangeRequest;
};
export type GetApiBuildingsNewApiResponse = /** status 200 OK */ BuildingDto;
export type GetApiBuildingsNewApiArg = void;
export type GetApiCompaniesApiResponse = /** status 200 OK */ CompanyDto[];
export type GetApiCompaniesApiArg = void;
export type GetApiCompaniesByIdBusinessesApiResponse =
  /** status 200 OK */ CompanyBusinessDto[];
export type GetApiCompaniesByIdBusinessesApiArg = {
  id: number;
};
export type GetApiCompaniesCountriesApiResponse =
  /** status 200 OK */ CountryDto[];
export type GetApiCompaniesCountriesApiArg = void;
export type GetApiCreditOperationsBusinessesApiResponse =
  /** status 200 OK */ AvailableBusinessDto[];
export type GetApiCreditOperationsBusinessesApiArg = {
  application?: string;
  companyId?: number;
  businessId?: number;
  importerId?: string | null;
  purposeTypeId?: number;
  marketCampaignId?: number;
  customerTypeId?: number;
  channelId?: number;
  productPurpose?: number;
  operationTypeId?: number;
  includeProductsWithoutImporters?: boolean;
  credOperStep?: CreditOperationStep;
};
export type GetApiCreditOperationsSearchApiResponse =
  /** status 200 OK */ CredOperSummaryDtoPagedResult;
export type GetApiCreditOperationsSearchApiArg = {
  number?: number;
  step?: CreditOperationStep;
  stateId?: number;
  page?: number;
  pageSize?: number;
};
export type PostApiCreditOperationsCalculateApiResponse =
  /** status 200 OK */ CreditOperationCalculationDto;
export type PostApiCreditOperationsCalculateApiArg = {
  calculateCreditOperationRequest: CalculateCreditOperationRequest;
};
export type GetApiCreditOperationsNewCredoperApiResponse =
  /** status 200 OK */ CredOperDto;
export type GetApiCreditOperationsNewCredoperApiArg = {
  credOperStep?: CreditOperationStep;
};
export type GetApiCreditOperationsNewInterventionApiResponse =
  /** status 200 OK */ CredOperIntervDto;
export type GetApiCreditOperationsNewInterventionApiArg = {
  kind?: NewInterventionKind;
};
export type GetApiCreditOperationsNewInsuranceApiResponse =
  /** status 200 OK */ InsurancePolicyDto;
export type GetApiCreditOperationsNewInsuranceApiArg = void;
export type PostApiCreditOperationsCalculateCredoperApiResponse =
  /** status 200 OK */ CredOperCalculationResultDto;
export type PostApiCreditOperationsCalculateCredoperApiArg = {
  credOperDto: CredOperDto;
};
export type GetApiEquipmentsNewApiResponse = /** status 200 OK */ EquipmentDto;
export type GetApiEquipmentsNewApiArg = void;
export type GetApiEquipmentsCategoriesApiResponse =
  /** status 200 OK */ EquipmentClassDto[];
export type GetApiEquipmentsCategoriesApiArg = {
  application?: string;
  companyId?: number;
  equipmentTypeId?: number;
  financialProductId?: number;
};
export type GetApiEquipmentsTypesApiResponse =
  /** status 200 OK */ EquipmentClassDto[];
export type GetApiEquipmentsTypesApiArg = {
  application?: string;
  companyId?: number;
  financialProductId?: number;
  purposeTypeId?: number;
};
export type GetApiEquipmentsBrandsApiResponse =
  /** status 200 OK */ EquipmentOptionDto[];
export type GetApiEquipmentsBrandsApiArg = {
  equipmentTypeId?: number;
  categoryId?: number;
};
export type GetApiEquipmentsModelsApiResponse =
  /** status 200 OK */ EquipmentOptionDto[];
export type GetApiEquipmentsModelsApiArg = {
  equipmentTypeId?: number;
  categoryId?: number;
  brand?: string;
};
export type GetApiEquipmentsVersionsApiResponse =
  /** status 200 OK */ EquipmentOptionDto[];
export type GetApiEquipmentsVersionsApiArg = {
  equipmentTypeId?: number;
  categoryId?: number;
  brand?: string;
  model?: string;
};
export type GetApiFinancialProductsApiResponse =
  /** status 200 OK */ FinancialProductDto[];
export type GetApiFinancialProductsApiArg = {
  companyId?: number;
  businessId?: number;
  importerId?: string | null;
  purposeTypeId?: number;
  marketCampaignId?: number;
  customerTypeId?: number;
  channelId?: number;
  productPurpose?: number;
  operationTypeId?: number;
  includeProductsWithoutImporters?: boolean;
};
export type PostApiFinancialProductsDefaultsApiResponse =
  /** status 200 OK */ CredOperDto;
export type PostApiFinancialProductsDefaultsApiArg = {
  oldFinancialProductId?: number;
  credOperDto: CredOperDto;
};
export type GetApiNewsApiResponse = /** status 200 OK */ NewsDto[];
export type GetApiNewsApiArg = {
  portal?: string;
};
export type GetApiNewsSearchApiResponse =
  /** status 200 OK */ NewsDtoPagedResult;
export type GetApiNewsSearchApiArg = {
  portal?: string;
  search?: string;
  newsTypeId?: number;
  page?: number;
  pageSize?: number;
};
export type GetApiNewsByIdImageApiResponse = unknown;
export type GetApiNewsByIdImageApiArg = {
  id: string;
};
export type GetApiParametrizationScreenCustomizationsApiResponse =
  /** status 200 OK */ ScreenCustomizationDto;
export type GetApiParametrizationScreenCustomizationsApiArg = {
  screenIdentifier?: string;
};
export type PostApiParametrizationScreenCustomizationsApiResponse =
  /** status 200 OK */ ScreenCustomizationDto;
export type PostApiParametrizationScreenCustomizationsApiArg = {
  saveScreenCustomizationRequest: SaveScreenCustomizationRequest;
};
export type GetApiStructNodesMeApiResponse =
  /** status 200 OK */ StructScopeDto;
export type GetApiStructNodesMeApiArg = void;
export type GetApiStructNodesIntermediariesApiResponse =
  /** status 200 OK */ StructNodeDtoPagedResult;
export type GetApiStructNodesIntermediariesApiArg = {
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiStructNodesIntermediariesByIdSuppliersApiResponse =
  /** status 200 OK */ StructNodeDtoPagedResult;
export type GetApiStructNodesIntermediariesByIdSuppliersApiArg = {
  id: string;
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiStructNodesSuppliersByIdPersonsApiResponse =
  /** status 200 OK */ StructNodeDtoPagedResult;
export type GetApiStructNodesSuppliersByIdPersonsApiArg = {
  id: string;
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiStructNodesLawOfficesApiResponse =
  /** status 200 OK */ StructNodeDtoPagedResult;
export type GetApiStructNodesLawOfficesApiArg = {
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiStructNodesLawOfficesByIdDepartmentsApiResponse =
  /** status 200 OK */ StructNodeDtoPagedResult;
export type GetApiStructNodesLawOfficesByIdDepartmentsApiArg = {
  id: string;
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiStructNodesDepartmentsByIdLawyersApiResponse =
  /** status 200 OK */ StructNodeDtoPagedResult;
export type GetApiStructNodesDepartmentsByIdLawyersApiArg = {
  id: string;
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiStructNodesByIdApiResponse =
  /** status 200 OK */ StructNodeDto;
export type GetApiStructNodesByIdApiArg = {
  id: string;
};
export type GetApiUsersMeApiResponse = /** status 200 OK */ UserDetailsDto;
export type GetApiUsersMeApiArg = void;
export type GetApiUsersMeContactsApiResponse =
  /** status 200 OK */ ContactDto[];
export type GetApiUsersMeContactsApiArg = void;
export type GetApiUsersMeContactDetailsApiResponse =
  /** status 200 OK */ UserContactsDto;
export type GetApiUsersMeContactDetailsApiArg = void;
export type PutApiUsersMeContactDetailsApiResponse =
  /** status 200 OK */ UserContactsDto;
export type PutApiUsersMeContactDetailsApiArg = {
  updateMyContactsRequest: UpdateMyContactsRequest;
};
export type PutApiUsersMePhotoApiResponse = unknown;
export type PutApiUsersMePhotoApiArg = {
  body: {
    file?: Blob;
  };
};
export type PostApiUsersConfirmEmailApiResponse = unknown;
export type PostApiUsersConfirmEmailApiArg = {
  emailConfirmationRequest: EmailConfirmationRequest;
};
export type PostApiUsersApiResponse = /** status 200 OK */ ManagedUserDto;
export type PostApiUsersApiArg = {
  createUserRequest: CreateUserRequest;
};
export type GetApiUsersByIdApiResponse = /** status 200 OK */ ManagedUserDto;
export type GetApiUsersByIdApiArg = {
  id: string;
};
export type PutApiUsersByIdApiResponse = /** status 200 OK */ ManagedUserDto;
export type PutApiUsersByIdApiArg = {
  id: string;
  updateUserRequest: UpdateUserRequest;
};
export type GetApiWorkItemsPositionsApiResponse =
  /** status 200 OK */ WorkItemPositionDto[];
export type GetApiWorkItemsPositionsApiArg = void;
export type GetApiWorkItemsDashboardApiResponse =
  /** status 200 OK */ WorkItemDtoPagedResult;
export type GetApiWorkItemsDashboardApiArg = {
  positionId?: string | null;
  page?: number;
  pageSize?: number;
};
export type GetApiWorkItemsSearchApiResponse =
  /** status 200 OK */ WorkItemDtoPagedResult;
export type GetApiWorkItemsSearchApiArg = {
  positionId?: string | null;
  states?: AplWorkItemInternalState[];
  typeId?: number;
  number?: number;
  sort?: AplWorkItemSortingType;
  page?: number;
  pageSize?: number;
};
export type LoginResponse = {
  requiresTwoFactor?: boolean;
  accessToken?: string | null;
  expiresInSeconds?: number | null;
  challengeToken?: string | null;
  requiresPasswordChange?: boolean;
};
export type LoginMethod = "Custom" | "Windows" | "OpenId";
export type MontraAplApplications =
  | "MONTRA_APPLICATION_APP"
  | "MONTRA_APPLICATION_CREDIT"
  | "MONTRA_APPLICATION_LAWYER"
  | "MONTRA_APPLICATION_STOCK"
  | "MONTRA_APPLICATION_FACTORING"
  | "MONTRA_APPLICATION_CUSTOMER";
export type LoginRequest = {
  username?: string | null;
  password?: string | null;
  method?: LoginMethod;
  montraAplApplication?: MontraAplApplications;
  rememberMe?: boolean;
};
export type WindowsLoginRequest = {
  montraAplApplication?: MontraAplApplications;
  rememberMe?: boolean;
};
export type IdpLoginRequest = {
  token?: string | null;
  montraAplApplication?: MontraAplApplications;
  rememberMe?: boolean;
};
export type TwoFactorVerifyRequest = {
  challengeToken?: string | null;
  code?: string | null;
};
export type TwoFactorSetupResponse = {
  secret?: string | null;
  otpAuthUri?: string | null;
};
export type TwoFactorEnableRequest = {
  secret?: string | null;
  code?: string | null;
};
export type ForgotPasswordRequest = {
  username?: string | null;
  email?: string | null;
};
export type ChangePasswordRequest = {
  oldPassword?: string | null;
  newPassword?: string | null;
};
export type RequiredPasswordChangeRequest = {
  challengeToken?: string | null;
  oldPassword?: string | null;
  newPassword?: string | null;
};
export type BuildingDto = {
  aplCompanyId?: number | null;
  assetDepreciationId?: number | null;
  assetPurposeId?: number | null;
  autUserStateId?: number | null;
  buildingDate?: string | null;
  buildingInfoFractionId?: number | null;
  buildingInfoId?: number | null;
  buildingOwnershipTypeId?: number | null;
  buildingStateId?: number | null;
  buildingTypeId?: number | null;
  buildingYear?: number | null;
  currencyId?: string | null;
  depreciationDate?: string | null;
  descr?: string | null;
  hasPaymentCalendar?: boolean | null;
  hasVATChargedPurchaser?: boolean | null;
  /** Protected id (opaque token). */
  id?: string | null;
  isProvisory?: boolean | null;
  netAmount?: number | null;
  paymentCurrencyId?: string | null;
  paymentForexPercentage?: number | null;
  paymentForexRateId?: number | null;
  paymentForexValue?: number | null;
  purchaseAmount?: number | null;
  purchaseDate?: string | null;
  saleDate?: string | null;
  saleInvoice?: number | null;
  saleNetAmount?: number | null;
  /** Protected id (opaque token). */
  sourceBuildingId?: string | null;
  stateDate?: string | null;
  taxAmount?: number | null;
  taxTypeId?: number | null;
};
export type CompanyDto = {
  id?: number;
  abbreviation?: string | null;
  currencyId?: string | null;
};
export type CompanyBusinessDto = {
  id?: number;
  abbreviation?: string | null;
  description?: string | null;
};
export type CountryDto = {
  id?: string | null;
  abbreviation?: string | null;
  description?: string | null;
  alpha2Code?: string | null;
  numericCode?: number | null;
  phonePrefix?: number | null;
  culture?: string | null;
};
export type AvailableFinancialProductDto = {
  id?: number;
  companyId?: number;
  code?: string | null;
  description?: string | null;
  /** Protected ids (opaque tokens). */
  importerIds?: string[];
};
export type AvailableBusinessDto = {
  companyId?: number;
  companyAbbreviation?: string | null;
  id?: number;
  abbreviation?: string | null;
  description?: string | null;
  financialProducts?: AvailableFinancialProductDto[] | null;
};
export type CreditOperationStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 12 | 13 | 99;
export type CredOperSummaryDto = {
  /** Protected id (opaque token). */
  id?: string;
  number?: number | null;
  step?: number | null;
  credOperTypeId?: number | null;
  financialProductId?: number | null;
  stateId?: number | null;
  stateDate?: string | null;
  entryMoment?: string | null;
  beginDate?: string | null;
  amount?: number | null;
  currencyId?: string | null;
  /** Protected id (opaque token). */
  customerEntityId?: string | null;
  entityName?: string | null;
  descr?: string | null;
  /** Protected id (opaque token). */
  importerStructNodeId?: string | null;
  /** Protected id (opaque token). */
  personStructNodeId?: string | null;
};
export type CredOperSummaryDtoPagedResult = {
  items?: CredOperSummaryDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
};
export type CalculationMessageDto = {
  severity?: string | null;
  text?: string | null;
};
export type CreditOperationCalculationDto = {
  isCalculated?: boolean;
  financialProductId?: number;
  currencyId?: string | null;
  beginDate?: string;
  financedAmount?: number;
  term?: number;
  periodId?: number;
  installmentAmount?: number | null;
  installmentAmountWithTax?: number | null;
  implicitRate?: number | null;
  annualRate?: number | null;
  equipmentNetAmount?: number;
  messages?: CalculationMessageDto[] | null;
};
export type EquipmentInputDto = {
  typeId?: number | null;
  categoryId?: number | null;
  stateId?: number | null;
  netAmount?: number;
  description?: string | null;
};
export type CalculateCreditOperationRequest = {
  financialProductId?: number;
  companyId?: number;
  businessId?: number;
  operationTypeId?: number;
  channelId?: number;
  purposeTypeId?: number | null;
  currencyId?: string | null;
  beginDate?: string;
  equipment?: EquipmentInputDto;
  financedAmount?: number;
  term?: number;
  periodId?: number;
};
export type FinConditionsFlowDto = {
  amount?: number | null;
  amountUnrounded?: number | null;
  balloonRentIncludeNormalRent?: boolean | null;
  customerRentalAmount?: number | null;
  customerRentalAmountWithTax?: number | null;
  factor?: number | null;
  fieldCalcStateId?: number | null;
  /** Protected id (opaque token). */
  finConditionsId?: string | null;
  finFlowControlTypeId?: number | null;
  /** Protected id (opaque token). */
  id?: string | null;
  implicitRate?: number | null;
  /** Protected id (opaque token). */
  invoiceEntityId?: string | null;
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
};
export type FinConditionsDto = {
  ani?: number | null;
  acceleratorPeriodTypeId?: number | null;
  acceleratorTypeId?: number | null;
  amountHasTaxes?: boolean | null;
  aplTableId?: number | null;
  arrearsRate?: number | null;
  assetUsage?: number | null;
  calcTransferDateByFinDateMatrix?: boolean | null;
  calculateSpread?: boolean | null;
  capitalizeStampTax?: boolean | null;
  caution?: number | null;
  cautionFactor?: number | null;
  cautionInputModeId?: number | null;
  cautionPercentage?: number | null;
  credOperEventPlanTypeId?: number | null;
  currencyId?: string | null;
  dayRent?: number | null;
  daysWithoutInterest?: number | null;
  differPeriods?: number | null;
  earRate?: number | null;
  erRate?: number | null;
  equipmentAmount?: number | null;
  factoringInvoiceMode?: number | null;
  factoringInvoiceMomentId?: number | null;
  finConditionOfferTypeId?: number | null;
  finConditionsCalcReasonId?: number | null;
  finDueRegimeId?: number | null;
  finInitialEntryTypeId?: number | null;
  finInterestControlTypeId?: number | null;
  finMatrixTypeId?: number | null;
  finRateDefinitionId?: number | null;
  finalDate?: string | null;
  finalExpenseTypeId?: number | null;
  financialValue?: number | null;
  globalFundingRate?: number | null;
  globalIRRate?: number | null;
  globalMargin?: number | null;
  gracePeriods?: number | null;
  hasRenew?: boolean | null;
  irRate?: number | null;
  /** Protected id (opaque token). */
  id?: string | null;
  implicitRate?: number | null;
  indexingRuleId?: number | null;
  initialDate?: string | null;
  initialEntryCaution?: number | null;
  initialEntryCautionPercentage?: number | null;
  initialEntryFactor?: number | null;
  initialEntryPartialValue?: number | null;
  initialEntryPaymentBehaviourTypeId?: number | null;
  initialEntryPercentage?: number | null;
  initialEntryValue?: number | null;
  initialEntryValueWithoutProRata?: number | null;
  initialExpenseTypeId?: number | null;
  initialRentValue?: number | null;
  installmentsPercentage?: number | null;
  interestTaxTypeId?: number | null;
  interestValue?: number | null;
  invoiceDateModeId?: number | null;
  /** Protected id (opaque token). */
  invoiceEntityId?: string | null;
  invoiceNumberRents?: number | null;
  invoiceRetentionPerc?: number | null;
  invoiceRuleId?: number | null;
  isMultiImplicitRate?: boolean | null;
  isSelected?: boolean | null;
  isToIndex?: boolean | null;
  marginRate?: number | null;
  maxRentValue?: number | null;
  maxSubventionAmount?: number | null;
  maxSubventionPercentage?: number | null;
  minDocumentAmount?: number | null;
  /** Protected id (opaque token). */
  newRelatedId?: string | null;
  numOfFlows?: number | null;
  numOfSupplierDays?: number | null;
  originalTerm?: number | null;
  otherFlowsInitialPaymentAmount?: number | null;
  otherFlowsInitialPaymentInputModeId?: number | null;
  otherFlowsInitialPaymentPercentage?: number | null;
  /** Protected id (opaque token). */
  ownerId?: string | null;
  paymentLevelId?: number | null;
  paymentPercentage?: number | null;
  penaltyRate?: number | null;
  periodId?: number | null;
  preFinancingTerm?: number | null;
  profitContribution?: number | null;
  profitContributionRate?: number | null;
  roeBasePercentage?: number | null;
  roePartPercentage?: number | null;
  roePercentage?: number | null;
  referenceRate?: number | null;
  /** Protected id (opaque token). */
  relatedId?: string | null;
  relatedTypeId?: number | null;
  renewDate?: string | null;
  renewTerm?: number | null;
  rentCalcModeId?: number | null;
  rentTaxTypeId?: number | null;
  residualValue?: number | null;
  residualValuePercentage?: number | null;
  residualValueWithTax?: number | null;
  saleTaxTypeId?: number | null;
  sequenceNumber?: number | null;
  simulationType?: number | null;
  spread?: number | null;
  spreadDate?: string | null;
  supplierImplicitRate?: number | null;
  term?: number | null;
  termDays?: number | null;
  termPeriodId?: number | null;
  totalAmountChargedToCustomer?: number | null;
  transferDate?: string | null;
  transferDateFinDateMatrixId?: number | null;
  valueDate?: string | null;
  flows?: FinConditionsFlowDto[] | null;
};
export type AssetTypeKind = 1 | 2;
export type EquipmentDto = {
  accessoriesAmount?: number | null;
  accessoriesMarketValue?: number | null;
  aplCompanyId?: number | null;
  assetDepreciationId?: number | null;
  assetDepreciationPurposeId?: number | null;
  assetOriginId?: number | null;
  assetPurposeId?: number | null;
  assetRetakeBaseCalcModeId?: number | null;
  autUserStateId?: number | null;
  automatonId?: number | null;
  baseMarketValue?: number | null;
  baseNetAmount?: number | null;
  basePurchaseAmount?: number | null;
  bodyCode?: string | null;
  cO2Emission?: number | null;
  cabinSize?: string | null;
  calculationDate?: string | null;
  carConfiguratorId?: string | null;
  colour?: string | null;
  consumption?: number | null;
  currencyId?: string | null;
  depreciationDate?: string | null;
  descr?: string | null;
  driveTrainTypeId?: number | null;
  emissionStandardId?: number | null;
  engineNumber?: string | null;
  engineSize?: number | null;
  equipMonth?: number | null;
  equipVariant?: string | null;
  equipVariantDescr?: string | null;
  equipVersion?: string | null;
  equipYear?: number | null;
  equipmentBrand?: string | null;
  equipmentCategoryId?: number | null;
  equipmentKey?: string | null;
  equipmentModel?: string | null;
  equipmentSegmentId?: number | null;
  equipmentStateId?: number | null;
  equipmentSupplierAffectRuleId?: number | null;
  equipmentTypeId?: number | null;
  faceliftGeneration?: string | null;
  fiscalC02Emissions?: number | null;
  fiscalCategory?: string | null;
  fiscalHorsePower?: number | null;
  frontTyreType?: string | null;
  fuelCardDiscount?: number | null;
  fuelCardLimitAmount?: number | null;
  fuelCardLimitTypeId?: number | null;
  fuelCardOperTypeId?: number | null;
  fuelTypeId?: number | null;
  gearbox?: number | null;
  grantsAmount?: number | null;
  hasCatalyst?: boolean | null;
  hasFuelCard?: boolean | null;
  hasGasInstalation?: boolean | null;
  hasMicroprocessor?: boolean | null;
  hasPaymentCalendar?: boolean | null;
  hasTPMS?: boolean | null;
  hasTollCard?: boolean | null;
  hasVATChargedPurchaser?: boolean | null;
  highwayFuelConsumption?: number | null;
  homologationClassId?: number | null;
  horsePower?: number | null;
  /** Protected id (opaque token). */
  id?: string | null;
  interiorColour?: string | null;
  isCertified?: boolean | null;
  isManualValidation?: boolean | null;
  isMobile?: boolean | null;
  isOptionsMarketValueDefinedByUser?: boolean | null;
  isProvisory?: boolean | null;
  isReimported?: boolean | null;
  isRenovated?: boolean | null;
  isSpecialVehicle?: boolean | null;
  isStandard?: boolean | null;
  licenceDate?: string | null;
  licencePlate?: string | null;
  licencePlateAddressState?: string | null;
  licencePlateAddressStateCode?: string | null;
  licencePlateCouncil?: string | null;
  licencePlateCouncilCode?: number | null;
  licencePlateCountryId?: string | null;
  licencePlateDistrict?: string | null;
  licencePlateDistrictCode?: number | null;
  licencePlateTypeId?: number | null;
  /** Protected id (opaque token). */
  locationStructNodeId?: string | null;
  mandatoryInspectionDate?: string | null;
  mandatoryInspectionNumber?: string | null;
  manufacturer?: string | null;
  manufacturerKeyNumber?: string | null;
  marketBuyValue?: number | null;
  marketNetValueIfNew?: number | null;
  marketValue?: number | null;
  marketValueIfNew?: number | null;
  maxLoadCapacity?: number | null;
  maxPower?: string | null;
  maximumWeight?: number | null;
  modelCode?: string | null;
  modelLine?: string | null;
  modelYear?: number | null;
  netAmount?: number | null;
  /** Protected id (opaque token). */
  newRelatedConditionsId?: string | null;
  numOfAxles?: number | null;
  numOfAxlesDriven?: number | null;
  numOfDoors?: number | null;
  numOfSeats?: number | null;
  numberOfCarKeys?: number | null;
  optionsAmount?: number | null;
  optionsMarketValue?: number | null;
  orderDate?: string | null;
  orderReference?: string | null;
  /** Protected id (opaque token). */
  originalEquipmentId?: string | null;
  otherSerialNumber?: string | null;
  othersOptionsAmount?: number | null;
  ownerAplBusinessId?: number | null;
  ownerHasMultipleFinConditions?: boolean | null;
  paintTypeId?: number | null;
  paymentCurrencyId?: string | null;
  paymentForexPercentage?: number | null;
  paymentForexRateId?: number | null;
  paymentForexValue?: number | null;
  preModelCode?: string | null;
  preModelCodeInputModeId?: number | null;
  previousAssetPurposeId?: number | null;
  productionDate?: string | null;
  purchaseAmount?: number | null;
  purchaseDate?: string | null;
  purchaseInvoice?: string | null;
  quantity?: number | null;
  rearTyreType?: string | null;
  retakeAmount?: number | null;
  retakePercentage?: number | null;
  retakeSyncModeId?: number | null;
  revisionsRange?: string | null;
  rimDimensions?: string | null;
  saleAmount?: number | null;
  saleDate?: string | null;
  saleInvoice?: number | null;
  saleTaxAmount?: number | null;
  serialNumber?: string | null;
  serialNumberIdSector?: string | null;
  /** Protected id (opaque token). */
  sourceEquipmentId?: string | null;
  stateDate?: string | null;
  supplierDiscountAmount?: number | null;
  supplierDiscountGrandTotal?: number | null;
  supplierDiscountNetGrandTotal?: number | null;
  supplierDiscountPercentage?: number | null;
  /** Protected id (opaque token). */
  supplierEntityId?: string | null;
  suspensionTypeId?: number | null;
  taxAmount?: number | null;
  taxClassifierId?: number | null;
  taxTypeId?: number | null;
  techExamDueDate?: string | null;
  tollFuelCardOperTypeId?: number | null;
  topSpeed?: number | null;
  totalOtherSupplierCostsPurchaseAmount?: number | null;
  trimLine?: string | null;
  tylaCode?: string | null;
  typeKeyNumber?: string | null;
  urbanFuelConsumption?: number | null;
  usageReservationManagementId?: number | null;
  useModelList?: boolean | null;
  vehicleTaxAmount?: number | null;
  vehicleTaxAmountCalc?: number | null;
  vehicleTransmissionTypeId?: number | null;
  warrantyEndDate?: string | null;
  weight?: number | null;
};
export type CredOperAssetDto = {
  advancedClientAmount?: number | null;
  amount?: number | null;
  annualAssetUsage?: number | null;
  assetExpenseAmount?: number | null;
  assetItem?: number | null;
  assetSituationTypeId?: number | null;
  assetState?: number | null;
  assetType?: AssetTypeKind;
  assetUsage?: number | null;
  assetUsageInputId?: number | null;
  baseAmount?: number | null;
  baseResidualValue?: number | null;
  baseResidualValueCalcStateId?: number | null;
  baseResidualValuePercentage?: number | null;
  beginDate?: string | null;
  companyForexPercentage?: number | null;
  companyForexRateId?: number | null;
  companyForexValue?: number | null;
  credOperAssetDeliverTypeId?: number | null;
  credOperAssetStateAbrev?: string | null;
  /** Protected id (opaque token). */
  credOperId?: string | null;
  currencyId?: string | null;
  deliverAddressCountryZipCode?: string | null;
  /** Protected id (opaque token). */
  deliverAddressId?: string | null;
  deliverMoment?: string | null;
  /** Protected id (opaque token). */
  deliverStructNodeId?: string | null;
  devolutionDate?: string | null;
  /** Protected id (opaque token). */
  disposableAssetId?: string | null;
  /** Protected id (opaque token). */
  driverEntityId?: string | null;
  /** Protected id (opaque token). */
  driverStructNodeId?: string | null;
  endDate?: string | null;
  /** Protected id (opaque token). */
  entityCostCenterId?: string | null;
  externalContractNumber?: string | null;
  finSymbolProdId?: number | null;
  /** Protected id (opaque token). */
  firstRelatedAssetRegistrationId?: string | null;
  hasOtherUsualDriver?: boolean | null;
  /** Protected id (opaque token). */
  id?: string | null;
  isDelivered?: boolean | null;
  isDisposable?: boolean | null;
  isRelocation?: boolean | null;
  /** Protected id (opaque token). */
  newAssetId?: string | null;
  /** Protected id (opaque token). */
  newRelatedAssetRegistrationId?: string | null;
  numOfAssetsToNextStep?: number | null;
  oldAdjustmentAmount?: number | null;
  oldAdjustmentExpenseTypeId?: number | null;
  oldAssetExpenseAmount?: number | null;
  otherCapitalAmount?: number | null;
  /** Protected id (opaque token). */
  parentCredOperAssetId?: string | null;
  previousDeliverMoment?: string | null;
  purchaseOptionId?: number | null;
  receivingPerson?: string | null;
  recoveredAmount?: number | null;
  /** Protected id (opaque token). */
  relatedAssetId?: string | null;
  remarketingCosts?: number | null;
  residualValue?: number | null;
  residualValueFactorPercentage?: number | null;
  residualValuePercentage?: number | null;
  subCredOperItem?: number | null;
  term?: number | null;
  totalGrossAmount?: number | null;
  /** Protected id (opaque token). */
  assetId?: string | null;
  equipment?: EquipmentDto;
  building?: BuildingDto;
};
export type CredOperIntervRole =
  | "Customer"
  | "Guarantor"
  | "Supplier"
  | "Broker"
  | "Other"
  | "FinancialInstitution";
export type CredOperIntervDto = {
  role?: CredOperIntervRole;
  agreementNumber?: string | null;
  arrearsRateId?: number | null;
  assetRetakeAmount?: number | null;
  assumeCustomerDebts?: boolean | null;
  autUserStateId?: number | null;
  beginDate?: string | null;
  /** Protected id (opaque token). */
  businessPartnerStructNodeId?: string | null;
  communicationMediaId?: number | null;
  /** Protected id (opaque token). */
  congenerCredOperIntervId?: string | null;
  consentUseData?: boolean | null;
  /** Protected id (opaque token). */
  credOperId?: string | null;
  credOperIntervType?: number | null;
  deferredPaymentMode?: number | null;
  delayInterestRateId?: number | null;
  /** Protected id (opaque token). */
  departmentStructNodeId?: string | null;
  docCessionDate?: string | null;
  documentMaxTerm?: number | null;
  dueDeltaDays?: number | null;
  endDate?: string | null;
  /** Protected id (opaque token). */
  entityAddressId?: string | null;
  entityClassificationTypeId?: number | null;
  /** Protected id (opaque token). */
  entityContactId?: string | null;
  /** Protected id (opaque token). */
  entityEmailId?: string | null;
  /** Protected id (opaque token). */
  entityId?: string | null;
  /** Protected id (opaque token). */
  entityPhoneId?: string | null;
  equityCapitalPercentage?: number | null;
  exemptCreditTaxStampAfter?: boolean | null;
  exemptCreditTaxStampBefore?: boolean | null;
  externalNumber?: string | null;
  factoringInvoiceMode?: number | null;
  factoringInvoiceMomentId?: number | null;
  /** Protected id (opaque token). */
  fiscalEntityAddressId?: string | null;
  frameContractMargin?: number | null;
  frameContractTaxTypeId?: number | null;
  hasForeignFiscality?: boolean | null;
  hasNotification?: boolean | null;
  hasRecourse?: boolean | null;
  /** Protected id (opaque token). */
  id?: string | null;
  initialEntryValueRegul?: number | null;
  /** Protected id (opaque token). */
  insurerCredOperIntervId?: string | null;
  intervItem?: number | null;
  /** Protected id (opaque token). */
  intervOtherRelatedEntityId?: string | null;
  intervPercentage?: number | null;
  interventionBehaviourTypeId?: number | null;
  interventionOriginId?: number | null;
  invoiceDateModeId?: number | null;
  isActive?: boolean | null;
  isBeneficialOwner?: boolean | null;
  isBoardOfDirectorsMember?: boolean | null;
  isConsentReceived?: boolean | null;
  isEquityCapitalHolder?: boolean | null;
  isLegalRepresentative?: boolean | null;
  isMain?: boolean | null;
  isSpouseOnLoan?: boolean | null;
  isToInvoice?: boolean | null;
  issueDocument?: boolean | null;
  /** Protected id (opaque token). */
  newRelatedEntityId?: string | null;
  newRelatedEntityTargetContext?: string | null;
  notAdvancedMargin?: number | null;
  notificationDate?: string | null;
  productGeneratedId?: number | null;
  rpScopeId?: number | null;
  /** Protected id (opaque token). */
  residenceHeadquarterEntityAddressId?: string | null;
  responsibilityDeltaDays?: number | null;
  scoringValue?: number | null;
  sendNotificationDate?: string | null;
  stateDate?: string | null;
  validationRequiredByUser?: boolean | null;
};
export type InsurancePolicyDto = {
  accountDate?: string | null;
  agreedInvoicedPremiumRuleId?: number | null;
  amount?: number | null;
  aplCompanyId?: number | null;
  appliedDiscountAmount?: number | null;
  assetPurposeId?: number | null;
  assetTypeGroupId?: number | null;
  autUserStateId?: number | null;
  beginDate?: string | null;
  beginFinCFEventId?: number | null;
  bonusMalusLevelId?: number | null;
  bundleTypeId?: number | null;
  calculationReference?: string | null;
  calculationReferenceDate?: string | null;
  capital?: number | null;
  certificateNumber?: string | null;
  chargeExpense?: boolean | null;
  clientDiscountAmount?: number | null;
  clientDiscountModeId?: number | null;
  clientDiscountPercentage?: number | null;
  creationDate?: string | null;
  currencyId?: string | null;
  dayRent?: number | null;
  descr?: string | null;
  discountAmount?: number | null;
  discountGracePeriod?: number | null;
  discountModeId?: number | null;
  discountPercentage?: number | null;
  endDate?: string | null;
  endFinCFEventId?: number | null;
  /** Protected id (opaque token). */
  entityId?: string | null;
  externalBeginDate?: string | null;
  externalEndDate?: string | null;
  externalYears?: number | null;
  finFlowTypeId?: number | null;
  finalAccountDate?: string | null;
  financedAmount?: number | null;
  firstFlowDate?: string | null;
  gracePeriod?: number | null;
  greenCardNumber?: string | null;
  hasInsuranceFlows?: boolean | null;
  /** Protected id (opaque token). */
  id?: string | null;
  insuranceCompanyRiskPlanTypeId?: number | null;
  insuranceExtraInvoiceModeId?: number | null;
  insuranceFinRewardRelationModeId?: number | null;
  insuranceFlowModeId?: number | null;
  insuranceGrpPriceVersionId?: number | null;
  insuranceIndexingModeId?: number | null;
  insuranceOriginId?: number | null;
  insurancePriceVersionId?: number | null;
  insuranceTypeId?: number | null;
  internalYears?: number | null;
  invoiceCurrencyId?: string | null;
  invoiceWithFlow?: boolean | null;
  invoicedPremium?: number | null;
  isAmountCalculated?: boolean | null;
  isAssetInsurance?: boolean | null;
  isFrozen?: boolean | null;
  isInsurancePriceVersionUserDefined?: boolean | null;
  isInternal?: boolean | null;
  isLifeInsurance?: boolean | null;
  isRecommended?: boolean | null;
  nsa?: string | null;
  netBMPremium?: number | null;
  netPremium?: number | null;
  numOfInsuredEntities?: number | null;
  originalEndDate?: string | null;
  /** Protected id (opaque token). */
  ownerId?: string | null;
  paymentPeriodId?: number | null;
  periodId?: number | null;
  policyNumber?: string | null;
  premium?: number | null;
  productGeneratedId?: number | null;
  /** Protected id (opaque token). */
  relatedId?: string | null;
  replacementVehicleClassId?: number | null;
  retakeAmount?: number | null;
  retakePercentage?: number | null;
  returnPremium?: boolean | null;
  riskPlanTypeAllowedId?: number | null;
  riskPlanTypeId?: number | null;
  /** Protected id (opaque token). */
  sourceInsurancePolicyId?: string | null;
  stateDate?: string | null;
  taxAmount?: number | null;
  taxExemptionReasonId?: number | null;
  taxTypeId?: number | null;
  term?: number | null;
  termSourceModeId?: number | null;
  uncoveredInsurance?: boolean | null;
  uncoveredInsuranceDate?: string | null;
  upgradeConditionRiskPlanTypeId?: number | null;
  upgradeRiskPlanTypeId?: number | null;
  valueDate?: string | null;
  /** Protected id (opaque token). */
  vendorStructNodeId?: string | null;
  wasTaxInvoiced?: boolean | null;
  whoPaidId?: number | null;
};
export type CredOperDto = {
  /** Protected id (opaque token). */
  id?: string | null;
  financialProductId?: number | null;
  credOperNumber?: number | null;
  amount?: number | null;
  beginDate?: string | null;
  aplBusinessId?: number | null;
  credOperTypeId?: number | null;
  aplCompanyId?: number | null;
  finProductVersion?: number | null;
  aplBusinessPurposeTypeId?: number | null;
  credOperChannelId?: number | null;
  currencyId?: string | null;
  hasFinConditions?: boolean | null;
  entryMoment?: string | null;
  entryDate?: string | null;
  autUserStateId?: number | null;
  stateDate?: string | null;
  credOperStep?: number | null;
  /** Protected id (opaque token). */
  creditIntermediaryStructNodeId?: string | null;
  /** Protected id (opaque token). */
  importerStructNodeId?: string | null;
  /** Protected id (opaque token). */
  localStructNodeId?: string | null;
  credOperClassificationId?: number | null;
  entityName?: string | null;
  descr?: string | null;
  conditions?: FinConditionsDto[] | null;
  assets?: CredOperAssetDto[] | null;
  interventions?: CredOperIntervDto[] | null;
  insurances?: InsurancePolicyDto[] | null;
};
export type NewInterventionKind = "Customer" | "SecondHolder" | "Guarantor";
export type CredOperCalculationResultDto = {
  isCalculated?: boolean;
  credOper?: CredOperDto;
  messages?: CalculationMessageDto[] | null;
};
export type EquipmentClassDto = {
  id?: number;
  abbreviation?: string | null;
  description?: string | null;
};
export type EquipmentOptionDto = {
  code?: string | null;
  abbreviation?: string | null;
  description?: string | null;
};
export type FinancialProductDto = {
  id?: number;
  code?: string | null;
  description?: string | null;
};
export type NewsDto = {
  /** Protected id (opaque token). */
  id?: string;
  newsTypeId?: number | null;
  aplCompanyId?: number | null;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  linkUrl?: string | null;
  relatedDocFileName?: string | null;
  validityBeginDate?: string | null;
  validityEndDate?: string | null;
  creationMoment?: string | null;
  lastChangeMoment?: string | null;
};
export type NewsDtoPagedResult = {
  items?: NewsDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
};
export type CompanyConfigurationDto = {
  companyId?: number;
  businesses?: number[] | null;
  proposalBusinesses?: number[] | null;
  equipmentCategories?: number[] | null;
  equipmentTypes?: number[] | null;
  [key: string]: any;
};
export type EmailTypesConfigurationDto = {
  personal?: number | null;
  work?: number | null;
};
export type ScreenCustomizationConfigurationDto = {
  newsTypes?: number[] | null;
  companies?: CompanyConfigurationDto[] | null;
  emailTypes?: EmailTypesConfigurationDto;
  [key: string]: any;
};
export type ScreenCustomizationDto = {
  screenIdentifier?: MontraAplApplications;
  configuration?: ScreenCustomizationConfigurationDto;
};
export type SaveScreenCustomizationRequest = {
  screenIdentifier?: MontraAplApplications;
  configuration?: ScreenCustomizationConfigurationDto;
};
export type StructNodeDto = {
  /** Protected id (opaque token). */
  id?: string;
  name?: string | null;
  typeId?: number | null;
  /** Protected id (opaque token). */
  parentId?: string | null;
  /** Protected id (opaque token). */
  entityId?: string | null;
  isMine?: boolean;
};
export type StructScopeDto = {
  isInternal?: boolean;
  isSupervisor?: boolean;
  ownNodes?: StructNodeDto[] | null;
  /** Protected ids (opaque tokens). */
  anchors?: string[];
};
export type StructNodeDtoPagedResult = {
  items?: StructNodeDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
};
export type UserDetailsDto = {
  /** Protected id (opaque token). */
  id?: string;
  userName?: string | null;
  fullName?: string | null;
  abbreviation?: string | null;
  email?: string | null;
  phone?: string | null;
  culture?: string | null;
  uiCulture?: string | null;
  userType?: string | null;
  groups?: string[] | null;
  positionTitle?: string | null;
  themeId?: number | null;
  /** Protected id (opaque token). */
  photoFileId?: string | null;
};
export type ContactDto = {
  type?: string | null;
  value?: string | null;
  isPrimary?: boolean;
};
export type EmailDto = {
  consentToCommunicate?: boolean | null;
  emailAddress?: string | null;
  entityEmailTypeId?: number | null;
  /** Protected id (opaque token). */
  id?: string | null;
  invalidDate?: string | null;
  isMain?: boolean | null;
  isValidated?: boolean | null;
  /** Protected id (opaque token). */
  ownerId?: string | null;
};
export type PhoneDto = {
  areaCode?: string | null;
  countryId?: string | null;
  extension?: string | null;
  /** Protected id (opaque token). */
  id?: string | null;
  isInactive?: boolean | null;
  isMain?: boolean | null;
  lastCallMoment?: string | null;
  /** Protected id (opaque token). */
  ownerId?: string | null;
  phoneNumber?: string | null;
  phoneTypeId?: number | null;
};
export type AddressLinesDto = {
  street?: string | null;
  others?: string | null;
  postalCode?: string | null;
  locality?: string | null;
  country?: string | null;
};
export type AddressDetailsDto = {
  street?: string | null;
  streetNumber?: string | null;
  houseNumber?: string | null;
  building?: string | null;
  apartment?: string | null;
  occupiedPoint?: string | null;
  place?: string | null;
  poBox?: string | null;
  postalCode?: string | null;
  locality?: string | null;
  parish?: string | null;
  council?: string | null;
  district?: string | null;
  region?: string | null;
  countryId?: string | null;
  extraInfo?: string | null;
  isPostal?: boolean;
  isFiscal?: boolean;
  isHeadquarters?: boolean;
  isPoBox?: boolean;
  isResidential?: boolean;
};
export type AddressDto = {
  /** Protected id (opaque token). */
  id?: string | null;
  addressTypeId?: number | null;
  singleLine?: string | null;
  lines?: AddressLinesDto;
  details?: AddressDetailsDto;
};
export type UserContactsDto = {
  emails?: EmailDto[] | null;
  phones?: PhoneDto[] | null;
  addresses?: AddressDto[] | null;
};
export type UpdateMyContactsRequest = {
  emails?: EmailDto[] | null;
  phones?: PhoneDto[] | null;
  addresses?: AddressDto[] | null;
};
export type EmailConfirmationRequest = {
  code?: string | null;
};
export type ManagedUserDto = {
  /** Protected id (opaque token). */
  id?: string;
  userName?: string | null;
  fullName?: string | null;
  abbreviation?: string | null;
  culture?: string | null;
  uiCulture?: string | null;
  aplUserTypeId?: number | null;
  authorizationLevel?: number | null;
  invalidDate?: string | null;
  /** Protected id (opaque token). */
  entityId?: string | null;
  contacts?: UserContactsDto;
};
export type CreateUserRequest = {
  userName?: string | null;
  fullName?: string | null;
  abbreviation?: string | null;
  email?: string | null;
  aplUserTypeId?: number | null;
  authorizationLevel?: number | null;
  /** Protected id (opaque token). */
  entityId?: string | null;
  culture?: string | null;
  uiCulture?: string | null;
};
export type UpdateUserRequest = {
  fullName?: string | null;
  abbreviation?: string | null;
  culture?: string | null;
  uiCulture?: string | null;
  aplUserTypeId?: number | null;
  authorizationLevel?: number | null;
  invalidDate?: string | null;
  emails?: EmailDto[] | null;
  phones?: PhoneDto[] | null;
};
export type WorkItemPositionDto = {
  /** Protected id (opaque token). */
  id?: string;
  name?: string | null;
  isSelf?: boolean;
};
export type WorkItemPriorityKind = 1 | 2 | 3 | 4;
export type WorkItemDto = {
  /** Protected id (opaque token). */
  id?: string;
  number?: number | null;
  title?: string | null;
  typeId?: number | null;
  type?: string | null;
  stateId?: number | null;
  state?: string | null;
  stateDate?: string | null;
  priorityKind?: WorkItemPriorityKind;
  priority?: string | null;
  creationMoment?: string | null;
  beginDate?: string | null;
  dueMoment?: string | null;
  /** Protected id (opaque token). */
  assignedUserId?: string | null;
  assignedUser?: string | null;
  /** Protected id (opaque token). */
  credOperId?: string | null;
  credOper?: string | null;
  /** Protected id (opaque token). */
  entityId?: string | null;
  entity?: string | null;
  /** Protected id (opaque token). */
  relatedId?: string | null;
  relatedDescr?: string | null;
  companyId?: number | null;
  company?: string | null;
};
export type WorkItemDtoPagedResult = {
  items?: WorkItemDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
};
export type AplWorkItemInternalState = 10 | 11 | 12 | 13 | 14;
export type AplWorkItemSortingType = 1 | 2 | 3 | 4 | 5;
export const {
  usePostApiAuthLoginMutation,
  usePostApiAuthLoginWindowsMutation,
  usePostApiAuthLoginIdpMutation,
  usePostApiAuth2FaVerifyMutation,
  usePostApiAuth2FaSetupMutation,
  usePostApiAuth2FaEnableMutation,
  usePostApiAuthRefreshMutation,
  usePostApiAuthLogoutMutation,
  usePostApiAuthPasswordForgotMutation,
  usePostApiAuthPasswordChangeMutation,
  usePostApiAuthPasswordChangeRequiredMutation,
  useGetApiBuildingsNewQuery,
  useGetApiCompaniesQuery,
  useGetApiCompaniesByIdBusinessesQuery,
  useGetApiCompaniesCountriesQuery,
  useGetApiCreditOperationsBusinessesQuery,
  useGetApiCreditOperationsSearchQuery,
  usePostApiCreditOperationsCalculateMutation,
  useGetApiCreditOperationsNewCredoperQuery,
  useGetApiCreditOperationsNewInterventionQuery,
  useGetApiCreditOperationsNewInsuranceQuery,
  usePostApiCreditOperationsCalculateCredoperMutation,
  useGetApiEquipmentsNewQuery,
  useGetApiEquipmentsCategoriesQuery,
  useGetApiEquipmentsTypesQuery,
  useGetApiEquipmentsBrandsQuery,
  useGetApiEquipmentsModelsQuery,
  useGetApiEquipmentsVersionsQuery,
  useGetApiFinancialProductsQuery,
  usePostApiFinancialProductsDefaultsMutation,
  useGetApiNewsQuery,
  useGetApiNewsSearchQuery,
  useGetApiNewsByIdImageQuery,
  useGetApiParametrizationScreenCustomizationsQuery,
  usePostApiParametrizationScreenCustomizationsMutation,
  useGetApiStructNodesMeQuery,
  useGetApiStructNodesIntermediariesQuery,
  useGetApiStructNodesIntermediariesByIdSuppliersQuery,
  useGetApiStructNodesSuppliersByIdPersonsQuery,
  useGetApiStructNodesLawOfficesQuery,
  useGetApiStructNodesLawOfficesByIdDepartmentsQuery,
  useGetApiStructNodesDepartmentsByIdLawyersQuery,
  useGetApiStructNodesByIdQuery,
  useGetApiUsersMeQuery,
  useGetApiUsersMeContactsQuery,
  useGetApiUsersMeContactDetailsQuery,
  usePutApiUsersMeContactDetailsMutation,
  usePutApiUsersMePhotoMutation,
  usePostApiUsersConfirmEmailMutation,
  usePostApiUsersMutation,
  useGetApiUsersByIdQuery,
  usePutApiUsersByIdMutation,
  useGetApiWorkItemsPositionsQuery,
  useGetApiWorkItemsDashboardQuery,
  useGetApiWorkItemsSearchQuery,
} = injectedRtkApi;
