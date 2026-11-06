import type {
  CredOperDto,
  CredOperIntervDto,
  EntityEmailDto,
  EntityLegalDocDto,
  EntityPhoneDto,
  EquipmentDto,
  FinConditionDto,
} from "@platform/api/legacy/legacyApi";
import type { PhoneValue } from "@platform/features/phone/phoneModel";
import { patchCredoper } from "../credoperSlice";
import { withAssetAmount, withRetakeAmount, withRetakeInLine, withRetakePercentage } from "../model/business";
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

/** Several parts of a person in one edit */
export const updateIntervention = (
  dispatch: AppDispatch,
  credoper: CredOperDto | null | undefined,
  interventionIndex: number,
  change: (intervention: CredOperIntervDto) => CredOperIntervDto,
) => {
  dispatch(
    patchCredoper({
      interventions: credoper?.interventions?.map((intervention, index) => (index === interventionIndex ? change(intervention) : intervention)) ?? [],
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

/** A phone typed: an empty number reported for an empty phone is not an edit */
const phoneUnchanged = (current: EntityPhoneDto | null | undefined, { phoneNumber, countryId }: PhoneValue) =>
  unchanged(current?.phoneNumber, phoneNumber) && (isEmptyValue(phoneNumber) || current?.countryId === countryId);

export const setMobilePhone = (dispatch: AppDispatch, credoper: CredOperDto | null | undefined, phone: PhoneValue) => {
  if (phoneUnchanged(credoper?.customerPhone, phone)) return;
  dispatch(patchCredoper({ customerPhone: { ...credoper?.customerPhone, ...phone } } as Partial<CredOperDto>));
};

export const setLandLinePhone = (dispatch: AppDispatch, credoper: CredOperDto | null | undefined, phone: PhoneValue) => {
  if (phoneUnchanged(credoper?.customerLandLine, phone)) return;
  dispatch(patchCredoper({ customerLandLine: { ...credoper?.customerLandLine, ...phone } } as Partial<CredOperDto>));
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

/** The amount typed for an asset, with the amounts it fills (withAssetAmount) and the initial entry it is the base of. */
export const setAssetAmount = (
  dispatch: AppDispatch,
  credoper: CredOperDto | null | undefined,
  assetIndex: number,
  amount: number | null | undefined,
) => {
  if (!credoper || credoper.assets?.[assetIndex]?.equipment?.netAmount === amount) return;
  const { assets } = withRetakeInLine({ ...credoper, assets: withAssetAmount(credoper, assetIndex, amount) });
  dispatch(patchCredoper({ assets }));
};

/** The initial entry typed as an amount (sent) or a percentage (a helper): each sets the other. */
export const setRetake = (
  dispatch: AppDispatch,
  credoper: CredOperDto | null | undefined,
  typed: { amount: number | null } | { percentage: number | null },
) => {
  if (!credoper) return;
  const { assets } = "amount" in typed ? withRetakeAmount(credoper, typed.amount) : withRetakePercentage(credoper, typed.percentage);
  dispatch(patchCredoper({ assets }));
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
  // A vehicle's amount is (part of) the initial entry's base
  const assets =
    "netAmount" in changes && credoper ? withRetakeInLine({ ...credoper, assets: updatedAssets }).assets : updatedAssets;
  dispatch(patchCredoper({ assets }));
};
