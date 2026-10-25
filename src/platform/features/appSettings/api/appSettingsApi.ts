import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { emptySplitApi } from "@platform/api/emptyApi";
import { shouldUseSample } from "@platform/api/devFallback";
import type {
  MontraAplApplications,
  SaveScreenCustomizationRequest,
  ScreenCustomizationDto,
} from "@platform/api/generated/MontraPOSApi";
import { EMPTY_SETTINGS, parseSettings, toConfiguration, type AppSettings } from "../appSettingsModel";

// Screen customizations (generated API): one typed configuration per app identifier
// (ScreenCustomizationConfigurationDto; apps/<app>/appSettings.ts).
//   GET  /api/parametrization/screen-customizations?screenIdentifier=  →  { screenIdentifier, configuration }
//   POST /api/parametrization/screen-customizations  ←  { screenIdentifier, configuration }
// Wrapped here (instead of using the generated hooks directly) to read the configuration safely
// and to keep working in development while the API can't be reached.
export const SCREEN_CUSTOMIZATIONS_URL = "/api/parametrization/screen-customizations";

// Development without the endpoint: the settings live in this browser
const sampleKey = (identifier: string) => `montra:screen-customization:${identifier}`;
const readSample = (identifier: string): AppSettings => {
  try {
    return parseSettings(localStorage.getItem(sampleKey(identifier)));
  } catch {
    return EMPTY_SETTINGS;
  }
};
const writeSample = (identifier: string, settings: AppSettings) => {
  try {
    localStorage.setItem(sampleKey(identifier), JSON.stringify(toConfiguration(settings)));
  } catch {
    // storage blocked: the change only lasts until reload
  }
};

const appSettingsApi = emptySplitApi.enhanceEndpoints({ addTagTypes: ["ScreenCustomization"] }).injectEndpoints({
  endpoints: (build) => ({
    getScreenCustomization: build.query<{ settings: AppSettings; isSample: boolean }, MontraAplApplications>({
      queryFn: async (identifier, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: SCREEN_CUSTOMIZATIONS_URL, params: { screenIdentifier: identifier } });
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) return { data: { settings: readSample(identifier), isSample: true } };
        // Nothing saved yet for this app
        if (error?.status === 404) return { data: { settings: EMPTY_SETTINGS, isSample: false } };
        if (error) return { error };
        const dto = result.data as ScreenCustomizationDto | null;
        return { data: { settings: parseSettings(dto?.configuration), isSample: false } };
      },
      providesTags: (_result, _error, identifier) => [{ type: "ScreenCustomization", id: identifier }],
    }),
    saveScreenCustomization: build.mutation<AppSettings, { identifier: MontraAplApplications; settings: AppSettings }>({
      queryFn: async ({ identifier, settings }, _api, _extra, baseQuery) => {
        const body: SaveScreenCustomizationRequest = { screenIdentifier: identifier, configuration: toConfiguration(settings) };
        const result = await baseQuery({ url: SCREEN_CUSTOMIZATIONS_URL, method: "POST", body });
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) {
          writeSample(identifier, settings);
          return { data: settings };
        }
        if (error) return { error };
        return { data: settings };
      },
      invalidatesTags: (_result, _error, { identifier }) => [{ type: "ScreenCustomization", id: identifier }],
    }),
  }),
});

export const { useGetScreenCustomizationQuery, useSaveScreenCustomizationMutation } = appSettingsApi;
