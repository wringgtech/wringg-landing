// Pure helpers for the profile hub (/account) and the profile editor
// (/account/profile). No runtime imports so the node:test suite can load this
// file directly with `node --experimental-strip-types`.

// --- Profile edit payload ----------------------------------------------------

export interface ProfileDraft {
  fullName: string;
  displayName: string;
  email: string;
}

/** What the last successful load had, if anything, for the optional fields. */
export interface LoadedOptionalValues {
  displayName: string | null;
  email: string | null;
}

/**
 * Shape sent to updateCustomerProfile. An omitted key (absent from the
 * object, not just undefined-valued) leaves the column untouched; an explicit
 * null clears it; a string sets it.
 */
export interface ProfileUpdatePayload {
  fullName: string;
  displayName?: string | null;
  email?: string | null;
}

export interface ProfileFieldErrors {
  fullName?: string;
  email?: string;
}

export const FULL_NAME_MIN = 2;
export const FULL_NAME_MAX = 80;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateProfileDraft(draft: ProfileDraft): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  const name = draft.fullName.trim();
  if (!name) {
    errors.fullName = "Full name is required.";
  } else if (name.length < FULL_NAME_MIN || name.length > FULL_NAME_MAX) {
    errors.fullName = `Full name must be ${FULL_NAME_MIN}–${FULL_NAME_MAX} characters.`;
  }
  const email = draft.email.trim();
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = "Please enter a valid email address.";
  }
  return errors;
}

/**
 * Encodes the app's data-loss guard (apps/customer-mobile/app/profile):
 *  - a non-empty trimmed field is always sent as a string;
 *  - an empty field sends an explicit null ONLY when the load had shown a
 *    value there (the customer deliberately cleared it);
 *  - an empty field with no loaded value sends nothing (the key is omitted),
 *    so a failed read can never blank stored data.
 * `fullName` is always required and always sent.
 */
export function buildProfileUpdatePayload(
  draft: ProfileDraft,
  loaded: LoadedOptionalValues | null,
): ProfileUpdatePayload {
  const payload: ProfileUpdatePayload = { fullName: draft.fullName.trim() };

  const displayName = draft.displayName.trim();
  if (displayName) {
    payload.displayName = displayName;
  } else if (loaded && loaded.displayName !== null) {
    payload.displayName = null;
  }

  const email = draft.email.trim();
  if (email) {
    payload.email = email;
  } else if (loaded && loaded.email !== null) {
    payload.email = null;
  }

  return payload;
}

// --- Zero state and membership ------------------------------------------------

/**
 * The stat row renders only when at least one account number is non-zero —
 * a brand-new customer gets the "Getting started" block instead of a wall of
 * zeros.
 */
export function shouldShowStats(
  addressCount: number,
  activeOrderCount: number,
  totalOrderCount: number,
): boolean {
  return addressCount > 0 || activeOrderCount > 0 || totalOrderCount > 0;
}

/**
 * "Member since May 2025" from an ISO createdAt; null when the timestamp is
 * missing or unparsable (the line is simply skipped).
 */
export function memberSinceLabel(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  const time = date.getTime();
  if (!Number.isFinite(time)) return null;
  const label = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
  return `Member since ${label}`;
}

// --- Dues --------------------------------------------------------------------

/** Number form of the total-due decimal string; unusable input counts as 0. */
export function totalDueValue(totalDue: string): number {
  const value = Number.parseFloat(totalDue);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * The whole Dues section renders only when something is actually owed.
 * An empty, malformed or zero total hides it — no "you owe ₹0" sections.
 */
export function shouldShowDues(totalDue: string): boolean {
  return totalDueValue(totalDue) > 0;
}

/**
 * Customer-safe wording for a due row. The backend only creates the
 * payment_pending_exception reason today; anything else gets the honest
 * generic label rather than a raw enum string.
 */
export function dueReasonLabel(reason: string): string {
  if (reason === "payment_pending_exception") {
    return "Payment not collected on delivery";
  }
  return "Payment pending";
}
