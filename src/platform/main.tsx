import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import "./styles/montra.scss";
import "bootstrap-icons/font/bootstrap-icons.css";
// The texts of the apps (English ready before the first render; see platform/i18n)
import "./i18n/i18n";
// The app being built (MONTRA_APP): its store, with the platform slices included
import { store } from "@app/store";
import { connectSession } from "./features/auth/session/sessionSync";
import { APP_BASE_PATH } from "./app/deployment";

// The session token is kept in memory: restore it after a reload and keep it fresh
connectSession(store);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter basename={APP_BASE_PATH}>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
