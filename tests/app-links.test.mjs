import test from "node:test";
import assert from "node:assert/strict";
import { appStoreLinks, getAppStoreUrl } from "../src/lib/app-links.mjs";

test("Android phones and tablets open the customer Play listing", () => {
  for (const ua of ["Mozilla/5.0 (Linux; Android 15; Pixel 9)", "Mozilla/5.0 (Linux; Android 14; SM-X710)"]) {
    assert.equal(getAppStoreUrl(ua), "https://play.google.com/store/apps/details?id=in.wringg.app");
  }
});
test("iOS and desktop-mode iPads use configured Apple link", () => {
  const links = { ...appStoreLinks, ios: "https://apps.apple.com/in/app/example/id123456789" };
  for (const ua of ["iPhone OS 18", "iPad OS 18", "iPod"]) {
    assert.equal(getAppStoreUrl(ua, 0, links), links.ios);
  }
  assert.equal(getAppStoreUrl("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)", 5, links), links.ios);
});
test("missing iOS listing stays on usable fallback", () => {
  assert.equal(getAppStoreUrl("iPhone"), null);
  assert.equal(getAppStoreUrl("Macintosh", 5), null);
});
test("desktop, bots, unknown and empty user agents do not redirect", () => {
  for (const ua of ["Windows NT 10.0", "Macintosh", "Linux x86_64", "Googlebot", ""]) {
    assert.equal(getAppStoreUrl(ua), null);
  }
  assert.equal(getAppStoreUrl(), null);
});
