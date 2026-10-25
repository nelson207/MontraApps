import { newId } from "@platform/utils/newId";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CredOperDto,
  FinConditionDto,
  CredOperAssetDto,
  CredOperIntervDto,
} from "@platform/api/legacy/legacyApi";
import {
  carryRefs,
  ensureRefs,
  type CarInsurance,
  type CreditProtectionInsurance,
  type CredOperDraft,
  type CredOperInput,
  type Insurance,
} from "./model/credOperDraft";

type CredoperState = {
  data: CredOperDraft | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  /** Edited since the last start / load / save */
  isDirty: boolean;
  /** Bumped on every edit: a response to an older revision must not overwrite newer edits */
  revision: number;
  /**
   * A new operation started blank: GET /api/credit-operations/new-credoper is only called once
   * its business is chosen (applyTemplate)
   */
  awaitingTemplate: boolean;
};

const initialState: CredoperState = {
  data: null,
  isLoading: false,
  isHydrated: false,
  error: null,
  isDirty: false,
  revision: 0,
  awaitingTemplate: false,
};

type InsuranceChanges = Partial<Omit<CreditProtectionInsurance, "id" | "kind">> &
  Partial<Omit<CarInsurance, "id" | "kind">>;

function edited(state: CredoperState) {
  state.isDirty = true;
  state.revision += 1;
}

/** Response to a request sent at `sentRevision`: stale when edits happened since. */
const isStale = (state: CredoperState, sentRevision?: number) =>
  sentRevision !== undefined && sentRevision !== state.revision;

type ServerResponse = { response: CredOperInput; sentRevision?: number };
const prepareResponse = (response: CredOperInput, sentRevision?: number) => ({
  payload: { response, sentRevision } as ServerResponse,
});

function setLoaded(state: CredoperState, op: CredOperInput) {
  state.data = ensureRefs(op);
  state.isLoading = false;
  state.isHydrated = true;
  state.error = null;
  state.isDirty = false;
  state.awaitingTemplate = false;
}

/** The fields that have a value (the template must not overwrite what was already chosen) */
const withValues = (op: CredOperDraft): Partial<CredOperDraft> =>
  Object.fromEntries(Object.entries(op).filter(([, value]) => value !== undefined && value !== null)) as Partial<CredOperDraft>;

const credoperSlice = createSlice({
  name: "credoper",
  initialState,
  reducers: {
    startLoadingCredoper(state) {
      state.isLoading = true;
      state.error = null;
    },

    /** A fresh operation (menu entry). */
    startNew(state, action: PayloadAction<CredOperInput>) {
      setLoaded(state, action.payload);
    },

    /** A fresh operation without the server's template yet: it comes once the business is chosen */
    startBlank(state, action: PayloadAction<CredOperInput>) {
      setLoaded(state, action.payload);
      state.awaitingTemplate = true;
    },

    /**
     * The server's blank operation (new-credoper) under what was already chosen (business,
     * product, work context…): not an edit, so the dirty flag stays as it is.
     */
    applyTemplate(state, action: PayloadAction<CredOperInput>) {
      if (!state.data || !state.awaitingTemplate) return;
      state.data = ensureRefs({ ...action.payload, ...withValues(state.data) });
      state.awaitingTemplate = false;
    },

    /** An existing operation (Search, conversion result). */
    loadExisting(state, action: PayloadAction<CredOperInput>) {
      setLoaded(state, action.payload);
    },

    /**
     * Server response to Save. Keeps local insurances when the response has none
     * (backend not updated yet) and the refs insurances link to. If the user edited
     * while saving, keeps those edits and only takes the server identity.
     */
    markSaved: {
      reducer(state, action: PayloadAction<ServerResponse>) {
        const { response, sentRevision } = action.payload;
        if (state.data && isStale(state, sentRevision)) {
          state.data.id = response.id;
          state.data.credOperNumber = response.credOperNumber;
          return;
        }
        const insurances = response.insurances ?? state.data?.insurances ?? [];
        setLoaded(state, carryRefs(state.data, { ...response, insurances }));
      },
      prepare: prepareResponse,
    },

    /** Replace data without touching the dirty flag (e.g. calculation results); ignored when stale. */
    setCredoper: {
      reducer(state, action: PayloadAction<ServerResponse>) {
        const { response, sentRevision } = action.payload;
        if (isStale(state, sentRevision)) return;
        const insurances = response.insurances ?? state.data?.insurances ?? [];
        state.data = ensureRefs(carryRefs(state.data, { ...response, insurances }));
        state.isLoading = false;
        state.isHydrated = true;
        state.error = null;
      },
      prepare: prepareResponse,
    },

    setCredoperError(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },

    patchCredoper(state, action: PayloadAction<Partial<CredOperDto>>) {
      if (!state.data) return;
      state.data = { ...state.data, ...action.payload };
      edited(state);
    },

    // Values the server derives from the chosen product: not a user edit, so not dirty
    applyProductDefaults(
      state,
      action: PayloadAction<Partial<CredOperDto> & { firstCondition?: Partial<FinConditionDto> }>,
    ) {
      if (!state.data) return;
      const { firstCondition, ...fields } = action.payload;
      state.data = { ...state.data, ...fields };
      if (firstCondition && state.data.conditions?.[0]) {
        state.data.conditions[0] = { ...state.data.conditions[0], ...firstCondition };
      }
    },

    /** The only business the user has, chosen for them: not an edit */
    presetBusiness(state, action: PayloadAction<number>) {
      if (state.data) state.data.aplBusinessId = action.payload;
    },

    /** The only company the chosen business can be done with: decided for the user, not an edit */
    presetCompany(state, action: PayloadAction<number>) {
      if (state.data) state.data.aplCompanyId = action.payload;
    },

    /** Appends a person to the current list (with a ref so insurances can link to it). */
    addIntervention(state, action: PayloadAction<CredOperIntervDto>) {
      if (!state.data) return;
      const person = action.payload;
      state.data.interventions = [
        ...(state.data.interventions ?? []),
        { ...person, correlationID: person.correlationID || newId() },
      ];
      edited(state);
    },

    setConditions(state, action: PayloadAction<FinConditionDto[]>) {
      if (!state.data) return;
      state.data.conditions = action.payload;
      edited(state);
    },

    updateConditionAt(
      state,
      action: PayloadAction<{ index: number; changes: Partial<FinConditionDto> }>,
    ) {
      if (!state.data?.conditions) return;
      const { index, changes } = action.payload;
      if (!state.data.conditions[index]) return;
      state.data.conditions[index] = { ...state.data.conditions[index], ...changes };
      edited(state);
    },

    addCondition(state, action: PayloadAction<FinConditionDto>) {
      if (!state.data) return;
      state.data.conditions = state.data.conditions || [];
      state.data.conditions.push(action.payload);
      edited(state);
    },

    removeConditionAt(state, action: PayloadAction<number>) {
      if (!state.data?.conditions) return;
      state.data.conditions.splice(action.payload, 1);
      edited(state);
    },

    setAssets(state, action: PayloadAction<CredOperAssetDto[]>) {
      if (!state.data) return;
      state.data.assets = action.payload;
      edited(state);
    },

    updateAssetAt(
      state,
      action: PayloadAction<{ index: number; changes: Partial<CredOperAssetDto> }>,
    ) {
      if (!state.data?.assets) return;
      const { index, changes } = action.payload;
      if (!state.data.assets[index]) return;
      state.data.assets[index] = { ...state.data.assets[index], ...changes };
      edited(state);
    },

    addAsset(state, action: PayloadAction<CredOperAssetDto>) {
      if (!state.data) return;
      state.data.assets = state.data.assets || [];
      state.data.assets.push(action.payload);
      edited(state);
    },

    removeAssetAt(state, action: PayloadAction<number>) {
      if (!state.data?.assets) return;
      state.data.assets.splice(action.payload, 1);
      edited(state);
    },

    setCredOperStep(state, action: PayloadAction<number>) {
      if (!state.data) return;
      state.data.credOperStep = action.payload;
      edited(state);
    },

    setInsurances(state, action: PayloadAction<Insurance[]>) {
      if (!state.data) return;
      state.data.insurances = action.payload;
      edited(state);
    },

    addInsurance(state, action: PayloadAction<Insurance>) {
      if (!state.data) return;
      state.data.insurances.push(action.payload);
      edited(state);
    },

    updateInsurance(state, action: PayloadAction<{ id: string; changes: InsuranceChanges }>) {
      if (!state.data) return;
      const index = state.data.insurances.findIndex((i) => i.id === action.payload.id);
      if (index === -1) return;
      state.data.insurances[index] = {
        ...state.data.insurances[index],
        ...action.payload.changes,
      } as Insurance;
      edited(state);
    },

    removeInsurance(state, action: PayloadAction<string>) {
      if (!state.data) return;
      state.data.insurances = state.data.insurances.filter((i) => i.id !== action.payload);
      edited(state);
    },

    resetCredoper(state) {
      state.data = null;
      state.isLoading = false;
      state.isHydrated = false;
      state.error = null;
      state.isDirty = false;
    },
  },
});

export const {
  startLoadingCredoper,
  startNew,
  startBlank,
  applyTemplate,
  loadExisting,
  markSaved,
  setCredoper,
  setCredoperError,
  patchCredoper,
  applyProductDefaults,
  addIntervention,
  presetBusiness,
  presetCompany,
  setConditions,
  updateConditionAt,
  addCondition,
  removeConditionAt,
  setAssets,
  updateAssetAt,
  addAsset,
  removeAssetAt,
  setCredOperStep,
  setInsurances,
  addInsurance,
  updateInsurance,
  removeInsurance,
  resetCredoper,
} = credoperSlice.actions;

export default credoperSlice.reducer;
