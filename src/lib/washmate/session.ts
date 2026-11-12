"use client";

// Signed-in customer session, kept in localStorage.
//
// The mobile app keeps the same tokens in SecureStore. A static site has no
// server-side session, so the browser holds the Supabase access and refresh
// tokens. Access tokens are refreshed through Supabase Auth the same way the
// app does (AuthContext.refreshStoredSession).

import { useSyncExternalStore } from "react";
import { ApiError, getBackendConfig } from "./client";

export interface CustomerSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
  /** E.164 phone used to sign in. */
  phone: string;
  /** False until customer-complete-profile has saved a name. */
  hasProfile: boolean;
  profileName: string | null;
}

const STORAGE_KEY = "wringg.customer.session.v1";

type Listener = () => void;
const listeners = new Set<Listener>();

let cached: CustomerSession | null | undefined;

function isSession(value: unknown): value is CustomerSession {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.accessToken === "string" &&
    typeof v.refreshToken === "string" &&
    typeof v.userId === "string" &&
    typeof v.phone === "string" &&
    typeof v.hasProfile === "boolean"
  );
}

function readStorage(): CustomerSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

/** Current session, or null when signed out. Client-only. */
export function getSession(): CustomerSession | null {
  if (typeof window === "undefined") return null;
  if (cached === undefined) cached = readStorage();
  return cached;
}

export function saveSession(session: CustomerSession): void {
  cached = session;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be unavailable (private mode quota). Keep the in-memory copy.
  }
  emit();
}

export function updateSession(patch: Partial<CustomerSession>): void {
  const current = getSession();
  if (!current) return;
  saveSession({ ...current, ...patch });
}

export function clearSession(): void {
  cached = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  emit();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    cached = readStorage();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export type SessionState =
  | { status: "loading"; session: null }
  | { status: "signedOut"; session: null }
  | { status: "signedIn"; session: CustomerSession };

/**
 * React view of the session. Returns "loading" during prerender and
 * hydration, because the static HTML cannot know who is signed in.
 */
export function useCustomerSession(): SessionState {
  const session = useSyncExternalStore<CustomerSession | null | undefined>(
    subscribe,
    getSession,
    () => undefined,
  );
  if (session === undefined) return { status: "loading", session: null };
  if (session === null) return { status: "signedOut", session: null };
  return { status: "signedIn", session };
}

let refreshInFlight: Promise<CustomerSession | null> | null = null;

/** Exchanges the refresh token for new tokens. Returns null when it fails. */
export function refreshSession(): Promise<CustomerSession | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const current = getSession();
    const config = getBackendConfig();
    if (!current || !config) return null;
    try {
      const res = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: config.anonKey },
        body: JSON.stringify({ refresh_token: current.refreshToken }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { access_token?: string; refresh_token?: string };
      if (!data.access_token || !data.refresh_token) return null;
      const next = { ...current, accessToken: data.access_token, refreshToken: data.refresh_token };
      saveSession(next);
      return next;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/**
 * Runs an authenticated call. On 401 it refreshes once and retries; if that
 * fails the session is cleared and an ApiError(401) is thrown so the page can
 * send the customer to /login.
 */
export async function withAuth<T>(call: (accessToken: string) => Promise<T>): Promise<T> {
  const session = getSession();
  if (!session) throw new ApiError(401, "Please sign in to continue.");
  try {
    return await call(session.accessToken);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err;
    const refreshed = await refreshSession();
    if (!refreshed) {
      clearSession();
      throw new ApiError(401, "Your session has expired. Please sign in again.");
    }
    try {
      return await call(refreshed.accessToken);
    } catch (retryErr) {
      if (retryErr instanceof ApiError && retryErr.status === 401) {
        clearSession();
        throw new ApiError(401, "Your session has expired. Please sign in again.");
      }
      throw retryErr;
    }
  }
}

export { loginHref, safeNextPath } from "./redirect";
