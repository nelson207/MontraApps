import type { FetchArgs } from "@reduxjs/toolkit/query";

// DEVELOPMENT ONLY — the demo backend: answers for the real API's endpoints while signed in with
// "Demo access" and the API can't be reached (see emptyApi.ts). Apps register their answers
// (e.g. apps/credit/demo/creditDemoBackend.ts), keyed by "METHOD /path".
// Placeholder endpoints that the backend doesn't have yet use their own samples (devFallback.ts).

export type DemoRequest = {
  method: string;
  path: string;
  params: Record<string, string>;
  body: unknown;
};

export type DemoHandler = (request: DemoRequest) => unknown | Promise<unknown>;

const handlers = new Map<string, DemoHandler>();

export function registerDemoHandlers(map: Record<string, DemoHandler>): void {
  for (const [key, handler] of Object.entries(map)) handlers.set(key, handler);
}

/** The request as method, path (no query string), query params and body */
export function toDemoRequest(args: string | FetchArgs): DemoRequest {
  const { url, method = "GET", params, body } = typeof args === "string" ? { url: args } : args;
  const [path, query = ""] = url.split("?");
  const all: Record<string, string> = Object.fromEntries(new URLSearchParams(query));
  for (const [key, value] of Object.entries((params ?? {}) as Record<string, unknown>)) {
    if (value !== undefined && value !== null) all[key] = String(value);
  }
  return { method: method.toUpperCase(), path, params: all, body };
}

/** The demo answer for this request; null when no app registered one */
export async function demoResponse(args: string | FetchArgs): Promise<{ data: unknown } | null> {
  const request = toDemoRequest(args);
  const handler = handlers.get(`${request.method} ${request.path}`);
  return handler ? { data: await handler(request) } : null;
}
