import { describe, expect, it, vi } from "vitest";
import { readIdpConfig } from "./idpConfig";
import { idpCallbackFailure, idpLoginFailure, organizationAccountFailed } from "./idpErrors";

describe("Keycloak configuration (environment)", () => {
  const env = {
    VITE_IDP_ENABLED: "true",
    VITE_IDP_AUTHORITY: "https://sso.example.com/realms/montra/",
    VITE_IDP_CLIENT_ID: "montra-pos",
  };

  it("on: authority (no trailing slash), client, default scope and label", () =>
    expect(readIdpConfig(env)).toEqual({
      authority: "https://sso.example.com/realms/montra",
      clientId: "montra-pos",
      scope: "openid profile",
      label: "Sign in with Keycloak",
    }));

  it("the scope always includes openid; the label is configurable", () => {
    const config = readIdpConfig({ ...env, VITE_IDP_SCOPE: "profile montra-api", VITE_IDP_LABEL: "Sign in with Acme SSO" });
    expect(config?.scope).toBe("openid profile montra-api");
    expect(config?.label).toBe("Sign in with Acme SSO");
  });

  it("off unless VITE_IDP_ENABLED is true, or when authority or client is missing", () => {
    expect(readIdpConfig({ ...env, VITE_IDP_ENABLED: "false" })).toBeNull();
    expect(readIdpConfig({})).toBeNull();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(readIdpConfig({ ...env, VITE_IDP_CLIENT_ID: "" })).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("Keycloak sign-in errors", () => {
  const problem = (status: number, code: string) => ({ status, data: { status, code, title: "server text" } });

  it("401 invalid_credentials: the organization account message, with retry or username/password", () => {
    const failure = idpLoginFailure(problem(401, "invalid_credentials"));
    expect(failure.message).toContain(organizationAccountFailed());
    expect(failure.message).toContain("username and password");
    expect(failure.canRetry).toBe(true);
  });

  it("429 rate_limited: wait; 502 backend_unavailable: retry", () => {
    expect(idpLoginFailure(problem(429, "rate_limited"))).toEqual({ message: expect.stringContaining("wait"), canRetry: false });
    expect(idpLoginFailure(problem(502, "backend_unavailable")).canRetry).toBe(true);
  });

  it("400 validation_failed is a bug: logged", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    idpLoginFailure(problem(400, "validation_failed"));
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("never shows the server's text", () =>
    expect(JSON.stringify([401, 429, 502, 500].map((s) => idpLoginFailure(problem(s, "x"))))).not.toContain("server text"));

  it("the user cancelled at Keycloak", () =>
    expect(idpCallbackFailure({ error: "access_denied" }).message).toContain("cancelled"));
});
