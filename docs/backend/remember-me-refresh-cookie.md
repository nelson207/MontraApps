# MontraAPI: "Remember me" for the refresh cookie

**Status:** done. MontraAPI implements it (commit `2618682`), and the front end's interim workaround has been removed.

## Why

The front end keeps the access token in memory only. After a reload, or in a new tab, it gets a new one from `POST /api/auth/refresh`, using the `montra_rt` HttpOnly cookie.

Today that cookie always has `Expires = now + RefreshHours`. It therefore outlives the browser, even when the user left "Remember me" unticked. The front end works around this: when the browser starts a new session and the user hadn't ticked Remember me, it calls `/api/auth/logout` instead of `/refresh`. That's only a workaround. Anyone at the same computer could still call `/refresh` from DevTools before the app does.

Wanted behaviour:

| Remember me | `montra_rt` cookie | Lasts |
|---|---|---|
| off (default) | session cookie (no `Expires`) | until the browser closes, at most `RefreshHours` server-side |
| on | persistent cookie (`Expires`) | `RefreshHours` (or a longer `RememberMeHours`, see below) |

## Changes

### 1. Requests

`MontraAPI.Contracts/Auth/LoginRequest.cs`:

```csharp
public sealed record LoginRequest(string Username, string Password, LoginMethod? Method = null,
    MontraAplApplications? MontraAplApplication = null, bool RememberMe = false);
```

Add `bool RememberMe = false` to `WindowsLoginRequest` as well.

The front end already sends `"rememberMe": true|false` in the login body. The API ignores it today, because System.Text.Json is on default options.

### 2. Carry the flag until the cookie is set

The cookie is set in `AuthController.ToResponse` when the outcome is `Authenticated`. That can be one or two steps after the login:

- **2FA:** `IssueChallenge(data)` must carry the flag, for example as an `rm` claim, and `VerifyTwoFactorAsync` must read it back.
- **Required password change:** the same applies to `IssuePasswordChangeChallenge` and `CompleteRequiredPasswordChangeAsync`.
- **Refresh:** the flag must be inside the refresh token, so a rotated cookie keeps the same mode.

The simplest place for it is the data that already travels in every token, for example `bool RememberMe` on what the issuer protects. If you add it to `AccipiensSessionData`, include it in the hand-written `Equals`.

Alternatively, wrap only the refresh payload: `RefreshPayload(AccipiensSessionData Session, bool RememberMe)`.

`AuthOutcome.Authenticated` (or `IssuedTokens`) then exposes `RememberMe`, so the controller can choose the cookie.

### 3. The cookie

`MontraAPI.Api/Security/RefreshCookie.cs`:

```csharp
public void Set(HttpResponse response, string refreshToken, bool rememberMe) =>
    response.Cookies.Append(Name, refreshToken,
        Options(rememberMe ? time.GetUtcNow().AddHours(jwt.Value.RefreshHours) : null));
```

`Expires = null` makes it a session cookie. Keep `HttpOnly`, `Secure`, `SameSite=Strict` and `Path=/api/auth` as they are.

The protector's time limit (`RefreshHours`) still bounds a session cookie on the server, because browsers that restore sessions can keep session cookies alive.

### 4. Tests

- Login with `rememberMe: false`: the `Set-Cookie` header for `montra_rt` has no `expires`/`max-age`.
- Login with `rememberMe: true`: `Set-Cookie` has `expires`.
- 2FA verify and the required password change keep the flag from the login.
- Refresh keeps the flag: the cookie after a refresh has the same persistence as before.
- A request without `rememberMe` behaves as `false`.

### 5. After deploying

1. Regenerate the front-end types (`MontraPOSApi.ts`). `LoginRequest` then has `rememberMe`, so remove the cast in `src/platform/features/auth/hooks/useLogin.ts`.
2. Done: the front end's workaround (ending the session itself after a browser restart) is removed. It could wrongly log out a valid session when the last tab was closed and a new one opened in the same browser.

## Other findings while reviewing the refresh flow (OWASP ASVS V3, session management)

These aren't needed for Remember me, but they matter for the cookie-based session:

1. **Refresh tokens can't be revoked.** They're stateless (Data Protection payloads), so `LogoutAsync` can't invalidate a stolen refresh token. It ends the Accipiens session instead, which makes later refreshed JWTs useless. Confirm that this always holds. If it doesn't, keep a server-side id per refresh token and deny it on logout.
2. **There's no absolute session lifetime.** Every refresh issues a new token valid for another `RefreshHours`, so an active session never ends. Carry the original login time in the payload and refuse refreshes past a hard limit (for example 12 h, or a longer `RememberMeHours` for remembered sessions).
3. **There's no detection of a refresh token being used twice.** The token rotates, but an older one stays valid until it expires. With item 1 in place, a reused (already rotated) token can revoke the whole session.
4. **CSRF on `/refresh` and `/logout`.** Both are cookie-authenticated POSTs. `SameSite=Strict` and the CORS allow-list already protect them. For defence in depth, require a custom header (for example `X-Requested-With: montra`) so a cross-site form can't send them without a CORS preflight. Tell me and I'll add it to the front end.
5. **Development cookie check.** In Chrome DevTools → Application → Cookies, confirm that `montra_rt` is set after login and sent with `/api/auth/refresh` when the app runs on `http://localhost:517x` against `https://localhost:5165`. If it isn't sent, every reload goes back to the login page. In that case serve the dev front end over HTTPS too, or route `/api` through the Vite proxy.
