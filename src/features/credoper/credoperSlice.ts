import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CredOperDto,
  FinConditionDto,
  CredOperAssetDto,
} from "../../services/api/generated/MontraPOSApi";

type CredoperState = {
  data: CredOperDto | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
};

const initialState: CredoperState = {
  data: null,
  isLoading: false,
  isHydrated: false,
  error: null,
};

const credoperSlice = createSlice({
  name: "credoper",
  initialState,
  reducers: {
    startLoadingCredoper(state) {
      state.isLoading = true;
      state.error = null;
    },

    setCredoper(state, action: PayloadAction<CredOperDto>) {
      state.data = action.payload;
      state.isLoading = false;
      state.isHydrated = true;
      state.error = null;
    },

    setCredoperError(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },

    patchCredoper(state, action: PayloadAction<Partial<CredOperDto>>) {
      if (!state.data) return;

      state.data = {
        ...state.data,
        ...action.payload,
      };
    },

    setConditions(state, action: PayloadAction<FinConditionDto[]>) {
      if (!state.data) return;
      state.data.conditions = action.payload;
    },

    updateConditionAt(
      state,
      action: PayloadAction<{
        index: number;
        changes: Partial<FinConditionDto>;
      }>,
    ) {
      if (!state.data?.conditions) return;

      const { index, changes } = action.payload;
      if (!state.data.conditions[index]) return;

      state.data.conditions[index] = {
        ...state.data.conditions[index],
        ...changes,
      };
    },

    addCondition(state, action: PayloadAction<FinConditionDto>) {
      if (!state.data) return;

      state.data.conditions = state.data.conditions || [];
      state.data.conditions.push(action.payload);
    },

    removeConditionAt(state, action: PayloadAction<number>) {
      if (!state.data?.conditions) return;
      state.data.conditions.splice(action.payload, 1);
    },

    setAssets(state, action: PayloadAction<CredOperAssetDto[]>) {
      if (!state.data) return;
      state.data.assets = action.payload;
    },

    updateAssetAt(
      state,
      action: PayloadAction<{
        index: number;
        changes: Partial<CredOperAssetDto>;
      }>,
    ) {
      if (!state.data?.assets) return;

      const { index, changes } = action.payload;
      if (!state.data.assets[index]) return;

      state.data.assets[index] = {
        ...state.data.assets[index],
        ...changes,
      };
    },

    addAsset(state, action: PayloadAction<CredOperAssetDto>) {
      if (!state.data) return;

      state.data.assets = state.data.assets || [];
      state.data.assets.push(action.payload);
    },

    removeAssetAt(state, action: PayloadAction<number>) {
      if (!state.data?.assets) return;
      state.data.assets.splice(action.payload, 1);
    },

    setCredOperStep(state, action: PayloadAction<number>) {
      if (!state.data) return;
      state.data.credOperStep = action.payload;
    },

    resetCredoper(state) {
      state.data = null;
      state.isLoading = false;
      state.isHydrated = false;
      state.error = null;
    },
  },
});

export const {
  startLoadingCredoper,
  setCredoper,
  setCredoperError,
  patchCredoper,
  setConditions,
  updateConditionAt,
  addCondition,
  removeConditionAt,
  setAssets,
  updateAssetAt,
  addAsset,
  removeAssetAt,
  setCredOperStep,
  resetCredoper,
} = credoperSlice.actions;

export default credoperSlice.reducer;
