import { emptySplitApi } from "@platform/api/emptyApi";
import type { ChangePasswordRequest as ApiChangePasswordRequest } from "@platform/api/generated/MontraPOSApi";

// Generated API: POST /api/auth/password/change { oldPassword, newPassword }. Wrapped so the
// form keeps its own names (currentPassword).
export const CHANGE_PASSWORD_URL = "/api/auth/password/change";

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

const changePasswordApi = emptySplitApi.injectEndpoints({
  endpoints: (build) => ({
    changePassword: build.mutation<void, ChangePasswordRequest>({
      query: ({ currentPassword, newPassword }) => ({
        url: CHANGE_PASSWORD_URL,
        method: "POST",
        body: { oldPassword: currentPassword, newPassword } satisfies ApiChangePasswordRequest,
      }),
    }),
  }),
});

export const { useChangePasswordMutation } = changePasswordApi;
