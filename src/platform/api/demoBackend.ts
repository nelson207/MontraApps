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

/** Thrown by a handler: the API's ProblemDetails answer ({ title, status, code }) with that status */
export class DemoProblem extends Error {
  readonly status: number;
  readonly code: string;
  readonly title: string;
  constructor(status: number, code: string, title = code) {
    super(title);
    this.status = status;
    this.code = code;
    this.title = title;
  }
}

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

/**
 * The handler for a request: its exact "METHOD /path", else one with `:name` segments
 * ("GET /api/things/:id"), whose values are added to the params
 */
function findHandler(request: DemoRequest): DemoHandler | undefined {
  const exact = handlers.get(`${request.method} ${request.path}`);
  if (exact) return exact;
  const segments = request.path.split("/");
  for (const [key, handler] of handlers) {
    const [method, pattern] = key.split(" ");
    if (method !== request.method || !pattern.includes("/:")) continue;
    const parts = pattern.split("/");
    if (parts.length !== segments.length) continue;
    const found: Record<string, string> = {};
    const matches = parts.every((part, i) => {
      if (!part.startsWith(":")) return part === segments[i];
      found[part.slice(1)] = decodeURIComponent(segments[i]);
      return segments[i] !== "";
    });
    if (matches) {
      Object.assign(request.params, found);
      return handler;
    }
  }
  return undefined;
}

/** The demo answer for this request (an error for a DemoProblem); null when no app registered one */
export async function demoResponse(
  args: string | FetchArgs,
): Promise<{ data: unknown } | { error: { status: number; data: { title: string; status: number; code: string } } } | null> {
  const request = toDemoRequest(args);
  const handler = findHandler(request);
  if (!handler) return null;
  try {
    return { data: await handler(request) };
  } catch (problem) {
    if (!(problem instanceof DemoProblem)) throw problem;
    const { status, code, title } = problem;
    return { error: { status, data: { title, status, code } } };
  }
}
