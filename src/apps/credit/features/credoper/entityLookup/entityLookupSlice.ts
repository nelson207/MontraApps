import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadExisting, resetCredoper, startBlank, startNew } from "../credoperSlice";

// Per person of the proposal (intervention correlationID): where their VAT number (NIF) lookup
// stands. Kept out of the draft (never sent), and across steps, so a code request can be resumed.

export type LookupOutcome =
  /** In the database: waiting for the user to ask for (and enter) the code, or to fill in manually */
  | "found"
  /** Not in the database: filled in by hand */
  | "notFound"
  /** The user chose to fill in by hand (a code request stays resumable) */
  | "manual"
  /** Filled with the database's data (code confirmed) */
  | "filled"
  /** The user went back to the search (after filling in by hand): the fields wait again */
  | "search";

export type OtpRequest = { requestId: string; validUntil: string };

export type EntityLookup = {
  vat: string;
  outcome: LookupOutcome;
  /** Where the code goes (masked by the backend) */
  phone?: string | null;
  email?: string | null;
  otp?: OtpRequest;
};

type State = Record<string, EntityLookup>;

const entityLookupSlice = createSlice({
  name: "entityLookup",
  initialState: {} as State,
  reducers: {
    lookedUp(state, action: PayloadAction<{ ref: string; vat: string; found: boolean; phone?: string | null; email?: string | null }>) {
      const { ref, vat, found, phone, email } = action.payload;
      // Searched again for the same NIF: a code already sent can still be entered
      const otp = found && state[ref]?.vat === vat ? state[ref].otp : undefined;
      state[ref] = { vat, outcome: found ? "found" : "notFound", phone, email, ...(otp ? { otp } : {}) };
    },
    /** Back to the search, from filling in by hand: the NIF and a code sent are kept */
    searchAgain(state, action: PayloadAction<{ ref: string; vat: string }>) {
      const { ref, vat } = action.payload;
      state[ref] = { ...state[ref], vat, outcome: "search" };
    },
    otpSent(state, action: PayloadAction<{ ref: string; otp: OtpRequest }>) {
      const lookup = state[action.payload.ref];
      if (lookup) lookup.otp = action.payload.otp;
    },
    choseManual(state, action: PayloadAction<{ ref: string; vat: string }>) {
      const { ref, vat } = action.payload;
      state[ref] = { ...state[ref], vat, outcome: "manual" };
    },
    filled(state, action: PayloadAction<string>) {
      const lookup = state[action.payload];
      if (lookup) {
        lookup.outcome = "filled";
        delete lookup.otp;
      }
    },
  },
  // Another operation: its people start over
  extraReducers: (builder) =>
    builder.addMatcher(
      (action) => [startNew.type, startBlank.type, loadExisting.type, resetCredoper.type].includes(action.type),
      () => ({}),
    ),
});

export const { lookedUp, otpSent, choseManual, filled, searchAgain } = entityLookupSlice.actions;

export default entityLookupSlice.reducer;
