import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@platform/app/store";
import ErrorBoundary from "@platform/components/ui/ErrorBoundary";
import { LayoutBanner } from "@app/shell";
import PageLoader from "./components/PageLoader";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { closeMobileSidebar, selectMobileSidebarOpen } from "./layoutSlice";

// App shell: sidebar (icon rail on desktop, drawer on mobile),
// fixed top bar, and the active module rendered through <Outlet />.
// Sizes, breakpoints and colors live in styles/layout.scss and styles/theme.scss.
function MainLayout() {
  const dispatch = useAppDispatch();
  const mobileOpen = useAppSelector(selectMobileSidebarOpen);
  const { pathname, key: locationKey } = useLocation();

  // Close the mobile drawer after any navigation, including to the current page
  // (the Quotation/Proposal links start a new operation from there)
  useEffect(() => {
    dispatch(closeMobileSidebar());
  }, [locationKey, dispatch]);

  // While the drawer is open: Escape closes it, and the page behind doesn't scroll
  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch(closeMobileSidebar());
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("overflow-hidden");

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("overflow-hidden");
    };
  }, [mobileOpen, dispatch]);

  return (
    <div className="app-layout">
      <Sidebar />

      {mobileOpen && (
        <div
          className="offcanvas-backdrop fade show d-lg-none"
          onClick={() => dispatch(closeMobileSidebar())}
        />
      )}

      <Topbar />

      <main className="app-main">
        <div className="app-content">
          {/* The app's: e.g. the working context's "acting on behalf of" banner */}
          <LayoutBanner />
          {/* keyed by path so navigating away from a crashed module recovers */}
          <ErrorBoundary key={pathname}>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
