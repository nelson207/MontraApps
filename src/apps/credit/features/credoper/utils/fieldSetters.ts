import type {
  CredOperDto,
  CredOperIntervDto,
  EntityEmailDto,
  EntityLegalDocDto,
  EntityPhoneDto,
  EquipmentDto,
  FinConditionDto,
} from "@platform/api/legacy/legacyApi";
import { patchCredoper } from "../credoperSlice";
import { isEmptyValue } from "../validation/fieldRules";

/** Empty → empty (e.g. a field reporting "" when it loads) is not a change. */
const unchanged = (current: unknown, next: unknown) =>
  current === next || (isEmptyValue(current) && isEmptyValue(next));
import type { AppDispatch } from "@credit/store";

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
  // Same value (e.g. a derived amount recomputed on mount) is not an edit
  if (credoper?.assets?.[assetIndex]?.equipment?.[name] === value) return;

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
  if (unchanged(credoper?.customerPhone?.[name], value)) return;
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
  if (unchanged(credoper?.customerLandLine?.[name], value)) return;
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

/** Several equipment fields in one edit (e.g. a new brand clears model and version). */
export const setEquipmentFields = (
  dispatch: AppDispatch,
  credoper: CredOperDto | null | undefined,
  assetIndex: number,
  changes: Partial<EquipmentDto>,
) => {
  const current = credoper?.assets?.[assetIndex]?.equipment ?? {};
  const changed = (Object.keys(changes) as (keyof EquipmentDto)[]).some((key) => current[key] !== changes[key]);
  if (!changed) return;

  const updatedAssets =
    credoper?.assets?.map((asset, index) =>
      index === assetIndex ? { ...asset, equipment: { ...(asset.equipment ?? {}), ...changes } } : asset,
    ) ?? [];
  dispatch(patchCredoper({ assets: updatedAssets }));
};
