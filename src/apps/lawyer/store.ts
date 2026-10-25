import { useDispatch, useSelector } from "react-redux";
import { createMontraStore } from "@platform/app/store";

// Montra Lawyer store: the platform slices for now. Lawyer slices (legal actions, …) go here.
export * from "@platform/app/store";

export const store = createMontraStore({});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
