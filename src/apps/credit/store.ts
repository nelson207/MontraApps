import { useDispatch, useSelector } from "react-redux";
import { createMontraStore } from "@platform/app/store";
import credoperReducer from "./features/credoper/credoperSlice";
import type { CredOperDraft } from "./features/credoper/model/credOperDraft";

// Montra Credit store: platform slices (incl. the working context) + the credit operation.
export * from "@platform/app/store";

// Development only: answers for "Demo access" when the API can't be reached (not in a production build)
if (import.meta.env.DEV) void import("./demo/creditDemoBackend");

export const store = createMontraStore({
  credoper: credoperReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/** Typed for the whole Credit state (shadow the platform-only hooks) */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export const selectCredoper = (state: RootState): CredOperDraft | null => state.credoper.data;

/** Bumped on every edit; sent along with requests to detect newer edits */
export const selectCredoperRevision = (state: RootState): number => state.credoper.revision;

export const selectCredoperIsDirty = (state: RootState): boolean => state.credoper.isDirty;
/** A new operation still without the server's template (its business isn't chosen yet) */
export const selectCredoperAwaitingTemplate = (state: RootState): boolean => state.credoper.awaitingTemplate;
