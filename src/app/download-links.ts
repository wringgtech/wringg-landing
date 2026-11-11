export function withUtmParameters(destination: string, search: string): string {
  if (destination.startsWith("#")) return destination;

  const incoming = new URLSearchParams(search);
  const utm = [...incoming.entries()].filter(([key]) => /^utm_/i.test(key));

  if (utm.length === 0) return destination;

  const url = new URL(destination);
  const keys = new Set(utm.map(([key]) => key));

  for (const key of keys) url.searchParams.delete(key);
  for (const [key, value] of utm) url.searchParams.append(key, value);

  // Google Play passes campaign data to the install through its referrer field.
  if (url.origin === "https://play.google.com" && url.pathname === "/store/apps/details") {
    const referrer = new URLSearchParams(url.searchParams.get("referrer") ?? "");
    for (const key of keys) referrer.delete(key);
    for (const [key, value] of utm) referrer.append(key, value);
    url.searchParams.set("referrer", referrer.toString());
  }

  return url.toString();
}
