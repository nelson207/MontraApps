import { MontraPOSApi } from "@platform/api/generated/MontraPOSApi";

// The generated work-items endpoints, tuned for lists that change often: items move between
// people, so a list isn't kept long once nobody shows it, and it reloads when the window
// regains focus (refetchOnFocus on the hooks; listeners set up in createMontraStore).
// Positions are cached by the API (10 minutes): loaded once each time a list opens.

const LIST_CACHE_SECONDS = 15;

const workItemsApi = MontraPOSApi.enhanceEndpoints({
  endpoints: {
    getApiWorkItemsDashboard: { keepUnusedDataFor: LIST_CACHE_SECONDS },
    getApiWorkItemsSearch: { keepUnusedDataFor: LIST_CACHE_SECONDS },
  },
});

export const {
  useGetApiWorkItemsPositionsQuery: useWorkItemPositionsQuery,
  useGetApiWorkItemsDashboardQuery: useWorkItemsDashboardQuery,
  useGetApiWorkItemsSearchQuery: useWorkItemsSearchQuery,
} = workItemsApi;
