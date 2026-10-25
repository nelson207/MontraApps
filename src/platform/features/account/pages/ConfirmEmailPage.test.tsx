// @vitest-environment jsdom
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockFetch, renderWithApi } from "@platform/features/news/testing/renderWithApi";
import ConfirmEmailPage from "./ConfirmEmailPage";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const open = (route: string) => renderWithApi(<ConfirmEmailPage />, { route });

describe("/confirm-email", () => {
  it("sends the code from the URL once, without the session's token, and confirms", async () => {
    const { requests } = mockFetch((url) => (url.pathname === "/api/users/confirm-email" ? { json: null } : undefined));
    open("/confirm-email?code=abc%2B1");

    expect(await screen.findByText("Your e-mail address is confirmed")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go to login" }).getAttribute("href")).toBe("/login");
    expect(requests).toHaveLength(1);
    expect(await requests[0].json()).toEqual({ code: "abc+1" });
    expect(requests[0].headers.get("authorization")).toBeNull();
  });

  it("400 invalid_email_confirmation_code: invalid or expired", async () => {
    mockFetch(() => ({ status: 400, json: { title: "Bad Request", status: 400, code: "invalid_email_confirmation_code" } }));
    open("/confirm-email?code=old");
    expect(await screen.findByText("This link is invalid or has expired")).toBeTruthy();
  });

  it("429: too many attempts", async () => {
    mockFetch(() => ({ status: 429, json: { title: "Too Many Requests", status: 429 } }));
    open("/confirm-email?code=x");
    expect(await screen.findByText("Too many attempts, try again later")).toBeTruthy();
  });

  it("no code: invalid link, nothing sent", async () => {
    const { requests } = mockFetch(() => ({ json: null }));
    open("/confirm-email");
    expect(await screen.findByText("This link is invalid or has expired")).toBeTruthy();
    expect(requests).toHaveLength(0);
  });
});
