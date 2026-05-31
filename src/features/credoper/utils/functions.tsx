import type {
  CredOperDto,
  CredOperIntervDto,
  EntityEmailDto,
  EntityLegalDocDto,
  EntityPhoneDto,
  EquipmentDto,
  FinConditionDto,
} from "../../../services/api/generated/MontraPOSApi";
import { patchCredoper } from "../credoperSlice";
import type { AppDispatch } from "../../../app/store";

export const setCredOperField = <K extends keyof CredOperDto>(
  dispatch: AppDispatch,
  name: K,
  value: CredOperDto[K],
) => {
  dispatch(
    patchCredoper({
      [name]: value,
    } as Partial<CredOperDto>),
  );
};

export const setEquipmentField = <K extends keyof EquipmentDto>(
  dispatch: AppDispatch,
  credoper: CredOperDto | null | undefined,
  assetIndex: number,
  name: K,
  value: EquipmentDto[K],
) => {
  const updatedAssets =
    credoper?.assets?.map((asset, index) =>
      index === assetIndex
        ? {
            ...asset,
            equipment: {
              ...(asset.equipment ?? {}),
              [name]: value,
            },
          }
        : asset,
    ) ?? [];

  dispatch(
    patchCredoper({
      assets: updatedAssets,
    }),
  );
};

export const setInterventionDetailField = <
  T extends keyof CredOperIntervDto,
  K extends keyof NonNullable<CredOperIntervDto[T]>,
>(
  dispatch: AppDispatch,
  credoper: CredOperDto | null | undefined,
  interventionIndex: number,
  detailName: T,
  fieldName: K,
  value: NonNullable<CredOperIntervDto[T]>[K],
) => {
  const updatedInterventions =
    credoper?.interventions?.map((intervention, index) =>
      index === interventionIndex
        ? {
            ...intervention,
            [detailName]: {
              ...((intervention[detailName] as
                | Record<string, unknown>
                | null
                | undefined) ?? {}),
              [fieldName]: value,
            },
          }
        : intervention,
    ) ?? [];

  dispatch(
    patchCredoper({
      interventions: updatedInterventions,
    }),
  );
};

export const setFinConditionsField = <K extends keyof FinConditionDto>(
  dispatch: AppDispatch,
  credoper: CredOperDto | null | undefined,
  conditionIndex: number,
  name: K,
  value: FinConditionDto[K],
) => {
  const updateConditions =
    credoper?.conditions?.map((condition, index) =>
      index === conditionIndex
        ? {
            ...condition,
            [name]: value,
          }
        : condition,
    ) ?? [];

  dispatch(
    patchCredoper({
      conditions: updateConditions,
    }),
  );
};

export const setMobilePhoneField = <K extends keyof EntityPhoneDto>(
  dispatch: AppDispatch,
  credoper: CredOperDto | null | undefined,
  name: K,
  value: EntityPhoneDto[K],
) => {
  dispatch(
    patchCredoper({
      customerPhone: {
        ...credoper?.customerPhone,
        [name]: value,
      },
    } as Partial<CredOperDto>),
  );
};

export const setLandLinePhoneField = <K extends keyof EntityPhoneDto>(
  dispatch: AppDispatch,
  credoper: CredOperDto | null | undefined,
  name: K,
  value: EntityPhoneDto[K],
) => {
  dispatch(
    patchCredoper({
      customerLandLine: {
        ...credoper?.customerLandLine,
        [name]: value,
      },
    } as Partial<CredOperDto>),
  );
};

export const setEmailField = <K extends keyof EntityEmailDto>(
  dispatch: AppDispatch,
  credoper: CredOperDto | null | undefined,
  name: K,
  value: EntityEmailDto[K],
) => {
  dispatch(
    patchCredoper({
      customerEmail: {
        ...credoper?.customerEmail,
        [name]: value,
      },
    } as Partial<CredOperDto>),
  );
};

export const setCustomerVATField = <K extends keyof EntityLegalDocDto>(
  dispatch: AppDispatch,
  credoper: CredOperDto | null | undefined,
  name: K,
  value: EntityLegalDocDto[K],
) => {
  dispatch(
    patchCredoper({
      customerVAT: {
        ...credoper?.customerVAT,
        [name]: value,
      },
    } as Partial<CredOperDto>),
  );
};
