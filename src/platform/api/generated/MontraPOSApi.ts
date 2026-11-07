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
      query: (queryArg) => ({
        url: `/api/buildings/new`,
        params: {
          companyId: queryArg.companyId,
          businessId: queryArg.businessId,
        },
      }),
    }),
    getApiCatalogApplications: build.query<
      GetApiCatalogApplicationsApiResponse,
      GetApiCatalogApplicationsApiArg
    >({
      query: () => ({ url: `/api/catalog/applications` }),
    }),
    getApiCatalogCompanies: build.query<
      GetApiCatalogCompaniesApiResponse,
      GetApiCatalogCompaniesApiArg
    >({
      query: () => ({ url: `/api/catalog/companies` }),
    }),
    getApiCatalogCompaniesByIdBusinesses: build.query<
      GetApiCatalogCompaniesByIdBusinessesApiResponse,
      GetApiCatalogCompaniesByIdBusinessesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/catalog/companies/${queryArg.id}/businesses`,
      }),
    }),
    getApiCatalogEquipment: build.query<
      GetApiCatalogEquipmentApiResponse,
      GetApiCatalogEquipmentApiArg
    >({
      query: (queryArg) => ({
        url: `/api/catalog/equipment`,
        params: {
          includeInvalid: queryArg.includeInvalid,
        },
      }),
    }),
    getApiCatalogEquipmentCategoryTypes: build.query<
      GetApiCatalogEquipmentCategoryTypesApiResponse,
      GetApiCatalogEquipmentCategoryTypesApiArg
    >({
      query: () => ({ url: `/api/catalog/equipment/category-types` }),
    }),
    getApiCatalogClassifications: build.query<
      GetApiCatalogClassificationsApiResponse,
      GetApiCatalogClassificationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/catalog/classifications`,
        params: {
          includeInvalid: queryArg.includeInvalid,
        },
      }),
    }),
    getApiCatalogAssetTypes: build.query<
      GetApiCatalogAssetTypesApiResponse,
      GetApiCatalogAssetTypesApiArg
    >({
      query: () => ({ url: `/api/catalog/asset-types` }),
    }),
    getApiCatalogNewsTypes: build.query<
      GetApiCatalogNewsTypesApiResponse,
      GetApiCatalogNewsTypesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/catalog/news-types`,
        params: {
          includeInvalid: queryArg.includeInvalid,
        },
      }),
    }),
    getApiCatalogEmailTypes: build.query<
      GetApiCatalogEmailTypesApiResponse,
      GetApiCatalogEmailTypesApiArg
    >({
      query: () => ({ url: `/api/catalog/email-types` }),
    }),
    getApiCompanies: build.query<
      GetApiCompaniesApiResponse,
      GetApiCompaniesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/companies`,
        params: {
          application: queryArg.application,
        },
      }),
    }),
    getApiCompaniesByIdBusinesses: build.query<
      GetApiCompaniesByIdBusinessesApiResponse,
      GetApiCompaniesByIdBusinessesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/companies/${queryArg.id}/businesses`,
        params: {
          application: queryArg.application,
          credOperStep: queryArg.credOperStep,
        },
      }),
    }),
    getApiCompaniesCountries: build.query<
      GetApiCompaniesCountriesApiResponse,
      GetApiCompaniesCountriesApiArg
    >({
      query: () => ({ url: `/api/companies/countries` }),
    }),
    getApiCreditOperationsClassifications: build.query<
      GetApiCreditOperationsClassificationsApiResponse,
      GetApiCreditOperationsClassificationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/credit-operations/classifications`,
        params: {
          application: queryArg.application,
          companyId: queryArg.companyId,
          businessId: queryArg.businessId,
        },
      }),
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
    getApiCreditOperationsAssetTypes: build.query<
      GetApiCreditOperationsAssetTypesApiResponse,
      GetApiCreditOperationsAssetTypesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/credit-operations/asset-types`,
        params: {
          application: queryArg.application,
          companyId: queryArg.companyId,
          businessId: queryArg.businessId,
          financialProductIds: queryArg.financialProductIds,
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
    getApiCreditOperationsNewCredoper: build.query<
      GetApiCreditOperationsNewCredoperApiResponse,
      GetApiCreditOperationsNewCredoperApiArg
    >({
      query: (queryArg) => ({
        url: `/api/credit-operations/new-credoper`,
        params: {
          credOperStep: queryArg.credOperStep,
          companyId: queryArg.companyId,
          businessId: queryArg.businessId,
          assetType: queryArg.assetType,
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
          credOperClassificationId: queryArg.credOperClassificationId,
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
    postApiCreditOperationsSaveCredoper: build.mutation<
      PostApiCreditOperationsSaveCredoperApiResponse,
      PostApiCreditOperationsSaveCredoperApiArg
    >({
      query: (queryArg) => ({
        url: `/api/credit-operations/save-credoper`,
        method: "POST",
        body: queryArg.credOperDto,
      }),
    }),
    getApiCreditOperationsCredoperById: build.query<
      GetApiCreditOperationsCredoperByIdApiResponse,
      GetApiCreditOperationsCredoperByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/credit-operations/credoper/${queryArg.id}`,
      }),
    }),
    getApiCreditOperationsCredoperByIdQuotationToProposal: build.query<
      GetApiCreditOperationsCredoperByIdQuotationToProposalApiResponse,
      GetApiCreditOperationsCredoperByIdQuotationToProposalApiArg
    >({
      query: (queryArg) => ({
        url: `/api/credit-operations/credoper/${queryArg.id}/quotation-to-proposal`,
      }),
    }),
    getApiEntitiesGenders: build.query<
      GetApiEntitiesGendersApiResponse,
      GetApiEntitiesGendersApiArg
    >({
      query: (queryArg) => ({
        url: `/api/entities/genders`,
        params: {
          search: queryArg.search,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiEntitiesMaritalStatuses: build.query<
      GetApiEntitiesMaritalStatusesApiResponse,
      GetApiEntitiesMaritalStatusesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/entities/marital-statuses`,
        params: {
          search: queryArg.search,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiEntitiesProfessions: build.query<
      GetApiEntitiesProfessionsApiResponse,
      GetApiEntitiesProfessionsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/entities/professions`,
        params: {
          search: queryArg.search,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiEntitiesLegalDocTypes: build.query<
      GetApiEntitiesLegalDocTypesApiResponse,
      GetApiEntitiesLegalDocTypesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/entities/legal-doc-types`,
        params: {
          search: queryArg.search,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiEntitiesPhoneTypes: build.query<
      GetApiEntitiesPhoneTypesApiResponse,
      GetApiEntitiesPhoneTypesApiArg
    >({
      query: () => ({ url: `/api/entities/phone-types` }),
    }),
    getApiEntitiesActivityTypes: build.query<
      GetApiEntitiesActivityTypesApiResponse,
      GetApiEntitiesActivityTypesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/entities/activity-types`,
        params: {
          search: queryArg.search,
          contextId: queryArg.contextId,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiEntitiesJuridicalTypes: build.query<
      GetApiEntitiesJuridicalTypesApiResponse,
      GetApiEntitiesJuridicalTypesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/entities/juridical-types`,
        params: {
          search: queryArg.search,
          kind: queryArg.kind,
          countryId: queryArg.countryId,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    postApiEntitiesLookup: build.mutation<
      PostApiEntitiesLookupApiResponse,
      PostApiEntitiesLookupApiArg
    >({
      query: (queryArg) => ({
        url: `/api/entities/lookup`,
        method: "POST",
        body: queryArg.entityLookupRequestDto,
      }),
    }),
    postApiEntitiesOtp: build.mutation<
      PostApiEntitiesOtpApiResponse,
      PostApiEntitiesOtpApiArg
    >({
      query: (queryArg) => ({
        url: `/api/entities/otp`,
        method: "POST",
        body: queryArg.otpSendRequestDto,
      }),
    }),
    postApiEntitiesOtpVerify: build.mutation<
      PostApiEntitiesOtpVerifyApiResponse,
      PostApiEntitiesOtpVerifyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/entities/otp/verify`,
        method: "POST",
        body: queryArg.otpVerifyRequestDto,
      }),
    }),
    getApiEquipmentsNew: build.query<
      GetApiEquipmentsNewApiResponse,
      GetApiEquipmentsNewApiArg
    >({
      query: (queryArg) => ({
        url: `/api/equipments/new`,
        params: {
          companyId: queryArg.companyId,
          businessId: queryArg.businessId,
        },
      }),
    }),
    postApiEquipmentsRetake: build.mutation<
      PostApiEquipmentsRetakeApiResponse,
      PostApiEquipmentsRetakeApiArg
    >({
      query: (queryArg) => ({
        url: `/api/equipments/retake`,
        method: "POST",
        body: queryArg.equipmentRetakeRequestDto,
      }),
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
    getApiEquipmentsStates: build.query<
      GetApiEquipmentsStatesApiResponse,
      GetApiEquipmentsStatesApiArg
    >({
      query: () => ({ url: `/api/equipments/states` }),
    }),
    getApiFactoringContracts: build.query<
      GetApiFactoringContractsApiResponse,
      GetApiFactoringContractsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/factoring/contracts`,
        params: {
          kind: queryArg.kind,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiFactoringContractsByIdCounterparties: build.query<
      GetApiFactoringContractsByIdCounterpartiesApiResponse,
      GetApiFactoringContractsByIdCounterpartiesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/factoring/contracts/${queryArg.id}/counterparties`,
        params: {
          includePending: queryArg.includePending,
        },
      }),
    }),
    postApiFactoringContractsByIdCounterparties: build.mutation<
      PostApiFactoringContractsByIdCounterpartiesApiResponse,
      PostApiFactoringContractsByIdCounterpartiesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/factoring/contracts/${queryArg.id}/counterparties`,
        method: "POST",
        body: queryArg.newFactoringCounterpartyDto,
      }),
    }),
    postApiFactoringContractsByIdCessions: build.mutation<
      PostApiFactoringContractsByIdCessionsApiResponse,
      PostApiFactoringContractsByIdCessionsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/factoring/contracts/${queryArg.id}/cessions`,
        method: "POST",
        body: queryArg.newFactoringCessionDto,
      }),
    }),
    postApiFactoringContractsByIdAdvancesSummary: build.mutation<
      PostApiFactoringContractsByIdAdvancesSummaryApiResponse,
      PostApiFactoringContractsByIdAdvancesSummaryApiArg
    >({
      query: (queryArg) => ({
        url: `/api/factoring/contracts/${queryArg.id}/advances/summary`,
        method: "POST",
        body: queryArg.factoringAdvanceSummaryRequestDto,
      }),
    }),
    postApiFactoringContractsByIdAdvances: build.mutation<
      PostApiFactoringContractsByIdAdvancesApiResponse,
      PostApiFactoringContractsByIdAdvancesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/factoring/contracts/${queryArg.id}/advances`,
        method: "POST",
        body: queryArg.newFactoringAdvanceDto,
      }),
    }),
    getApiFactoringAdvances: build.query<
      GetApiFactoringAdvancesApiResponse,
      GetApiFactoringAdvancesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/factoring/advances`,
        params: {
          contractId: queryArg.contractId,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiFactoringAdvancesBatchesById: build.query<
      GetApiFactoringAdvancesBatchesByIdApiResponse,
      GetApiFactoringAdvancesBatchesByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/factoring/advances/batches/${queryArg.id}`,
      }),
    }),
    getApiFactoringDocuments: build.query<
      GetApiFactoringDocumentsApiResponse,
      GetApiFactoringDocumentsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/factoring/documents`,
        params: {
          contractId: queryArg.contractId,
          kind: queryArg.kind,
          status: queryArg.status,
          search: queryArg.search,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiFactoringCessions: build.query<
      GetApiFactoringCessionsApiResponse,
      GetApiFactoringCessionsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/factoring/cessions`,
        params: {
          contractId: queryArg.contractId,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiFactoringCessionsById: build.query<
      GetApiFactoringCessionsByIdApiResponse,
      GetApiFactoringCessionsByIdApiArg
    >({
      query: (queryArg) => ({ url: `/api/factoring/cessions/${queryArg.id}` }),
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
    getApiHealthLive: build.query<
      GetApiHealthLiveApiResponse,
      GetApiHealthLiveApiArg
    >({
      query: () => ({ url: `/api/health/live` }),
    }),
    getApiHealth: build.query<GetApiHealthApiResponse, GetApiHealthApiArg>({
      query: () => ({ url: `/api/health` }),
    }),
    getApiNewsTypes: build.query<
      GetApiNewsTypesApiResponse,
      GetApiNewsTypesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/news/types`,
        params: {
          portal: queryArg.portal,
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
    getApiStockContracts: build.query<
      GetApiStockContractsApiResponse,
      GetApiStockContractsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/stock/contracts`,
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    postApiStockContractsByIdUnits: build.mutation<
      PostApiStockContractsByIdUnitsApiResponse,
      PostApiStockContractsByIdUnitsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/stock/contracts/${queryArg.id}/units`,
        method: "POST",
        body: queryArg.newStockUnitDto,
      }),
    }),
    getApiStockContractsByIdCashFlow: build.query<
      GetApiStockContractsByIdCashFlowApiResponse,
      GetApiStockContractsByIdCashFlowApiArg
    >({
      query: (queryArg) => ({
        url: `/api/stock/contracts/${queryArg.id}/cash-flow`,
      }),
    }),
    getApiStockContractsByIdNettingAccounts: build.query<
      GetApiStockContractsByIdNettingAccountsApiResponse,
      GetApiStockContractsByIdNettingAccountsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/stock/contracts/${queryArg.id}/netting-accounts`,
      }),
    }),
    getApiStockContractsByIdPaymentEndReasons: build.query<
      GetApiStockContractsByIdPaymentEndReasonsApiResponse,
      GetApiStockContractsByIdPaymentEndReasonsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/stock/contracts/${queryArg.id}/payment-end-reasons`,
      }),
    }),
    postApiStockPayments: build.mutation<
      PostApiStockPaymentsApiResponse,
      PostApiStockPaymentsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/stock/payments`,
        method: "POST",
        body: queryArg.newStockPaymentDto,
      }),
    }),
    getApiStockPaymentsById: build.query<
      GetApiStockPaymentsByIdApiResponse,
      GetApiStockPaymentsByIdApiArg
    >({
      query: (queryArg) => ({ url: `/api/stock/payments/${queryArg.id}` }),
    }),
    getApiStockUnits: build.query<
      GetApiStockUnitsApiResponse,
      GetApiStockUnitsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/stock/units`,
        params: {
          contractId: queryArg.contractId,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiStockUnitsById: build.query<
      GetApiStockUnitsByIdApiResponse,
      GetApiStockUnitsByIdApiArg
    >({
      query: (queryArg) => ({ url: `/api/stock/units/${queryArg.id}` }),
    }),
    getApiStockUnitsByIdCashFlow: build.query<
      GetApiStockUnitsByIdCashFlowApiResponse,
      GetApiStockUnitsByIdCashFlowApiArg
    >({
      query: (queryArg) => ({
        url: `/api/stock/units/${queryArg.id}/cash-flow`,
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
export type GetApiBuildingsNewApiResponse =
  /** status 200 OK */ CredOperAssetDto;
export type GetApiBuildingsNewApiArg = {
  companyId: number;
  businessId: number;
};
export type GetApiCatalogApplicationsApiResponse =
  /** status 200 OK */ ApplicationDto[];
export type GetApiCatalogApplicationsApiArg = void;
export type GetApiCatalogCompaniesApiResponse =
  /** status 200 OK */ CompanyDto[];
export type GetApiCatalogCompaniesApiArg = void;
export type GetApiCatalogCompaniesByIdBusinessesApiResponse =
  /** status 200 OK */ CompanyBusinessDto[];
export type GetApiCatalogCompaniesByIdBusinessesApiArg = {
  id: number;
};
export type GetApiCatalogEquipmentApiResponse =
  /** status 200 OK */ EquipmentCatalogTypeDto[];
export type GetApiCatalogEquipmentApiArg = {
  includeInvalid?: boolean;
};
export type GetApiCatalogEquipmentCategoryTypesApiResponse =
  /** status 200 OK */ EquipmentCategoryTypeDto[];
export type GetApiCatalogEquipmentCategoryTypesApiArg = void;
export type GetApiCatalogClassificationsApiResponse =
  /** status 200 OK */ CredOperClassificationDto[];
export type GetApiCatalogClassificationsApiArg = {
  includeInvalid?: boolean;
};
export type GetApiCatalogAssetTypesApiResponse =
  /** status 200 OK */ AssetTypeDto[];
export type GetApiCatalogAssetTypesApiArg = void;
export type GetApiCatalogNewsTypesApiResponse =
  /** status 200 OK */ NewsTypeDto[];
export type GetApiCatalogNewsTypesApiArg = {
  includeInvalid?: boolean;
};
export type GetApiCatalogEmailTypesApiResponse =
  /** status 200 OK */ EmailTypeDto[];
export type GetApiCatalogEmailTypesApiArg = void;
export type GetApiCompaniesApiResponse = /** status 200 OK */ CompanyDto[];
export type GetApiCompaniesApiArg = {
  application?: MontraAplApplications;
};
export type GetApiCompaniesByIdBusinessesApiResponse =
  /** status 200 OK */ CompanyBusinessDto[];
export type GetApiCompaniesByIdBusinessesApiArg = {
  id: number;
  application?: MontraAplApplications;
  credOperStep?: CreditOperationStep;
};
export type GetApiCompaniesCountriesApiResponse =
  /** status 200 OK */ CountryDto[];
export type GetApiCompaniesCountriesApiArg = void;
export type GetApiCreditOperationsClassificationsApiResponse =
  /** status 200 OK */ CredOperClassificationDto[];
export type GetApiCreditOperationsClassificationsApiArg = {
  application?: MontraAplApplications;
  companyId?: number;
  businessId?: number;
};
export type GetApiCreditOperationsBusinessesApiResponse =
  /** status 200 OK */ AvailableBusinessDto[];
export type GetApiCreditOperationsBusinessesApiArg = {
  application?: MontraAplApplications;
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
export type GetApiCreditOperationsAssetTypesApiResponse =
  /** status 200 OK */ AssetTypeDto[];
export type GetApiCreditOperationsAssetTypesApiArg = {
  application?: MontraAplApplications;
  companyId: number;
  businessId: number;
  financialProductIds?: number[];
};
export type GetApiCreditOperationsSearchApiResponse =
  /** status 200 OK */ PagedResultOfCredOperSummaryDto;
export type GetApiCreditOperationsSearchApiArg = {
  number?: number;
  step?: CreditOperationStep;
  stateId?: number;
  page?: number;
  pageSize?: number;
};
export type GetApiCreditOperationsNewCredoperApiResponse =
  /** status 200 OK */ CredOperDto;
export type GetApiCreditOperationsNewCredoperApiArg = {
  credOperStep?: CreditOperationStep;
  companyId: number;
  businessId: number;
  assetType?: AssetTypeKind;
};
export type GetApiCreditOperationsNewInterventionApiResponse =
  /** status 200 OK */ CredOperIntervDto;
export type GetApiCreditOperationsNewInterventionApiArg = {
  kind?: NewInterventionKind;
  credOperClassificationId?: number;
};
export type GetApiCreditOperationsNewInsuranceApiResponse =
  /** status 200 OK */ InsurancePolicyDto;
export type GetApiCreditOperationsNewInsuranceApiArg = void;
export type PostApiCreditOperationsCalculateCredoperApiResponse =
  /** status 200 OK */ CredOperCalculationResultDto;
export type PostApiCreditOperationsCalculateCredoperApiArg = {
  credOperDto: CredOperDto;
};
export type PostApiCreditOperationsSaveCredoperApiResponse =
  /** status 200 OK */ CredOperSaveResultDto;
export type PostApiCreditOperationsSaveCredoperApiArg = {
  credOperDto: CredOperDto;
};
export type GetApiCreditOperationsCredoperByIdApiResponse =
  /** status 200 OK */ CredOperDto;
export type GetApiCreditOperationsCredoperByIdApiArg = {
  id: string;
};
export type GetApiCreditOperationsCredoperByIdQuotationToProposalApiResponse =
  /** status 200 OK */ QuotationToProposalDto;
export type GetApiCreditOperationsCredoperByIdQuotationToProposalApiArg = {
  id: string;
};
export type GetApiEntitiesGendersApiResponse =
  /** status 200 OK */ PagedResultOfEntityOptionDto;
export type GetApiEntitiesGendersApiArg = {
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiEntitiesMaritalStatusesApiResponse =
  /** status 200 OK */ PagedResultOfEntityOptionDto;
export type GetApiEntitiesMaritalStatusesApiArg = {
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiEntitiesProfessionsApiResponse =
  /** status 200 OK */ PagedResultOfEntityOptionDto;
export type GetApiEntitiesProfessionsApiArg = {
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiEntitiesLegalDocTypesApiResponse =
  /** status 200 OK */ PagedResultOfEntityOptionDto;
export type GetApiEntitiesLegalDocTypesApiArg = {
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiEntitiesPhoneTypesApiResponse =
  /** status 200 OK */ PhoneTypeDto[];
export type GetApiEntitiesPhoneTypesApiArg = void;
export type GetApiEntitiesActivityTypesApiResponse =
  /** status 200 OK */ PagedResultOfActivityTypeDto;
export type GetApiEntitiesActivityTypesApiArg = {
  search?: string;
  contextId?: number;
  page?: number;
  pageSize?: number;
};
export type GetApiEntitiesJuridicalTypesApiResponse =
  /** status 200 OK */ PagedResultOfJuridicalTypeDto;
export type GetApiEntitiesJuridicalTypesApiArg = {
  search?: string;
  kind?: IntervEntityKind;
  countryId?: string;
  page?: number;
  pageSize?: number;
};
export type PostApiEntitiesLookupApiResponse =
  /** status 200 OK */ EntityLookupResultDto;
export type PostApiEntitiesLookupApiArg = {
  entityLookupRequestDto: EntityLookupRequestDto;
};
export type PostApiEntitiesOtpApiResponse = /** status 200 OK */ OtpSentDto;
export type PostApiEntitiesOtpApiArg = {
  otpSendRequestDto: OtpSendRequestDto;
};
export type PostApiEntitiesOtpVerifyApiResponse =
  /** status 200 OK */ EntityPreloadDto;
export type PostApiEntitiesOtpVerifyApiArg = {
  otpVerifyRequestDto: OtpVerifyRequestDto;
};
export type GetApiEquipmentsNewApiResponse =
  /** status 200 OK */ CredOperAssetDto;
export type GetApiEquipmentsNewApiArg = {
  companyId: number;
  businessId: number;
};
export type PostApiEquipmentsRetakeApiResponse =
  /** status 200 OK */ CredOperAssetDto;
export type PostApiEquipmentsRetakeApiArg = {
  equipmentRetakeRequestDto: EquipmentRetakeRequestDto;
};
export type GetApiEquipmentsCategoriesApiResponse =
  /** status 200 OK */ EquipmentClassDto[];
export type GetApiEquipmentsCategoriesApiArg = {
  application?: MontraAplApplications;
  companyId?: number;
  equipmentTypeId?: number;
  financialProductId?: number;
};
export type GetApiEquipmentsTypesApiResponse =
  /** status 200 OK */ EquipmentClassDto[];
export type GetApiEquipmentsTypesApiArg = {
  application?: MontraAplApplications;
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
export type GetApiEquipmentsStatesApiResponse =
  /** status 200 OK */ EquipmentClassDto[];
export type GetApiEquipmentsStatesApiArg = void;
export type GetApiFactoringContractsApiResponse =
  /** status 200 OK */ PagedResultOfFactoringContractDto;
export type GetApiFactoringContractsApiArg = {
  kind?: FactoringKind;
  page?: number;
  pageSize?: number;
};
export type GetApiFactoringContractsByIdCounterpartiesApiResponse =
  /** status 200 OK */ FactoringCounterpartyDto[];
export type GetApiFactoringContractsByIdCounterpartiesApiArg = {
  id: string;
  includePending?: boolean;
};
export type PostApiFactoringContractsByIdCounterpartiesApiResponse =
  /** status 200 OK */ FactoringCounterpartyResultDto;
export type PostApiFactoringContractsByIdCounterpartiesApiArg = {
  id: string;
  newFactoringCounterpartyDto: NewFactoringCounterpartyDto;
};
export type PostApiFactoringContractsByIdCessionsApiResponse =
  /** status 200 OK */ FactoringCessionResultDto;
export type PostApiFactoringContractsByIdCessionsApiArg = {
  id: string;
  newFactoringCessionDto: NewFactoringCessionDto;
};
export type PostApiFactoringContractsByIdAdvancesSummaryApiResponse =
  /** status 200 OK */ FactoringAdvanceSummaryDto;
export type PostApiFactoringContractsByIdAdvancesSummaryApiArg = {
  id: string;
  factoringAdvanceSummaryRequestDto: FactoringAdvanceSummaryRequestDto;
};
export type PostApiFactoringContractsByIdAdvancesApiResponse =
  /** status 200 OK */ FactoringAdvanceResultDto;
export type PostApiFactoringContractsByIdAdvancesApiArg = {
  id: string;
  newFactoringAdvanceDto: NewFactoringAdvanceDto;
};
export type GetApiFactoringAdvancesApiResponse =
  /** status 200 OK */ PagedResultOfFactoringAdvanceDto;
export type GetApiFactoringAdvancesApiArg = {
  contractId?: string | null;
  page?: number;
  pageSize?: number;
};
export type GetApiFactoringAdvancesBatchesByIdApiResponse =
  /** status 200 OK */ FactoringAdvanceBatchDto;
export type GetApiFactoringAdvancesBatchesByIdApiArg = {
  id: string;
};
export type GetApiFactoringDocumentsApiResponse =
  /** status 200 OK */ FactoringDocumentPageDto;
export type GetApiFactoringDocumentsApiArg = {
  contractId?: string | null;
  kind?: FactoringKind;
  status?: FactoringDocumentStatus;
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiFactoringCessionsApiResponse =
  /** status 200 OK */ PagedResultOfFactoringCessionDto;
export type GetApiFactoringCessionsApiArg = {
  contractId?: string | null;
  page?: number;
  pageSize?: number;
};
export type GetApiFactoringCessionsByIdApiResponse =
  /** status 200 OK */ FactoringCessionDetailDto;
export type GetApiFactoringCessionsByIdApiArg = {
  id: string;
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
export type GetApiHealthLiveApiResponse = unknown;
export type GetApiHealthLiveApiArg = void;
export type GetApiHealthApiResponse = /** status 200 OK */ HealthDto;
export type GetApiHealthApiArg = void;
export type GetApiNewsTypesApiResponse = /** status 200 OK */ NewsTypeDto[];
export type GetApiNewsTypesApiArg = {
  portal?: MontraAplApplications;
};
export type GetApiNewsApiResponse = /** status 200 OK */ NewsDto[];
export type GetApiNewsApiArg = {
  portal?: MontraAplApplications;
};
export type GetApiNewsSearchApiResponse =
  /** status 200 OK */ PagedResultOfNewsDto;
export type GetApiNewsSearchApiArg = {
  portal?: MontraAplApplications;
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
  screenIdentifier?: MontraAplApplications;
};
export type PostApiParametrizationScreenCustomizationsApiResponse =
  /** status 200 OK */ ScreenCustomizationDto;
export type PostApiParametrizationScreenCustomizationsApiArg = {
  saveScreenCustomizationRequest: SaveScreenCustomizationRequest;
};
export type GetApiStockContractsApiResponse =
  /** status 200 OK */ PagedResultOfStockContractDto;
export type GetApiStockContractsApiArg = {
  page?: number;
  pageSize?: number;
};
export type PostApiStockContractsByIdUnitsApiResponse =
  /** status 200 OK */ StockUnitSaveResultDto;
export type PostApiStockContractsByIdUnitsApiArg = {
  id: string;
  newStockUnitDto: NewStockUnitDto;
};
export type GetApiStockContractsByIdCashFlowApiResponse =
  /** status 200 OK */ StockCashFlowDto;
export type GetApiStockContractsByIdCashFlowApiArg = {
  id: string;
};
export type GetApiStockContractsByIdNettingAccountsApiResponse =
  /** status 200 OK */ StockNettingAccountDto[];
export type GetApiStockContractsByIdNettingAccountsApiArg = {
  id: string;
};
export type GetApiStockContractsByIdPaymentEndReasonsApiResponse =
  /** status 200 OK */ StockPaymentEndReasonDto[];
export type GetApiStockContractsByIdPaymentEndReasonsApiArg = {
  id: string;
};
export type PostApiStockPaymentsApiResponse =
  /** status 200 OK */ StockPaymentResultDto;
export type PostApiStockPaymentsApiArg = {
  newStockPaymentDto: NewStockPaymentDto;
};
export type GetApiStockPaymentsByIdApiResponse =
  /** status 200 OK */ StockPaymentStatusDto;
export type GetApiStockPaymentsByIdApiArg = {
  id: string;
};
export type GetApiStockUnitsApiResponse =
  /** status 200 OK */ PagedResultOfStockUnitListItemDto;
export type GetApiStockUnitsApiArg = {
  contractId?: string | null;
  page?: number;
  pageSize?: number;
};
export type GetApiStockUnitsByIdApiResponse =
  /** status 200 OK */ StockUnitListItemDto;
export type GetApiStockUnitsByIdApiArg = {
  id: string;
};
export type GetApiStockUnitsByIdCashFlowApiResponse =
  /** status 200 OK */ StockCashFlowDto;
export type GetApiStockUnitsByIdCashFlowApiArg = {
  id: string;
};
export type GetApiStructNodesMeApiResponse =
  /** status 200 OK */ StructScopeDto;
export type GetApiStructNodesMeApiArg = void;
export type GetApiStructNodesIntermediariesApiResponse =
  /** status 200 OK */ PagedResultOfStructNodeDto;
export type GetApiStructNodesIntermediariesApiArg = {
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiStructNodesIntermediariesByIdSuppliersApiResponse =
  /** status 200 OK */ PagedResultOfStructNodeDto;
export type GetApiStructNodesIntermediariesByIdSuppliersApiArg = {
  id: string;
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiStructNodesSuppliersByIdPersonsApiResponse =
  /** status 200 OK */ PagedResultOfStructNodeDto;
export type GetApiStructNodesSuppliersByIdPersonsApiArg = {
  id: string;
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiStructNodesLawOfficesApiResponse =
  /** status 200 OK */ PagedResultOfStructNodeDto;
export type GetApiStructNodesLawOfficesApiArg = {
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiStructNodesLawOfficesByIdDepartmentsApiResponse =
  /** status 200 OK */ PagedResultOfStructNodeDto;
export type GetApiStructNodesLawOfficesByIdDepartmentsApiArg = {
  id: string;
  search?: string;
  page?: number;
  pageSize?: number;
};
export type GetApiStructNodesDepartmentsByIdLawyersApiResponse =
  /** status 200 OK */ PagedResultOfStructNodeDto;
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
  /** status 200 OK */ PagedResultOfWorkItemDto;
export type GetApiWorkItemsDashboardApiArg = {
  positionId?: string | null;
  page?: number;
  pageSize?: number;
};
export type GetApiWorkItemsSearchApiResponse =
  /** status 200 OK */ PagedResultOfWorkItemDto;
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
export type AssetTypeKind = "Equipment" | "Building";
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
export type ApplicationDto = {
  name?: MontraAplApplications;
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
export type EquipmentCatalogCategoryDto = {
  id?: number;
  abbreviation?: string | null;
  description?: string | null;
  categoryTypeId?: number | null;
  isValid?: boolean;
};
export type EquipmentCatalogTypeDto = {
  id?: number;
  abbreviation?: string | null;
  description?: string | null;
  isVehicle?: boolean | null;
  isValid?: boolean;
  categories?: EquipmentCatalogCategoryDto[] | null;
};
export type EquipmentCategoryTypeDto = {
  id?: number;
  abbreviation?: string | null;
  description?: string | null;
};
export type IntervEntityKind = "Person" | "Company";
export type CredOperClassificationDto = {
  id?: number;
  abbreviation?: string | null;
  description?: string | null;
  isValid?: boolean;
  entitySuperType?: IntervEntityKind;
};
export type AssetTypeDto = {
  id?: number | null;
  abbreviation?: string | null;
};
export type NewsTypeDto = {
  id?: number;
  abbreviation?: string | null;
  description?: string | null;
  isValid?: boolean;
};
export type EmailTypeDto = {
  id?: number;
  abbreviation?: string | null;
  description?: string | null;
};
export type CreditOperationStep =
  | "Quotation"
  | "Proposal"
  | "Contract"
  | "Cession"
  | "Loan"
  | "Projection"
  | "Agreement"
  | "MLAProposal"
  | "MLAContract"
  | "ExternalOperation";
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
export type CredOperSummaryDto = {
  /** Protected id (opaque token). */
  id?: string;
  number?: number | null;
  step?: CreditOperationStep;
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
  branchStructNodeId?: string | null;
};
export type PagedResultOfCredOperSummaryDto = {
  items?: CredOperSummaryDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
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
export type CredOperIntervRole =
  | "Customer"
  | "Guarantor"
  | "Supplier"
  | "Broker"
  | "Other"
  | "FinancialInstitution";
export type PersonDto = {
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
  employerAplTableId?: number | null;
  employerCountryId?: string | null;
  employerEntityPositionId?: number | null;
  employerFiscalNumber?: string | null;
  /** Protected id (opaque token). */
  employerRelatedId?: string | null;
  employerSelectionTypeId?: number | null;
  employmentAddress?: string | null;
  employmentCompany?: string | null;
  /** Protected id (opaque token). */
  employmentEntityAddressId?: string | null;
  fatherName?: string | null;
  financialDuties?: number | null;
  firstName?: string | null;
  fiscalActivityTypeContextId?: number | null;
  fiscalValidationCode?: string | null;
  genderId?: number | null;
  groupActivityTypeNodeId?: number | null;
  groupFiscalActivityTypeNodeId?: number | null;
  handicappedDegree?: number | null;
  hasCreditCard?: boolean | null;
  hasDualNationality?: boolean | null;
  hasPoliticalExposure?: boolean | null;
  hasPublicOfficePosition?: boolean | null;
  hasRealEstate?: boolean | null;
  hasTaxBenefits?: boolean | null;
  householdIncome?: number | null;
  incomeTypeId?: number | null;
  intervActivityTypeContextId?: number | null;
  isHandicapped?: boolean | null;
  isListedCompany?: boolean | null;
  isSalaryValidityProlonged?: boolean | null;
  isVATPayer?: boolean | null;
  labourAggreementBeginDate?: string | null;
  labourAggreementEndDate?: string | null;
  labourAgreementTypeId?: number | null;
  labourSeniority?: number | null;
  lastName?: string | null;
  lastProfessionId?: number | null;
  leafActivityTypeNodeId?: number | null;
  leafFiscalActivityTypeNodeId?: number | null;
  livingTogether?: boolean | null;
  maritalAgreementId?: number | null;
  maritalStatusId?: number | null;
  motherName?: string | null;
  namePrefixId?: number | null;
  nameSuffixId?: number | null;
  /** Protected id (opaque token). */
  newEmploymentEntityAddressId?: string | null;
  numOfDependents?: number | null;
  numOfHouseholdStatements?: number | null;
  numOfPersonsInResidence?: number | null;
  otherAssets?: string | null;
  otherCredits?: number | null;
  otherDuties?: number | null;
  otherIncomes?: number | null;
  /** Protected id (opaque token). */
  ownerId?: string | null;
  pepReference?: string | null;
  pepSourcesInitialAgreement?: boolean | null;
  pepStateDate?: string | null;
  parishCode?: string | null;
  pension?: number | null;
  professionDescr?: string | null;
  professionId?: number | null;
  publicPlacementId?: number | null;
  qualificationTypeId?: number | null;
  rentalIncome?: number | null;
  residenceDebt?: number | null;
  residenceDuties?: number | null;
  residenceMarketValue?: number | null;
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
};
export type EntityCompanyDto = {
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
  complexityLevelId?: number | null;
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
  isVATPayer?: boolean | null;
  leafActivityTypeId?: number | null;
  /** Protected id (opaque token). */
  ownerId?: string | null;
  publicContractObligation?: boolean | null;
  publicSectorClassId?: number | null;
  publicSectorId?: number | null;
  registryDescription?: string | null;
  /** Protected id (opaque token). */
  registryEntityId?: string | null;
  registryNumber?: string | null;
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
export type LegalDocDto = {
  countryId?: string | null;
  documentName?: string | null;
  /** Protected id (opaque token). */
  id?: string | null;
  initialValidDate?: string | null;
  isMain?: boolean | null;
  isReadOnly?: boolean | null;
  issueDate?: string | null;
  issuedBy?: string | null;
  /** Protected id (opaque token). */
  issuerEntityId?: string | null;
  legalDocControl?: string | null;
  legalDocNumber?: string | null;
  legalDocStateId?: number | null;
  legalDocTypeId?: number | null;
  numSeries?: string | null;
  /** Protected id (opaque token). */
  ownerId?: string | null;
  validDate?: string | null;
};
export type CredOperIntervEntityDto = {
  vatNumber?: string | null;
  kind?: IntervEntityKind;
  name?: string | null;
  juridicalTypeId?: number | null;
  person?: PersonDto;
  company?: EntityCompanyDto;
  phone?: PhoneDto;
  email?: EmailDto;
  fiscalAddress?: AddressDto;
  postalAddress?: AddressDto;
  legalDocs?: LegalDocDto[] | null;
  availablePhones?: PhoneDto[] | null;
  availableEmails?: EmailDto[] | null;
  availableAddresses?: AddressDto[] | null;
};
export type CredOperIntervDto = {
  role?: CredOperIntervRole;
  entity?: CredOperIntervEntityDto;
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
export type FinRewardDto = {
  /** Protected id (opaque token). */
  aggregatorFinRewardId?: string | null;
  amount?: number | null;
  aplBusinessId?: number | null;
  aplBusinessPurposeTypeId?: number | null;
  aplCompanyId?: number | null;
  aplTableId?: number | null;
  autUserStateId?: number | null;
  baseAmount?: number | null;
  /** Protected id (opaque token). */
  basePaymentRetentionFinRewardId?: string | null;
  beginDate?: string | null;
  calculationPeriodId?: number | null;
  coefficient?: number | null;
  companyMarginAmount?: number | null;
  companyMarginTaxAmount?: number | null;
  companyMarginThreshold?: number | null;
  companyMarginThresholdInputModeId?: number | null;
  companyMarginThresholdPercentage?: number | null;
  currencyId?: string | null;
  discountId?: number | null;
  endDate?: string | null;
  /** Protected id (opaque token). */
  entityId?: string | null;
  entityPercentage?: number | null;
  excludeFromAggreement?: boolean | null;
  externalReference?: string | null;
  finRewardTypeId?: number | null;
  financedAmount?: number | null;
  fixedComponent?: number | null;
  flowItem?: number | null;
  grossAmount?: number | null;
  /** Protected id (opaque token). */
  id?: string | null;
  isAmountCalculated?: boolean | null;
  isCalcByRateDefinition?: boolean | null;
  isInformative?: boolean | null;
  isInvoiced?: boolean | null;
  isOkToInvoice?: boolean | null;
  isPointsUserDefined?: boolean | null;
  isReinforcement?: boolean | null;
  isReversal?: boolean | null;
  issueDate?: string | null;
  maximumAmount?: number | null;
  maximumAmountFinRewardTypeId?: number | null;
  maximumInputId?: number | null;
  maximumPercentage?: number | null;
  movDate?: string | null;
  /** Protected id (opaque token). */
  ownerId?: string | null;
  paymentModeId?: number | null;
  percentage?: number | null;
  points?: number | null;
  productGeneratedId?: number | null;
  rpDocItemGroupId?: number | null;
  /** Protected id (opaque token). */
  rpDocumentId?: string | null;
  rappelAggreementId?: number | null;
  /** Protected id (opaque token). */
  relatedFinRewardId?: string | null;
  /** Protected id (opaque token). */
  relatedId?: string | null;
  retentionTaxAmount?: number | null;
  retentionTaxTypeId?: number | null;
  rewardEntityOriginId?: number | null;
  stateDate?: string | null;
  subAplTableId?: number | null;
  /** Protected id (opaque token). */
  subRelatedId?: string | null;
  taxExemptionReasonId?: number | null;
  totalAmountIncludingRetention?: number | null;
  totalGrossAmount?: number | null;
  valueDate?: string | null;
  variableComponent?: number | null;
  variablePercentage?: number | null;
  vatTaxAmount?: number | null;
  vatTaxTypeId?: number | null;
};
export type ExpenseDto = {
  accountDate?: string | null;
  accountingMode?: number | null;
  amount?: number | null;
  annulledAccountDate?: string | null;
  aplBankAccountId?: number | null;
  aplTableId?: number | null;
  bankId?: number | null;
  /** Protected id (opaque token). */
  businessPartnerStructNodeId?: string | null;
  companyCurrencyAmount?: number | null;
  companyCurrencyId?: string | null;
  companyExpenseBaseAmount?: number | null;
  companyForexRateValue?: number | null;
  companyTaxAmount?: number | null;
  currencyId?: string | null;
  deferredAccountDate?: string | null;
  descr?: string | null;
  /** Protected id (opaque token). */
  entityId?: string | null;
  expenseBaseAmount?: number | null;
  expenseTypeId?: number | null;
  externalReference?: string | null;
  financedAmount?: number | null;
  /** Protected id (opaque token). */
  frameContractCompanyRPDocumentId?: string | null;
  /** Protected id (opaque token). */
  frameContractEquipmentRPDocumentId?: string | null;
  grossAmount?: number | null;
  /** Protected id (opaque token). */
  id?: string | null;
  invoiceCurrencyId?: string | null;
  isAmountCalculated?: boolean | null;
  isAnnulled?: boolean | null;
  isDeferredAccounted?: boolean | null;
  isInvoiced?: boolean | null;
  isManualAssign?: boolean | null;
  isRejected?: boolean | null;
  isTaxExpense?: boolean | null;
  isTemplate?: boolean | null;
  isToInvoice?: boolean | null;
  /** Protected id (opaque token). */
  lastOperationAplUserId?: string | null;
  lastOperationDate?: string | null;
  maxAmount?: number | null;
  /** Protected id (opaque token). */
  ownerId?: string | null;
  paymentData?: string | null;
  paymentModeId?: number | null;
  /** Protected id (opaque token). */
  paymentRPDocumentId?: string | null;
  percentage?: number | null;
  productGeneratedId?: number | null;
  quantity?: number | null;
  /** Protected id (opaque token). */
  rpDocumentId?: string | null;
  rpScopeId?: number | null;
  /** Protected id (opaque token). */
  relatedId?: string | null;
  sourceId?: number | null;
  subCredOperItem?: number | null;
  taxAmount?: number | null;
  taxExemptionReasonId?: number | null;
  taxTypeId?: number | null;
  valueDate?: string | null;
  wasModifiedByUser?: boolean | null;
  wasTaxInvoiced?: boolean | null;
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
  correlationId?: string | null;
  rowVersion?: string | null;
  /** Protected id (opaque token). */
  sourceCredOperId?: string | null;
  entryMoment?: string | null;
  entryDate?: string | null;
  autUserStateId?: number | null;
  stateDate?: string | null;
  credOperStep?: CreditOperationStep;
  /** Protected id (opaque token). */
  creditIntermediaryStructNodeId?: string | null;
  /** Protected id (opaque token). */
  importerStructNodeId?: string | null;
  /** Protected id (opaque token). */
  branchStructNodeId?: string | null;
  credOperClassificationId?: number | null;
  entityName?: string | null;
  descr?: string | null;
  conditions?: FinConditionsDto[] | null;
  assets?: CredOperAssetDto[] | null;
  interventions?: CredOperIntervDto[] | null;
  insurances?: InsurancePolicyDto[] | null;
  commissions?: FinRewardDto[] | null;
  subventions?: FinRewardDto[] | null;
  otherExpenses?: ExpenseDto[] | null;
  taxExpenses?: ExpenseDto[] | null;
  emails?: EmailDto[] | null;
  phones?: PhoneDto[] | null;
  legalDocs?: LegalDocDto[] | null;
};
export type NewInterventionKind = "Customer" | "SecondHolder" | "Guarantor";
export type CalculationMessageDto = {
  severity?: string | null;
  text?: string | null;
};
export type CredOperCalculationResultDto = {
  isCalculated?: boolean;
  credOper?: CredOperDto;
  messages?: CalculationMessageDto[] | null;
};
export type CredOperSaveResultDto = {
  isSaved?: boolean;
  /** Protected id (opaque token). */
  id?: string | null;
  credOper?: CredOperDto;
  calculationMessages?: CalculationMessageDto[] | null;
  saveMessages?: CalculationMessageDto[] | null;
};
export type QuotationSummaryDto = {
  /** Protected id (opaque token). */
  id?: string;
  number?: number | null;
  aplCompanyId?: number | null;
  aplBusinessId?: number | null;
  credOperTypeId?: number | null;
  financialProductId?: number | null;
  amount?: number | null;
  currencyId?: string | null;
  beginDate?: string | null;
  stateId?: number | null;
  stateDate?: string | null;
  /** Protected id (opaque token). */
  customerEntityId?: string | null;
  customerName?: string | null;
};
export type QuotationToProposalDto = {
  proposal?: CredOperDto;
  quotation?: QuotationSummaryDto;
};
export type EntityOptionDto = {
  id?: number;
  abbreviation?: string | null;
  description?: string | null;
};
export type PagedResultOfEntityOptionDto = {
  items?: EntityOptionDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
};
export type PhoneTypeKind = "Landline" | "Mobile";
export type PhoneTypeDto = {
  kind?: PhoneTypeKind;
  phoneTypeId?: number;
};
export type ActivityTypeDto = {
  id?: number;
  abbreviation?: string | null;
  description?: string | null;
  contextId?: number | null;
};
export type PagedResultOfActivityTypeDto = {
  items?: ActivityTypeDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
};
export type JuridicalTypeDto = {
  id?: number;
  abbreviation?: string | null;
  description?: string | null;
  countryId?: string | null;
  hasActivity?: boolean;
  activityTypeContextId?: number | null;
};
export type PagedResultOfJuridicalTypeDto = {
  items?: JuridicalTypeDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
};
export type EntityPreloadDto = {
  /** Protected id (opaque token). */
  id?: string;
  entityTypeId?: number | null;
  name?: string | null;
  person?: PersonDto;
  company?: EntityCompanyDto;
  phones?: PhoneDto[] | null;
  emails?: EmailDto[] | null;
  addresses?: AddressDto[] | null;
};
export type EntityLookupResultDto = {
  exists?: boolean;
  mobilePhone?: string | null;
  email?: string | null;
  kind?: IntervEntityKind;
  kindMatches?: boolean;
  preload?: EntityPreloadDto;
};
export type EntityLookupRequestDto = {
  vatNumber?: string | null;
  kind?: IntervEntityKind;
};
export type OtpSentDto = {
  expiresAt?: string;
  sentTo?: string | null;
};
export type OtpChannel = "Sms" | "Email";
export type OtpSendRequestDto = {
  vatNumber?: string | null;
  channel?: OtpChannel;
  kind?: IntervEntityKind;
};
export type OtpVerifyRequestDto = {
  vatNumber?: string | null;
  code?: string | null;
  kind?: IntervEntityKind;
};
export type RetakeCalculation = "Amount" | "Percentage";
export type EquipmentRetakeRequestDto = {
  calculate?: RetakeCalculation;
  asset?: CredOperAssetDto;
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
export type FactoringKind = "Factoring" | "Confirming";
export type FactoringContractDto = {
  /** Protected id (opaque token). */
  id?: string;
  number?: number | null;
  kind?: FactoringKind;
  financialInstitution?: string | null;
  currencyId?: string | null;
  withoutRecourse?: boolean;
  availableAmount?: number | null;
  totalAmount?: number | null;
  withoutRecourseAvailableAmount?: number | null;
  withoutRecourseTotalAmount?: number | null;
  advancePercentage?: number | null;
  maxTermDays?: number | null;
  rate?: number | null;
  canSubmit?: boolean;
  canAdvance?: boolean;
  hasAdvanceInProgress?: boolean;
};
export type PagedResultOfFactoringContractDto = {
  items?: FactoringContractDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
};
export type FactoringCounterpartyKind = "Debtor" | "Supplier";
export type FactoringCounterpartyState = "Active" | "Pending" | "Ended";
export type FactoringCounterpartyDto = {
  /** Protected id (opaque token). */
  interventionId?: string;
  /** Protected id (opaque token). */
  entityId?: string | null;
  name?: string | null;
  taxNumber?: string | null;
  externalNumber?: string | null;
  kind?: FactoringCounterpartyKind;
  availableAmount?: number | null;
  totalAmount?: number | null;
  withoutRecourseAvailableAmount?: number | null;
  withoutRecourseTotalAmount?: number | null;
  state?: FactoringCounterpartyState;
};
export type FactoringCounterpartyResultDto = {
  isAdded?: boolean;
  isUncertain?: boolean;
  counterparty?: FactoringCounterpartyDto;
  messages?: CalculationMessageDto[] | null;
};
export type NewFactoringCounterpartyDto = {
  taxNumber?: string | null;
};
export type FactoringCessionResultDto = {
  isSubmitted?: boolean;
  isUncertain?: boolean;
  /** Protected id (opaque token). */
  cessionId?: string | null;
  cessionNumber?: number | null;
  messages?: CalculationMessageDto[] | null;
};
export type NewFactoringDocumentDto = {
  /** Protected id (opaque token). */
  debtorInterventionId?: string | null;
  invoiceNumber?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  amount?: number | null;
};
export type NewFactoringCessionDto = {
  correlationId: string;
  /** Protected id (opaque token). */
  supplierInterventionId?: string | null;
  documents?: NewFactoringDocumentDto[] | null;
};
export type FactoringAdvanceSummaryLineDto = {
  /** Protected id (opaque token). */
  documentId?: string;
  invoiceNumber?: string | null;
  advanceAmount?: number | null;
  netAmount?: number | null;
  maxAmount?: number | null;
};
export type FactoringAdvanceSummaryDto = {
  netAmount?: number | null;
  interestAmount?: number | null;
  commissionAmount?: number | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  isucAmount?: number | null;
  regularizationAmount?: number | null;
  netCost?: number | null;
  documents?: FactoringAdvanceSummaryLineDto[] | null;
  messages?: CalculationMessageDto[] | null;
  maxAmount?: number | null;
  availableAmount?: number | null;
  plafondAvailableAmount?: number | null;
  costsAvailable?: boolean;
};
export type FactoringAdvanceSummaryRequestDto = {
  /** Protected ids (opaque tokens). */
  documentIds?: string[];
  amount?: number | null;
  valueDate?: string | null;
};
export type FactoringAdvanceResultDto = {
  isStarted?: boolean;
  isUncertain?: boolean;
  /** Protected id (opaque token). */
  advanceId?: string | null;
  /** Protected id (opaque token). */
  batchId?: string | null;
  messages?: CalculationMessageDto[] | null;
};
export type NewFactoringAdvanceDto = {
  correlationId: string;
  amount?: number | null;
  valueDate?: string | null;
  /** Protected ids (opaque tokens). */
  documentIds?: string[];
};
export type FactoringAdvanceDto = {
  /** Protected id (opaque token). */
  id?: string;
  number?: number;
  /** Protected id (opaque token). */
  contractId?: string;
  valueDate?: string;
  amount?: number | null;
  status?: string | null;
  stateName?: string | null;
};
export type PagedResultOfFactoringAdvanceDto = {
  items?: FactoringAdvanceDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
};
export type FactoringAdvanceBatchResult =
  "Running" | "Succeeded" | "Failed" | "Unknown";
export type FactoringAdvanceBatchDto = {
  /** Protected id (opaque token). */
  id?: string;
  status?: string | null;
  isFinished?: boolean;
  isSuccessful?: boolean;
  /** Protected id (opaque token). */
  advanceId?: string | null;
  advanceStatus?: string | null;
  messages?: CalculationMessageDto[] | null;
  result?: FactoringAdvanceBatchResult;
  /** Protected ids (opaque tokens). */
  advanceIds?: string[];
};
export type FactoringDocumentStatus =
  | "Submitted"
  | "Approved"
  | "Financed"
  | "Paid"
  | "Overdue"
  | "Attention"
  | "Closed";
export type FactoringDocumentDto = {
  /** Protected id (opaque token). */
  id?: string;
  invoiceNumber?: string | null;
  /** Protected id (opaque token). */
  cessionId?: string | null;
  cessionNumber?: number | null;
  counterparty?: string | null;
  taxNumber?: string | null;
  /** Protected id (opaque token). */
  contractId?: string;
  contractNumber?: number | null;
  kind?: FactoringKind;
  financialInstitution?: string | null;
  currencyId?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  amount?: number | null;
  amountNotPaid?: number | null;
  advancedAmount?: number | null;
  status?: FactoringDocumentStatus;
  stateName?: string | null;
};
export type FactoringOutstandingDto = {
  currencyId?: string | null;
  amount?: number;
};
export type FactoringDocumentPageDto = {
  items?: FactoringDocumentDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  outstandingAmounts?: FactoringOutstandingDto[] | null;
};
export type FactoringCessionStatus =
  "Unknown" | "Open" | "Submitted" | "Active" | "Cancelled" | "InProgress";
export type FactoringCessionDto = {
  /** Protected id (opaque token). */
  id?: string;
  number?: number;
  /** Protected id (opaque token). */
  contractId?: string;
  valueDate?: string;
  balance?: number;
  status?: FactoringCessionStatus;
  stateName?: string | null;
};
export type PagedResultOfFactoringCessionDto = {
  items?: FactoringCessionDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
};
export type FactoringCessionDetailDto = {
  /** Protected id (opaque token). */
  id?: string;
  number?: number;
  /** Protected id (opaque token). */
  contractId?: string;
  valueDate?: string;
  balance?: number;
  status?: FactoringCessionStatus;
  stateName?: string | null;
  documents?: FactoringDocumentDto[] | null;
};
export type FinancialProductDto = {
  id?: number;
  code?: string | null;
  description?: string | null;
};
export type HealthStatus = "Healthy" | "Degraded";
export type ReferenceDataHealthDto = {
  name?: string | null;
  isLoaded?: boolean;
  lastLoadedAt?: string | null;
  lastFailedAt?: string | null;
  nextAttemptAt?: string | null;
};
export type HealthDto = {
  status?: HealthStatus;
  startedAt?: string;
  version?: string | null;
  referenceData?: ReferenceDataHealthDto[] | null;
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
export type PagedResultOfNewsDto = {
  items?: NewsDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
};
export type BusinessSettingsDto = {
  businessId?: number;
  classifications?: number[] | null;
  assetTypes?: (number | null)[] | null;
  [key: string]: any;
};
export type CompanyConfigurationDto = {
  companyId?: number;
  businesses?: number[] | null;
  proposalBusinesses?: number[] | null;
  equipmentCategories?: number[] | null;
  equipmentTypes?: number[] | null;
  businessSettings?: BusinessSettingsDto[] | null;
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
export type StockSupplierDto = {
  /** Protected id (opaque token). */
  interventionId?: string;
  /** Protected id (opaque token). */
  entityId?: string | null;
  name?: string | null;
};
export type StockRatePhaseDto = {
  rate?: number | null;
  fromDate?: string | null;
};
export type StockContractDto = {
  /** Protected id (opaque token). */
  id?: string;
  number?: number | null;
  description?: string | null;
  companyId?: number | null;
  companyAbbreviation?: string | null;
  currencyId?: string | null;
  suppliers?: StockSupplierDto[] | null;
  availableAmount?: number;
  totalAmount?: number;
  maxPerVehicle?: number;
  termDays?: number | null;
  ratePhases?: StockRatePhaseDto[] | null;
  equipmentStateIds?: number[] | null;
  equipmentTypeIds?: number[] | null;
  canAddStock?: boolean;
};
export type PagedResultOfStockContractDto = {
  items?: StockContractDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
};
export type StockUnitDto = {
  /** Protected id (opaque token). */
  id?: string;
  item?: number | null;
  autUserStateId?: number | null;
  amount?: number | null;
  beginDate?: string | null;
  dueDate?: string | null;
  endDate?: string | null;
};
export type StockUnitSaveResultDto = {
  isSaved?: boolean;
  stock?: StockUnitDto;
  messages?: CalculationMessageDto[] | null;
};
export type NewStockUnitDto = {
  correlationId?: string | null;
  /** Protected id (opaque token). */
  supplierInterventionId?: string | null;
  amount?: number | null;
  equipment?: EquipmentDto;
  km?: number | null;
  invoiceNumber?: string | null;
};
export type StockCashFlowLineDto = {
  number?: number | null;
  valueDate?: string | null;
  invoiceDate?: string | null;
  capital?: number | null;
  interest?: number | null;
  taxAmount?: number | null;
  amount?: number | null;
  outstandingCapital?: number | null;
};
export type StockCashFlowOtherLineDto = {
  valueDate?: string | null;
  expenseAmount?: number | null;
  taxAmount?: number | null;
  amountWithTaxes?: number | null;
};
export type StockCashFlowDto = {
  currencyId?: string | null;
  initialDate?: string | null;
  finalDate?: string | null;
  rate?: number | null;
  capital?: number | null;
  plafondAmount?: number | null;
  totalCapital?: number | null;
  totalInterest?: number | null;
  totalExpenses?: number | null;
  totalTaxes?: number | null;
  totalWithoutTaxes?: number | null;
  totalWithTaxes?: number | null;
  flows?: StockCashFlowLineDto[] | null;
  otherFlows?: StockCashFlowOtherLineDto[] | null;
};
export type StockNettingAccountDto = {
  /** Protected id (opaque token). */
  id?: string;
  number?: number | null;
  relation?: string | null;
  currencyId?: string | null;
  plafondAmount?: number | null;
  totalCapital?: number | null;
  totalInterest?: number | null;
  totalWithTaxes?: number | null;
};
export type StockPaymentEndReasonDto = {
  id?: number;
  name?: string | null;
};
export type StockPaymentResultDto = {
  isStarted?: boolean;
  isUncertain?: boolean;
  /** Protected id (opaque token). */
  paymentId?: string | null;
  messages?: CalculationMessageDto[] | null;
};
export type NewStockPaymentDto = {
  correlationId?: string | null;
  /** Protected id (opaque token). */
  nettingAccountId?: string | null;
  /** Protected ids (opaque tokens). */
  stockIds?: string[];
  amount?: number | null;
  endReasonId?: number | null;
  valueDate?: string | null;
  allowPartialPayment?: boolean;
};
export type StockPaymentStatusDto = {
  /** Protected id (opaque token). */
  id?: string;
  status?: string | null;
  isFinished?: boolean;
  isSuccessful?: boolean;
  stocksPaid?: number | null;
  stocksInError?: number | null;
  messages?: CalculationMessageDto[] | null;
};
export type StockUnitListItemDto = {
  /** Protected id (opaque token). */
  id?: string;
  /** Protected id (opaque token). */
  contractId?: string | null;
  contractNumber?: number | null;
  item?: number | null;
  autUserStateId?: number | null;
  state?: string | null;
  amount?: number | null;
  currencyId?: string | null;
  beginDate?: string | null;
  dueDate?: string | null;
  endDate?: string | null;
  supplierName?: string | null;
  vin?: string | null;
  licencePlate?: string | null;
  brand?: string | null;
  model?: string | null;
  invoiceNumber?: string | null;
};
export type PagedResultOfStockUnitListItemDto = {
  items?: StockUnitListItemDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
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
export type PagedResultOfStructNodeDto = {
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
export type WorkItemPriorityKind = "Critical" | "High" | "Medium" | "Low";
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
export type PagedResultOfWorkItemDto = {
  items?: WorkItemDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
};
export type AplWorkItemInternalState =
  "Initial" | "Active" | "Resolved" | "Closed" | "Canceled";
export type AplWorkItemSortingType =
  | "Worklist"
  | "Agenda"
  | "Creation"
  | "TypePriorityBegin"
  | "PriorityCreationDate";
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
  useGetApiCatalogApplicationsQuery,
  useGetApiCatalogCompaniesQuery,
  useGetApiCatalogCompaniesByIdBusinessesQuery,
  useGetApiCatalogEquipmentQuery,
  useGetApiCatalogEquipmentCategoryTypesQuery,
  useGetApiCatalogClassificationsQuery,
  useGetApiCatalogAssetTypesQuery,
  useGetApiCatalogNewsTypesQuery,
  useGetApiCatalogEmailTypesQuery,
  useGetApiCompaniesQuery,
  useGetApiCompaniesByIdBusinessesQuery,
  useGetApiCompaniesCountriesQuery,
  useGetApiCreditOperationsClassificationsQuery,
  useGetApiCreditOperationsBusinessesQuery,
  useGetApiCreditOperationsAssetTypesQuery,
  useGetApiCreditOperationsSearchQuery,
  useGetApiCreditOperationsNewCredoperQuery,
  useGetApiCreditOperationsNewInterventionQuery,
  useGetApiCreditOperationsNewInsuranceQuery,
  usePostApiCreditOperationsCalculateCredoperMutation,
  usePostApiCreditOperationsSaveCredoperMutation,
  useGetApiCreditOperationsCredoperByIdQuery,
  useGetApiCreditOperationsCredoperByIdQuotationToProposalQuery,
  useGetApiEntitiesGendersQuery,
  useGetApiEntitiesMaritalStatusesQuery,
  useGetApiEntitiesProfessionsQuery,
  useGetApiEntitiesLegalDocTypesQuery,
  useGetApiEntitiesPhoneTypesQuery,
  useGetApiEntitiesActivityTypesQuery,
  useGetApiEntitiesJuridicalTypesQuery,
  usePostApiEntitiesLookupMutation,
  usePostApiEntitiesOtpMutation,
  usePostApiEntitiesOtpVerifyMutation,
  useGetApiEquipmentsNewQuery,
  usePostApiEquipmentsRetakeMutation,
  useGetApiEquipmentsCategoriesQuery,
  useGetApiEquipmentsTypesQuery,
  useGetApiEquipmentsBrandsQuery,
  useGetApiEquipmentsModelsQuery,
  useGetApiEquipmentsVersionsQuery,
  useGetApiEquipmentsStatesQuery,
  useGetApiFactoringContractsQuery,
  useGetApiFactoringContractsByIdCounterpartiesQuery,
  usePostApiFactoringContractsByIdCounterpartiesMutation,
  usePostApiFactoringContractsByIdCessionsMutation,
  usePostApiFactoringContractsByIdAdvancesSummaryMutation,
  usePostApiFactoringContractsByIdAdvancesMutation,
  useGetApiFactoringAdvancesQuery,
  useGetApiFactoringAdvancesBatchesByIdQuery,
  useGetApiFactoringDocumentsQuery,
  useGetApiFactoringCessionsQuery,
  useGetApiFactoringCessionsByIdQuery,
  useGetApiFinancialProductsQuery,
  usePostApiFinancialProductsDefaultsMutation,
  useGetApiHealthLiveQuery,
  useGetApiHealthQuery,
  useGetApiNewsTypesQuery,
  useGetApiNewsQuery,
  useGetApiNewsSearchQuery,
  useGetApiNewsByIdImageQuery,
  useGetApiParametrizationScreenCustomizationsQuery,
  usePostApiParametrizationScreenCustomizationsMutation,
  useGetApiStockContractsQuery,
  usePostApiStockContractsByIdUnitsMutation,
  useGetApiStockContractsByIdCashFlowQuery,
  useGetApiStockContractsByIdNettingAccountsQuery,
  useGetApiStockContractsByIdPaymentEndReasonsQuery,
  usePostApiStockPaymentsMutation,
  useGetApiStockPaymentsByIdQuery,
  useGetApiStockUnitsQuery,
  useGetApiStockUnitsByIdQuery,
  useGetApiStockUnitsByIdCashFlowQuery,
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
