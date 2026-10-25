import { createSlice } from "@reduxjs/toolkit";

type LayoutState = {
  /** Mobile: sidebar drawer open */
  mobileSidebarOpen: boolean;
};

const initialState: LayoutState = {
  mobileSidebarOpen: false,
};

const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    openMobileSidebar(state) {
      state.mobileSidebarOpen = true;
    },
    closeMobileSidebar(state) {
      state.mobileSidebarOpen = false;
    },
  },
});

type WithLayout = { layout: LayoutState };
export const selectMobileSidebarOpen = (state: WithLayout) =>
  state.layout.mobileSidebarOpen;

export const { openMobileSidebar, closeMobileSidebar } = layoutSlice.actions;
export default layoutSlice.reducer;
