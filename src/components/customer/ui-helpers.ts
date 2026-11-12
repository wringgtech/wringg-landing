// Pure helpers for the customer UI primitives. No runtime imports so the
// node:test suite can strip types and run this file directly.

/** Joins truthy class names (tiny `clsx` for this folder). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Keeps digits only, e.g. a pasted "12 34 5" becomes "12345". */
export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Placeholder character for an OTP slot that has no digit yet. OTP strings
 * are always exactly `length` characters so digits never shift positions
 * when a middle box is cleared or a prefix is deleted.
 */
export const OTP_BLANK = " ";

/** True when every slot holds a digit (an integer regex on the whole string). */
export function isOtpComplete(value: string, length: number): boolean {
  return new RegExp(`^\\d{${length}}$`).test(value);
}

/**
 * Places `incoming` digits into an OTP string starting at `start`, writing at
 * most `length` slots. Used for single keystrokes, SMS autofill that delivers
 * the whole code into the first box, and pasted spreads. Positions of other
 * digits are never shifted; untouched slots hold OTP_BLANK.
 */
export function applyOtpValue(
  current: string,
  start: number,
  incoming: string,
  length: number,
): string {
  const chars = Array.from({ length }, (_, i) => current[i] ?? OTP_BLANK);
  const digits = digitsOnly(incoming);
  if (digits.length === 0) {
    // Non-digit keystroke: clear this slot only.
    if (start >= 0 && start < length) chars[start] = OTP_BLANK;
    return chars.join("");
  }
  for (let i = 0; i < digits.length && start + i < length; i += 1) {
    chars[start + i] = digits[i];
  }
  return chars.join("");
}

/** Removes the digit at `index`, keeping every other digit's position. */
export function removeOtpDigit(current: string, index: number, length: number): string {
  const chars = Array.from({ length }, (_, i) => current[i] ?? OTP_BLANK);
  if (index >= 0 && index < length) chars[index] = OTP_BLANK;
  return chars.join("");
}

/** Clamps a numeric stepper value into [min, max]. */
export function clampStepper(value: number, min: number, max: number): number {
  const safe = Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, safe));
}

/** Draft text for a stepper input: digits only, or "" while the field is empty. */
export function sanitizeStepperDraft(raw: string, maxLength = 6): string {
  return raw.replace(/\D/g, "").slice(0, maxLength);
}

/**
 * Bookings move in whole units — a typed "12.5" or "-3" snaps to a legal
 * integer without fighting the user mid-typing.
 */
export function parseStepperInput(raw: string, min: number, max: number): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return clampStepper(Number.parseInt(trimmed, 10), min, max);
}

/**
 * Header-safe display for a signed-in phone: shows country code and the last
 * four digits, masking the rest. Returns "" for empty input.
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  const plus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 4) return trimmed;
  return `${plus ? "+" : ""}${digits.slice(0, 2)} •••• ${digits.slice(-4)}`;
}

/**
 * Owner-facing phone display for the profile hub: "+919876543210" and
 * "9876543210" render as "+91 98765 43210" (the standard 5+5 grouping on the
 * 10-digit subscriber number, whatever way the country code was stored).
 * Other country codes fall back to spaced groups of the raw digits.
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  if (!trimmed) return "";
  const plus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");
  let ccPrefix = plus ? "+" : "";
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
    ccPrefix = "+91 ";
  }
  if (digits.length < 10) return trimmed;
  const spaced =
    digits.length === 10
      ? `${digits.slice(0, 5)} ${digits.slice(5)}`
      : digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
  return `${ccPrefix}${spaced}`;
}

/**
 * Singular/plural form for a count: pluralize(1, "cloth", "clothes") ===
 * "cloth", pluralize(3, "cloth", "clothes") === "clothes". The default plural
 * is the singular + "s"; 0 and other non-1 counts use the plural.
 */
export function pluralize(count: number, one: string, many = `${one}s`): string {
  return count === 1 ? one : many;
}

/**
 * Two-glyph avatar initials: the first grapheme of the FIRST word and of the
 * LAST word, so "Aleksandra Wiśniewska-Kowalczyk" → "AW", "Jo" → "J".
 * Grapheme-safe via Intl.Segmenter (fallback: code points via Array.from),
 * so emoji and combined accents never render as "�". "?" when there is
 * nothing usable.
 */
export function initialsFor(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const seg =
    typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
      : null;
  const first = firstGrapheme(words[0], seg);
  const last = words.length > 1 ? firstGrapheme(words[words.length - 1], seg) : "";
  return (first + last).toUpperCase() || "?";
}

function firstGrapheme(word: string, seg: Intl.Segmenter | null): string {
  if (seg) {
    for (const part of seg.segment(word)) {
      return typeof part === "string" ? part : part.segment;
    }
    return "";
  }
  return Array.from(word)[0] ?? "";
}
