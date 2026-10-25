import { createSlice } from "@reduxjs/toolkit";
import { loadPreferences } from "@platform/app/preferences";

type LayoutState = {
  /** Desktop: sidebar shrunk to an icon rail (persisted) */
  sidebarCollapsed: boolean;
  /** Mobile: sidebar drawer open */
  mobileSidebarOpen: boolean;
};

const initialState: LayoutState = {
  sidebarCollapsed: loadPreferences().sidebarCollapsed ?? false,
  mobileSidebarOpen: false,
};

const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    toggleSidebarCollapsed(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    openMobileSidebar(state) {
      state.mobileSidebarOpen = true;
    },
    closeMobileSidebar(state) {
      state.mobileSidebarOpen = false;
    },
  },
});

type WithLayout = { layout: LayoutState };
export const selectSidebarCollapsed = (state: WithLayout) =>
  state.layout.sidebarCollapsed;
export const selectMobileSidebarOpen = (state: WithLayout) =>
  state.layout.mobileSidebarOpen;

export const { toggleSidebarCollapsed, openMobileSidebar, closeMobileSidebar } =
  layoutSlice.actions;
export default layoutSlice.reducer;
