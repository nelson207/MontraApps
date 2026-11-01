import { emptySplitApi as api } from "@platform/api/emptyApi";
import type { CredOperIntervDto } from "@platform/api/legacy/legacyApi";

// PLACEHOLDER (TODO backend): an entity already in the database, found by its VAT number (NIF),
// whose data is only handed over once its owner confirms a one-time code (OTP) sent to the phone
// and e-mail on file. Not in the new API yet; the demo backend answers them in development.

export type EntityLookupResponse = {
  found: boolean;
  /** Where the code would be sent (masked by the backend, e.g. "+351 9•• ••• 123"); none when not found */
  phone?: string | null;
  email?: string | null;
};

export type SendEntityOtpResponse = {
  /** False: the backend couldn't send it (no contacts, too many requests…) */
  sent: boolean;
  otpRequestId?: string | null;
  /** ISO date-time until which the code is accepted */
  validUntil?: string | null;
  message?: string | null;
};

/** The entity's data, as the draft's intervention parts (the person, company, addresses, contacts…) */
export type EntityData = Omit<CredOperIntervDto, "id" | "correlationID" | "credOperIntervType" | "metadataResponse">;

export type VerifyEntityOtpResponse = {
  /** False: the code doesn't match (or has expired) */
  valid: boolean;
  intervention?: EntityData | null;
  message?: string | null;
};

const entityLookupApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiEntitiesLookupByVat: build.mutation<EntityLookupResponse, { vat: string }>({
      query: (body) => ({ url: `/api/entities/lookup-by-vat`, method: "POST", body }),
    }),
    postApiEntitiesOtpSend: build.mutation<SendEntityOtpResponse, { vat: string }>({
      query: (body) => ({ url: `/api/entities/otp/send`, method: "POST", body }),
    }),
    postApiEntitiesOtpVerify: build.mutation<VerifyEntityOtpResponse, { otpRequestId: string; code: string }>({
      query: (body) => ({ url: `/api/entities/otp/verify`, method: "POST", body }),
    }),
  }),
  overrideExisting: false,
});

export const {
  usePostApiEntitiesLookupByVatMutation,
  usePostApiEntitiesOtpSendMutation,
  usePostApiEntitiesOtpVerifyMutation,
} = entityLookupApi;
