import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const emptySplitApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://localhost:7290",
    // prepareHeaders: (headers, { getState }) => {
    //   const token = (getState() as any).auth?.token;
    //   if (token) headers.set("authorization", `Bearer ${token}`);
    //   return headers;
    // },
    // credentials: "include",
  }),
  refetchOnMountOrArgChange: true,
  endpoints: () => ({}),
});
