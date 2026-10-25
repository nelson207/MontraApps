import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { USERS_ACCESS } from "@app/users";
import { emptySplitApi } from "@platform/api/emptyApi";
import { shouldUseSample, unexpectedResponse } from "@platform/api/devFallback";
import type { AdminUser as AnyAdminUser, UsersAccess } from "../usersAccess";
import { sampleUsers } from "./sampleUsers";

// User administration. Viewing, creating and editing a user are MontraAPI's (generated
// MontraPOSApi.ts): GET /api/users/{id}, POST /api/users, PUT /api/users/{id} (see
// ../managedUser.ts). The API can't list users yet, so the list stays a placeholder:
// TODO: placeholder endpoint, injected by hand:
//   GET  /api/Admin/Users?search=&<filter>=&page=1&pageSize=10  → { items, total }
export const USERS_URL = "/api/Admin/Users";

/** The access fields of the app being built */
export type Access = typeof USERS_ACCESS extends UsersAccess<infer A> ? A : never;
export type AdminUser = AnyAdminUser<Access>;

export type UsersQuery = {
  search: string;
  /** Value of the app's list filter ("" = all) */
  filter: string;
  page: number;
  pageSize: number;
};

export type UsersPage = { items: AdminUser[]; total: number };

const usersApi = emptySplitApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<UsersPage, UsersQuery>({
      queryFn: async ({ filter, ...query }, _api, _extra, baseQuery) => {
        const params = { ...query, [USERS_ACCESS.filter.param]: filter };
        const result = await baseQuery({ url: USERS_URL, params });
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) return { data: await sampleUsers.list({ filter, ...query }) };
        if (error) return { error };
        const page = result.data as UsersPage;
        if (!Array.isArray(page?.items) || typeof page.total !== "number") {
          return { error: unexpectedResponse("user list") };
        }
        return { data: page };
      },
    }),
  }),
});

export const { useGetUsersQuery } = usersApi;
