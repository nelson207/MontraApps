import { InMemoryWebStorage, UserManager, WebStorageStateStore } from "oidc-client-ts";
import { appRouteUrl } from "@platform/app/deployment";
import { IDP_CALLBACK_PATH, IDP_CONFIG, type IdpConfig } from "./idpConfig";

// The Keycloak side of "Sign in with Keycloak": Authorization Code flow with PKCE (S256),
// never the implicit flow. Keycloak's tokens never reach Web Storage:
//  - tokens (userStore): memory only, and dropped right after the exchange for a MontraAPI session
//  - the sign-in request (stateStore: state, nonce, PKCE verifier) must survive the redirect to
//    Keycloak and back, so it's in sessionStorage until the callback consumes it; it holds no token

/** What the POS carries through the Keycloak round trip */
export type IdpSignInState = { rememberMe: boolean; from: string };

let manager: UserManager | null = null;

function userManager(config: IdpConfig): UserManager {
  manager ??= new UserManager({
    authority: config.authority,
    client_id: config.clientId,
    redirect_uri: appRouteUrl(IDP_CALLBACK_PATH),
    post_logout_redirect_uri: appRouteUrl("/login"),
    response_type: "code",
    scope: config.scope,
    userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
    stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
    // No silent renew, no session monitor: after the exchange the POS lives on its MontraAPI session
    automaticSilentRenew: false,
    monitorSession: false,
    loadUserInfo: false,
  });
  return manager;
}

const configured = (): IdpConfig => {
  if (!IDP_CONFIG) throw new Error("Keycloak sign-in is not configured");
  return IDP_CONFIG;
};

/** Leaves for Keycloak's login page; comes back on IDP_CALLBACK_PATH */
export function startIdpSignIn(state: IdpSignInState): Promise<void> {
  return userManager(configured()).signinRedirect({ state });
}

/**
 * On the callback route: completes the code exchange (PKCE) and returns Keycloak's access token
 * with the POS state. The tokens are dropped from memory right away: the caller exchanges the
 * access token for a MontraAPI session and forgets it.
 */
export async function finishIdpSignIn(): Promise<{ accessToken: string; state: IdpSignInState }> {
  const users = userManager(configured());
  const user = await users.signinRedirectCallback();
  await users.removeUser();
  const state = (user.state ?? {}) as Partial<IdpSignInState>;
  return {
    accessToken: user.access_token,
    state: { rememberMe: state.rememberMe === true, from: typeof state.from === "string" ? state.from : "/" },
  };
}

/**
 * Ends the Keycloak session too (shared terminals): Keycloak's end-session endpoint, then back to
 * the login page. No ID token is kept, so Keycloak may ask the user to confirm.
 */
export function endIdpSession(): Promise<void> {
  return userManager(configured()).signoutRedirect({ post_logout_redirect_uri: appRouteUrl("/login") });
}
