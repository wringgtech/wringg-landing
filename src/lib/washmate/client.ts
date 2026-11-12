// Browser client for the Washmate Supabase edge functions.
//
// Mirrors washmate/apps/customer-mobile/src/api/client.ts. The backend allows
// any origin and the x-app-* headers (supabase/functions/_shared/cors.ts), so
// the static site calls it directly; there is no server of our own.

/** Customer app id the backend maps to the customer role (_shared/appRole.ts). */
export const WEB_APP_ID = "in.wringg.customer";
export const WEB_APP_VERSION_NAME = "web-0.1.0";

export type ApiErrorCode = "NOT_CONFIGURED" | "NETWORK" | "APP_UPDATE_REQUIRED";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: ApiErrorCode,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface BackendConfig {
  url: string;
  anonKey: string;
}

/**
 * Build-time backend settings. Both values are public (the anon key is the
 * same one shipped inside the mobile apps). They are inlined by `next build`,
 * so each environment needs its own build.
 */
export function getBackendConfig(): BackendConfig | null {
  const url = (process.env.NEXT_PUBLIC_WASHMATE_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  const anonKey = (process.env.NEXT_PUBLIC_WASHMATE_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isBackendConfigured(): boolean {
  return getBackendConfig() !== null;
}

function requireBackendConfig(): BackendConfig {
  const config = getBackendConfig();
  if (!config) {
    throw new ApiError(0, "Online booking is not available right now.", "NOT_CONFIGURED");
  }
  return config;
}

/**
 * Headers sent on every call. The website has no native build number, so
 * x-app-version-code is omitted and the backend treats it as an unversioned
 * client (_shared/versionCheck.ts). If that policy rejects unversioned
 * clients, calls fail with code APP_UPDATE_REQUIRED.
 */
export function webClientHeaders(): Record<string, string> {
  return {
    "x-app-id": WEB_APP_ID,
    "x-app-platform": "web",
    "x-app-version-name": WEB_APP_VERSION_NAME,
  };
}

function messageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const err = body as Record<string, unknown>;
    if (typeof err.error === "string" && err.error) return err.error;
    if (err.error && typeof err.error === "object") {
      const nested = err.error as Record<string, unknown>;
      if (typeof nested.message === "string" && nested.message) return nested.message;
    }
    if (typeof err.message === "string" && err.message) return err.message;
    if (typeof err.error_description === "string" && err.error_description) return err.error_description;
    if (typeof err.msg === "string" && err.msg) return err.msg;
  }
  return fallback;
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  token?: string | null;
  query?: Record<string, string>;
  signal?: AbortSignal;
  /** Extra headers, e.g. Prefer for PostgREST. */
  headers?: Record<string, string>;
}

/** Calls `${SUPABASE_URL}${path}` and returns the parsed JSON body. */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { url, anonKey } = requireBackendConfig();
  const method = options.method ?? "POST";

  let requestUrl = `${url}${path}`;
  if (options.query) {
    const params = new URLSearchParams(options.query).toString();
    if (params) requestUrl += `${requestUrl.includes("?") ? "&" : "?"}${params}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: anonKey,
    ...webClientHeaders(),
    ...options.headers,
  };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let res: Response;
  try {
    res = await fetch(requestUrl, {
      method,
      headers,
      body: options.body !== undefined && method !== "GET" ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "Could not reach WRINGG. Check your connection and try again.", "NETWORK");
  }

  const text = await res.text().catch(() => "");
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = undefined;
    }
  }

  if (!res.ok) {
    const message = messageFromBody(parsed, text || res.statusText || `Request failed (${res.status})`);
    const details = parsed && typeof parsed === "object" ? parsed : undefined;
    if (res.status === 426 || message === "APP_UPDATE_REQUIRED") {
      throw new ApiError(
        res.status,
        "Online booking is paused right now. Please book in the WRINGG app.",
        "APP_UPDATE_REQUIRED",
        details,
      );
    }
    throw new ApiError(res.status, message, undefined, details);
  }

  return parsed as T;
}

/** Customer-safe text for any thrown value. */
export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
