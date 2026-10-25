import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadPreferences } from "@platform/app/preferences";
import { MONTRA_PRESET, parseMode, type ThemeMode } from "./themeUtils";
import { DEFAULT_DATE_FORMAT, parseDateFormat, type DateFormat } from "@platform/utils/dateFormat";

export type ThemeState = {
  /** Brand color: sidebar, buttons, links, active states */
  primary: string;
  /** Text and icons drawn on top of the primary color */
  onPrimary: string;
  /** Main content text color */
  bodyText: string;
  /** Light, dark, or follow the computer's setting */
  mode: ThemeMode;
  /** How dates are typed and shown in date fields */
  dateFormat: DateFormat;
};

/** The customizable colors (everything but the mode and the date format) */
export type ThemeColor = Exclude<keyof ThemeState, "mode" | "dateFormat">;

export const DEFAULT_THEME: ThemeState = {
  primary: MONTRA_PRESET.primary,
  onPrimary: MONTRA_PRESET.onPrimary,
  bodyText: "#212529", // Bootstrap's default $body-color
  mode: "system",
  dateFormat: DEFAULT_DATE_FORMAT,
};

const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

function initialTheme(): ThemeState {
  const saved = loadPreferences().theme ?? {};
  return {
    primary: isHexColor(saved.primary) ? saved.primary : DEFAULT_THEME.primary,
    onPrimary: isHexColor(saved.onPrimary)
      ? saved.onPrimary
      : DEFAULT_THEME.onPrimary,
    bodyText: isHexColor(saved.bodyText)
      ? saved.bodyText
      : DEFAULT_THEME.bodyText,
    mode: parseMode(saved.mode),
    dateFormat: parseDateFormat(saved.dateFormat),
  };
}

const themeSlice = createSlice({
  name: "theme",
  initialState: initialTheme,
  reducers: {
    setThemeColor(
      state,
      action: PayloadAction<{ key: ThemeColor; value: string }>,
    ) {
      if (isHexColor(action.payload.value)) {
        state[action.payload.key] = action.payload.value.toLowerCase();
      }
    },
    setDateFormat(state, action: PayloadAction<DateFormat>) {
      state.dateFormat = parseDateFormat(action.payload);
    },
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = parseMode(action.payload);
    },
    applyThemePreset(
      state,
      action: PayloadAction<Pick<ThemeState, "primary" | "onPrimary">>,
    ) {
      state.primary = action.payload.primary;
      state.onPrimary = action.payload.onPrimary;
    },
    resetTheme(state) {
      // Colors only: the light/dark choice and the date format stay
      return { ...DEFAULT_THEME, mode: state.mode, dateFormat: state.dateFormat };
    },
  },
});

export const selectTheme = (state: { theme: ThemeState }) => state.theme;

export const { setThemeColor, setThemeMode, setDateFormat, applyThemePreset, resetTheme } =
  themeSlice.actions;
export default themeSlice.reducer;
