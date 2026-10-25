import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadPreferences } from "@platform/app/preferences";
import { parseLanguage, type Language } from "./languages";

// The language the user chose in this browser (persisted with the other preferences);
// null = none chosen (their uiCulture, then English: see languages.ts)
export type LanguageState = { choice: Language | null };

const languageSlice = createSlice({
  name: "language",
  initialState: (): LanguageState => ({ choice: parseLanguage(loadPreferences().language) }),
  reducers: {
    chooseLanguage(state, action: PayloadAction<Language>) {
      state.choice = action.payload;
    },
  },
});

export const { chooseLanguage } = languageSlice.actions;
export const selectLanguageChoice = (state: { language: LanguageState }) => state.language.choice;
export default languageSlice.reducer;
