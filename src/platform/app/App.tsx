import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "@platform/features/auth/pages/LoginPage";
import AuthCallbackPage from "@platform/features/auth/pages/AuthCallbackPage";
import ConfirmEmailPage from "@platform/features/account/pages/ConfirmEmailPage";
import { IDP_CALLBACK_PATH } from "@platform/features/auth/idp/idpConfig";
import MainLayout from "@platform/features/layout/MainLayout";
import NotFoundPage from "@platform/features/layout/pages/NotFoundPage";
import { useApplyTheme } from "@platform/features/theme/useApplyTheme";
import { useSessionExpiredRedirect } from "@platform/features/auth/useSessionExpiredRedirect";
import { APP_MODULES, DEFAULT_MODULE_PATH } from "@app/modules";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAppFavicon } from "./useAppFavicon";
import { useApplyLanguage } from "@platform/i18n/useApplyLanguage";

function App() {
  useApplyTheme();
  useAppFavicon();
  // The user's language (their choice, their uiCulture, or English)
  useApplyLanguage();
  // ErrorCode ErrInvalidSessionToken from the API: back to the login page
  useSessionExpiredRedirect();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Keycloak sends the user back here (public: the session doesn't exist yet) */}
      <Route path={IDP_CALLBACK_PATH} element={<AuthCallbackPage />} />
      {/* The link of the e-mail confirmation (public: works signed in or not) */}
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to={DEFAULT_MODULE_PATH} replace />} />

          {APP_MODULES.map(({ path, component: Module }) => (
            <Route key={path} path={path} element={<Module />} />
          ))}

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
