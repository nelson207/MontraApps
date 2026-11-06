import { newId } from "@platform/utils/newId";
import { createSlice, type Action, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CredOperDto,
  FinConditionDto,
  CredOperAssetDto,
  CredOperIntervDto,
} from "@platform/api/legacy/legacyApi";
import {
  carryRefs,
  ensureRefs,
  hasCustomer,
  interventionRole,
  LOCKED_BY_QUOTATION,
  type CarInsurance,
  type CreditProtectionInsurance,
  type CredOperDraft,
  type CredOperInput,
  type Insurance,
} from "./model/credOperDraft";
import { assetTypeOf, changeAssetType } from "./model/business";

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
  /**
   * The quotations a proposal was saved from in this session (their ids, and `#number`): a quotation
   * converts only once. Stays when another operation starts.
   */
  convertedQuotations: string[];
};

const initialState: CredoperState = {
  data: null,
  isLoading: false,
  isHydrated: false,
  error: null,
  isDirty: false,
  revision: 0,
  awaitingTemplate: false,
  convertedQuotations: [],
};

/** What a saved proposal says of the quotation it came from */
function rememberConverted(state: CredoperState, saved: CredOperInput) {
  if (!saved.sourceCredOperId) return;
  const { sourceCredOperId, conversionRef, sourceQuotation } = saved;
  const number = sourceQuotation?.number;
  for (const ref of [sourceCredOperId, conversionRef, sourceQuotation?.id, number != null ? `#${number}` : null]) {
    if (ref && !state.convertedQuotations.includes(ref)) state.convertedQuotations.push(ref);
  }
}

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

/** The ids the save gave items that had none (by position): saved again, they're updated, not added */
function takeNewIds(items: { id?: string | null }[] | null | undefined, saved: { id?: string | null }[] | null | undefined) {
  items?.forEach((item, index) => {
    if (item.id == null && saved?.[index]?.id != null) item.id = saved[index].id;
  });
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/**
 * `chosen` over `template`: what has a value in `chosen` wins, at any depth; lists go item by
 * item (by position), as many as `chosen` has (an empty or missing one takes the template's).
 * The template must not overwrite what was already chosen or typed.
 */
function underlay(template: unknown, chosen: unknown): unknown {
  if (chosen === undefined || chosen === null) return template ?? chosen;
  if (Array.isArray(chosen)) {
    if (!chosen.length) return Array.isArray(template) ? template : chosen;
    return chosen.map((item, i) => underlay(Array.isArray(template) ? template[i] : undefined, item));
  }
  if (isPlainObject(chosen) && isPlainObject(template)) {
    const out: Record<string, unknown> = { ...template };
    for (const [key, value] of Object.entries(chosen)) out[key] = underlay(template[key], value);
    return out;
  }
  return chosen;
}

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

    /** A fresh operation without the server's template yet: it comes once the asset type is decided */
    startBlank(state, action: PayloadAction<CredOperInput>) {
      setLoaded(state, action.payload);
      state.awaitingTemplate = true;
    },

    /**
     * The server's blank operation (new-credoper) under what was already chosen or typed
     * (business, company, asset, product, work context, vehicle, customer…; item by item): not
     * an edit, so the dirty flag stays as it is.
     */
    applyTemplate(state, action: PayloadAction<CredOperInput>) {
      if (!state.data || !state.awaitingTemplate) return;
      // Its asset is the first one, unless it's of another asset type than the one chosen
      // meanwhile (that one comes from useNewAsset)
      const kind = action.payload.assets?.[0]?.assetType;
      const template = kind != null && kind !== assetTypeOf(state.data) ? { ...action.payload, assets: undefined } : action.payload;
      state.data = ensureRefs(underlay(template, state.data) as CredOperInput);
      state.awaitingTemplate = false;
    },

    /** The customer of a proposal that has none (new-intervention), first: not an edit */
    presetCustomer(state, action: PayloadAction<CredOperIntervDto>) {
      if (!state.data || hasCustomer(state.data)) return;
      state.data.interventions = [
        { ...action.payload, correlationID: action.payload.correlationID || newId() },
        ...(state.data.interventions ?? []),
      ];
    },

    /**
     * The new asset of the asset type chosen (GET /api/equipments/new, /api/buildings/new: the
     * asset with its equipment or building) under the first asset, item by item (what it already
     * has wins): not an edit. Dropped when the asset type changed meanwhile.
     */
    applyNewAsset(state, action: PayloadAction<{ assetType: number; asset: CredOperAssetDto }>) {
      if (!state.data || assetTypeOf(state.data) !== action.payload.assetType) return;
      const [first = {}, ...rest] = state.data.assets ?? [];
      const asset = underlay(action.payload.asset, first) as CredOperAssetDto;
      state.data = ensureRefs({ ...state.data, assets: [asset, ...rest] });
    },

    /** The only asset type the business offers: decided for the user, not an edit */
    presetAssetType(state, action: PayloadAction<number | null>) {
      if (!state.data) return;
      state.data = ensureRefs(changeAssetType(state.data, action.payload).next);
    },

    /** An existing operation (Search, a reopened one). */
    loadExisting(state, action: PayloadAction<CredOperInput>) {
      setLoaded(state, action.payload);
    },

    /**
     * A proposal made from a quotation, as the API returned it: not saved yet, so it's unsaved work
     * (leaving it asks first)
     */
    startConverted(state, action: PayloadAction<CredOperInput>) {
      setLoaded(state, action.payload);
      state.isDirty = true;
    },

    /**
     * Server response to Save: the saved operation replaces the draft (credOperApi
     * savedFromApi), keeping the refs insurances link to. If the user edited while saving,
     * keeps those edits and only takes the server identity (id, number, state, rowVersion,
     * correlationId, and the ids of the items it created), so the next save is of this version.
     */
    markSaved: {
      reducer(state, action: PayloadAction<ServerResponse>) {
        const { response, sentRevision } = action.payload;
        rememberConverted(state, response);
        if (state.data && isStale(state, sentRevision)) {
          const data = state.data;
          data.id = response.id;
          data.credOperNumber = response.credOperNumber;
          data.autUserStateId = response.autUserStateId;
          data.stateDate = response.stateDate;
          data.entryMoment = response.entryMoment;
          data.rowVersion = response.rowVersion;
          data.correlationId = response.correlationId ?? data.correlationId;
          takeNewIds(data.interventions, response.interventions);
          takeNewIds(data.assets, response.assets);
          takeNewIds(data.conditions, response.conditions);
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

    /** A different financial product clears the previous one's version (its defaults bring the new one's) */
    patchCredoper(state, action: PayloadAction<Partial<CredOperInput>>) {
      if (!state.data) return;
      const productChanged = "financialProduct" in action.payload && action.payload.financialProduct !== state.data.financialProduct;
      state.data = { ...state.data, ...action.payload, ...(productChanged ? { finProductVersion: null } : {}) };
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

    /**
     * The customer starts over, from a blank one (new-intervention): nothing of who they were
     * stays, on them or on the operation's customer fields. Still this operation's same person: saved
     * again they're updated, not added, and the insurances linked to them stay linked. With
     * `credOperClassification`, the classification they were asked for comes in at the same time;
     * with `dropSecondHolder` (the user was warned: a company can't have one), the second holder goes.
     */
    restartCustomer(
      state,
      action: PayloadAction<{ ref: string; blank: CredOperIntervDto; credOperClassification?: number; dropSecondHolder?: boolean }>,
    ) {
      if (!state.data) return;
      const { ref, blank, credOperClassification, dropSecondHolder } = action.payload;
      if (credOperClassification !== undefined) state.data.credOperClassification = credOperClassification;
      state.data.interventions = state.data.interventions?.map((person) =>
        person.correlationID === ref
          ? {
              ...blank,
              id: person.id,
              correlationID: ref,
              credOperIntervType: person.credOperIntervType,
              credOperId: (person as { credOperId?: string | null }).credOperId,
            }
          : person,
      );
      if (dropSecondHolder) {
        state.data.interventions = state.data.interventions?.filter((person) => interventionRole(person) !== "secondHolder");
      }
      delete state.data.customerName;
      delete state.data.customerVAT;
      delete state.data.customerEmail;
      delete state.data.customerPhone;
      delete state.data.customerLandLine;
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
  startConverted,
  markSaved,
  setCredoper,
  setCredoperError,
  patchCredoper,
  applyProductDefaults,
  addIntervention,
  restartCustomer,
  presetBusiness,
  presetCompany,
  presetAssetType,
  applyNewAsset,
  presetCustomer,
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

/** Actions that put another operation (or the saved version of this one) in place: they may set the locked fields */
const REPLACING: string[] = [startNew.type, startBlank.type, loadExisting.type, startConverted.type, markSaved.type, resetCredoper.type];

/**
 * A proposal made from a quotation keeps the quotation's company, business and operation type
 * (LOCKED_BY_QUOTATION): whatever else changes the operation (an edit, a product's defaults, a
 * calculation, a company decided for the user…) leaves them as they were.
 */
function credoperReducer(state: CredoperState | undefined, action: Action): CredoperState {
  const next = credoperSlice.reducer(state, action);
  const before = state?.data;
  if (!before?.sourceCredOperId || !next.data || REPLACING.includes(action.type)) return next;
  const changed = LOCKED_BY_QUOTATION.filter((key) => next.data![key] !== before[key]);
  if (!changed.length) return next;
  return { ...next, data: { ...next.data, ...Object.fromEntries(changed.map((key) => [key, before[key]])) } };
}

export default credoperReducer;
