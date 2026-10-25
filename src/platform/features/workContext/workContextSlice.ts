import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { BRAND } from "@app/brand";
import { loadPreferences } from "@platform/app/preferences";
import type { CompleteSelection, ContextSelection } from "./hierarchy";

// The app-wide "acting as" selection (persisted per browser and per app, sanitized on read
// against the user's role — see sanitizeSelection). Records copy it once as their defaults;
// editing a record never writes back here.

/** Preferences key: each Montra app keeps its own context (Credit and Lawyer nodes differ) */
export const WORK_CONTEXT_PREFERENCE = `workContext:${BRAND.id}`;

/**
 * A saved selection and where its nodes came from. Sample ids mean nothing to the live API
 * (and vice versa), so a selection is only reused against the same origin.
 */
export type StoredWorkContext = { origin: "live" | "sample"; selection: Partial<ContextSelection> };

type WorkContextState = { stored: StoredWorkContext | undefined };

/** Saved before the origin was recorded: not trusted (it may hold sample ids) */
const readStored = (value: unknown): StoredWorkContext | undefined => {
  const stored = value as StoredWorkContext | undefined;
  return (stored?.origin === "live" || stored?.origin === "sample") && stored.selection ? stored : undefined;
};

const initialState: WorkContextState = {
  stored: readStored(loadPreferences()[WORK_CONTEXT_PREFERENCE]),
};

const workContextSlice = createSlice({
  name: "workContext",
  initialState,
  reducers: {
    /** The saved context is no longer valid (e.g. 400 invalid_id after a key rotation): back to the defaults */
    forgetWorkContext(state) {
      state.stored = undefined;
    },
    setWorkContext(state, action: PayloadAction<{ origin: StoredWorkContext["origin"]; selection: CompleteSelection }>) {
      state.stored = action.payload;
    },
  },
});

export const { setWorkContext, forgetWorkContext } = workContextSlice.actions;

export const selectStoredWorkContext = (state: { workContext: WorkContextState }) => state.workContext.stored;

export default workContextSlice.reducer;
