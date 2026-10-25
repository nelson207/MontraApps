// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { MontraPOSApi } from "@platform/api/generated/MontraPOSApi";
import { mockFetch } from "@platform/features/news/testing/renderWithApi";
import i18n, { setLanguage } from "./i18n";
import LanguageSwitch from "./LanguageSwitch";
import languageReducer from "./languageSlice";
import { useApplyLanguage } from "./useApplyLanguage";

afterEach(async () => {
  cleanup();
  vi.unstubAllGlobals();
  await setLanguage("en");
});

const makeStore = () =>
  configureStore({
    reducer: {
      auth: () => ({ token: null, isAuthenticated: false }),
      language: languageReducer,
      [emptySplitApi.reducerPath]: emptySplitApi.reducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });

function Screen() {
  useApplyLanguage();
  const { t } = useTranslation("auth");
  return (
    <>
      <h1>{t("login.signIn")}</h1>
      <LanguageSwitch label="Language" />
    </>
  );
}

describe("choosing the language", () => {
  it("English by default; Portuguese is loaded when chosen and everything re-renders in it", async () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <Screen />
      </Provider>,
    );
    expect(screen.getByRole("heading").textContent).toBe("Sign in");

    fireEvent.click(screen.getByRole("radio", { name: "Português" }));
    expect(await screen.findByRole("heading", { name: "Iniciar sessão" })).toBeTruthy();
    expect(store.getState().language.choice).toBe("pt-PT");
    expect(document.documentElement.lang).toBe("pt-PT");
  });

  it("every request says which language is shown (Accept-Language)", async () => {
    const { requests } = mockFetch(() => ({ json: [] }));
    const store = makeStore();
    await store.dispatch(MontraPOSApi.endpoints.getApiCompanies.initiate(undefined, { forceRefetch: true }));
    await setLanguage("pt-PT");
    await store.dispatch(MontraPOSApi.endpoints.getApiCompanies.initiate(undefined, { forceRefetch: true }));
    expect(requests.map((r) => r.headers.get("accept-language"))).toEqual(["en", "pt-PT"]);
    expect(i18n.t("errors:forbidden")).toBe("Não tem permissão para fazer isto.");
  });
});
