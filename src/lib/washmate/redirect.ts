// Post-login destinations. Pure module (no runtime imports) so it can be unit tested.

/** Only same-site paths are allowed as a post-login destination. */
export function safeNextPath(raw: string | null | undefined, fallback = "/book"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

export function loginHref(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}
