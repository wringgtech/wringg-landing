// Pure validation and formatting helpers for the sign-in flow.
// No runtime imports (type-only at most) so node:test can load it directly.

/** A 10-digit Indian mobile starting 6-9 (the digits after the +91 prefix). */
export const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

/**
 * Normalises pasted or SMS-autofilled input into the 10 Indian subscriber
 * digits. Full forms (+91XXXXXXXXXX, 91XXXXXXXXXX, 0091XXXXXXXXXX,
 * 0XXXXXXXXXX) are stripped down; a bare 10-digit input that happens to start
 * with 91 has no recognised prefix and is left as-is.
 */
export function sanitizePhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const full = digits.match(/^(?:0091|91|0)([6-9]\d{9})$/);
  return (full ? full[1] : digits).slice(0, 10);
}

export function isValidIndianMobile(value: string): boolean {
  return INDIAN_MOBILE_PATTERN.test(value);
}

/** E.164 form sent to auth-request-otp / auth-verify-otp, e.g. "+919876543210". */
export function toE164Phone(digits: string): string {
  return `+91${digits}`;
}

export function isValidOtp(value: string): boolean {
  return /^\d{6}$/.test(value);
}

export function sanitizeOtpInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

export const NAME_MIN = 2;
export const NAME_MAX = 80;

/** null when valid, otherwise a customer-facing error message. */
export function validateFullName(value: string): string | null {
  const name = value.trim();
  if (name.length < NAME_MIN) return "Please enter your full name (at least 2 letters).";
  if (name.length > NAME_MAX) return "Please enter 80 characters or fewer.";
  return null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email is optional: blank is fine, anything present must look like an email. */
export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return null;
  return EMAIL_PATTERN.test(email) ? null : "Please enter a valid email address, or leave it blank.";
}

/** "9876543210" or "+919876543210" -> "+91 XXXXX XXXXX" (unreadable input passes through). */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (!isValidIndianMobile(digits)) return phone;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}
