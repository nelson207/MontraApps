// @vitest-environment jsdom
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeStore, mockFetch, renderWithApi, type MockAnswer } from "@platform/features/news/testing/renderWithApi";
import SettingsPage from "@platform/features/settings/pages/SettingsPage";
import ApplicationSettings from "./ApplicationSettings";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const FORBIDDEN: MockAnswer = { status: 403, json: { status: 403, code: "settings_forbidden" } };

/** The credit app's saved settings (and the shared ones, for the e-mail types) */
const SAVED = {
  newsTypes: [1, 2, 99],
  companies: [
    {
      companyId: 1,
      businesses: [4],
      proposalBusinesses: [],
      // The earlier name of businessSettings
      businessClassifications: [{ businessId: 4, classifications: [1, 99] }],
      equipmentTypes: [10],
      equipmentCategories: [100],
    },
  ],
  emailTypes: { personal: null, work: null },
};

/** The catalog, answered by path; `override` answers first. Returns the requests made. */
function api(override: (url: URL, request: Request) => MockAnswer | undefined = () => undefined) {
  return mockFetch((url, request) => {
    const answer = override(url, request);
    if (answer) return answer;
    switch (url.pathname) {
      case "/api/parametrization/screen-customizations":
        if (request.method === "POST") return { json: null };
        return { json: { screenIdentifier: url.searchParams.get("screenIdentifier"), configuration: SAVED } };
      case "/api/catalog/companies":
        return { json: [{ id: 1, abbreviation: "Lisboa" }, { id: 2, abbreviation: "Porto" }] };
      case "/api/catalog/companies/1/businesses":
        return { json: [{ id: 4, abbreviation: "Auto credit" }] };
      case "/api/catalog/equipment":
        return {
          json: [
            { id: 10, abbreviation: "Cars", isValid: true, categories: [{ id: 100, abbreviation: "Light", isValid: true }] },
          ],
        };
      case "/api/catalog/news-types":
        return {
          json: [
            { id: 1, abbreviation: "Products", isValid: true },
            { id: 2, abbreviation: "Campaigns", isValid: false },
            { id: 3, abbreviation: "Old", isValid: false },
            { id: 4, abbreviation: "Training", isValid: true },
          ],
        };
      case "/api/catalog/classifications":
        return {
          json: [
            { id: 1, abbreviation: "Private", isValid: true },
            { id: 2, abbreviation: "Company", isValid: true },
            { id: 3, abbreviation: "Old", isValid: false },
          ],
        };
      case "/api/catalog/asset-types":
        return { json: [{ id: 1, abbreviation: "Equipment" }, { id: 2, abbreviation: "Building" }] };
      case "/api/catalog/email-types":
        return { json: [{ id: 7, abbreviation: "Personal" }] };
    }
    return undefined;
  }).requests;
}

const paths = (requests: Request[]) => requests.map((r) => new URL(r.url));
const openSection = async (name: RegExp) => userEvent.click(await screen.findByRole("tab", { name }));

describe("Settings → Application: the pickers come from the catalog", () => {
  it("calls only /api/catalog/* (equipment and news types with includeInvalid=true)", async () => {
    const requests = api();
    renderWithApi(<ApplicationSettings />);

    await screen.findByLabelText("Lisboa");
    await userEvent.click(screen.getByRole("button", { name: /Businesses/ }));
    await screen.findByText("Auto credit");
    await openSection(/^Equipment/);
    await screen.findByLabelText("Cars");
    await openSection(/^News/);
    await screen.findByLabelText("Products");
    await openSection(/^E-mail/);
    await screen.findAllByRole("option", { name: "Personal" });

    const urls = paths(requests);
    const called = (path: string) => urls.filter((u) => u.pathname === path);
    expect(called("/api/catalog/companies")).toHaveLength(1);
    expect(called("/api/catalog/companies/1/businesses")).toHaveLength(1);
    expect(called("/api/catalog/equipment")[0].searchParams.get("includeInvalid")).toBe("true");
    expect(called("/api/catalog/news-types")[0].searchParams.get("includeInvalid")).toBe("true");
    expect(called("/api/catalog/email-types")).toHaveLength(1);
    expect(called("/api/catalog/classifications")[0].searchParams.get("includeInvalid")).toBe("true");
    // Never the application-filtered lists: empty on a first setup
    expect(urls.filter((u) => /^\/api\/(companies|news\/types|equipments)/.test(u.pathname))).toEqual([]);
  });

  it("shows an expired configured type as expired, keeps it on save, and shows an unknown id as Unknown (id)", async () => {
    const requests = api();
    renderWithApi(<ApplicationSettings />);
    await openSection(/^News/);

    const expired = await screen.findByLabelText(/Campaigns/);
    expect((expired as HTMLInputElement).checked).toBe(true);
    expect(within(expired.closest(".form-check") as HTMLElement).getByText("Expired")).toBeTruthy();
    // An expired type that isn't configured isn't offered
    expect(screen.queryByLabelText(/Old/)).toBeNull();
    const unknown = screen.getByLabelText(/Unknown \(99\)/) as HTMLInputElement;
    expect(unknown.checked).toBe(true);

    await userEvent.click(screen.getByLabelText("Training"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Saved.");

    const save = requests.find((r) => r.method === "POST");
    expect((await save!.json()).configuration.newsTypes).toEqual([1, 2, 99, 4]);
  });

  it("each business's contract classifications come from the catalog and are saved typed", async () => {
    const requests = api();
    renderWithApi(<ApplicationSettings />);
    await userEvent.click(await screen.findByRole("button", { name: /Businesses/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Auto credit: contract classifications" }));

    expect((screen.getByRole("checkbox", { name: "Private" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("checkbox", { name: /Unknown \(99\)/ }) as HTMLInputElement).checked).toBe(true);
    // An expired classification that isn't configured isn't offered
    expect(screen.queryByLabelText(/Old/)).toBeNull();

    await userEvent.click(screen.getByLabelText("Company"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Saved.");

    const save = requests.find((r) => r.method === "POST");
    // Saved under the new name (businessSettings), whatever the earlier one was
    expect((await save!.json()).configuration.companies[0].businessSettings).toEqual([{ businessId: 4, classifications: [1, 99, 2], assetTypes: [] }]);
  });

  it("an expired type unticked stays listed, but can't be ticked again", async () => {
    api();
    renderWithApi(<ApplicationSettings />);
    await openSection(/^News/);

    const expired = (await screen.findByLabelText(/Campaigns/)) as HTMLInputElement;
    await userEvent.click(expired);
    expect(expired.checked).toBe(false);
    expect(expired.disabled).toBe(true);
  });

  it("403 settings_forbidden from the catalog: the administrators-only message, no retry", async () => {
    api((url) => (url.pathname === "/api/catalog/companies" ? FORBIDDEN : undefined));
    renderWithApi(<ApplicationSettings />);

    expect(await screen.findByText("Only administrators can change the application settings.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("403 settings_forbidden when saving: the administrators-only message", async () => {
    api((_url, request) => (request.method === "POST" ? FORBIDDEN : undefined));
    renderWithApi(<ApplicationSettings />);
    await openSection(/^News/);
    await userEvent.click(await screen.findByLabelText("Training"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Only administrators can change the application settings.")).toBeTruthy();
  });
});

/** An unsigned JWT with these claims (only decoded by the app, never verified) */
const jwt = (claims: Record<string, unknown>) => `e30.${btoa(JSON.stringify(claims)).replace(/=+$/, "")}.sig`;

describe("Settings → Application tab (administrators only)", () => {
  const applicationTab = () => screen.queryByRole("tab", { name: /Application/ });

  it("is hidden when the token has no Administrator role", async () => {
    api();
    renderWithApi(<SettingsPage />, { route: "/settings", store: makeStore(jwt({ role: "User" })) });
    await screen.findByRole("tab", { name: /Account/ });
    expect(applicationTab()).toBeNull();
  });

  it("is shown for role Administrator", async () => {
    api();
    renderWithApi(<SettingsPage />, { route: "/settings", store: makeStore(jwt({ role: "Administrator" })) });
    await waitFor(() => expect(applicationTab()).toBeTruthy());
  });
});
