import { useDispatch, useSelector } from "react-redux";
import { createMontraStore } from "@platform/app/store";

// Montra Customer store: the platform slices (the contracts use RTK Query, no slice yet).
export * from "@platform/app/store";

export const store = createMontraStore({});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
