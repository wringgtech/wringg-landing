import assert from "node:assert/strict";
import test from "node:test";
import { withUtmParameters } from "../src/app/download-links.ts";

test("keeps navigation anchors on the current page without altering campaign parameters", () => {
  assert.equal(withUtmParameters("#pilot", "utm_source=instagram"), "#pilot");
});

test("keeps a download destination unchanged for an untagged visit", () => {
  const destination = "https://play.google.com/store/apps/details?id=in.wringg.partner";
  assert.equal(withUtmParameters(destination, ""), destination);
  assert.equal(withUtmParameters(destination, "email=private%40example.com"), destination);
});

test("preserves all UTM fields and values while excluding unrelated query parameters", () => {
  const destination = "https://go.wringg.in/r/examplecode?utm_source=default#download";
  const result = new URL(withUtmParameters(destination,
    "utm_source=instagram&utm_medium=paid+social&utm_campaign=BTM+%26+Ulsoor&utm_content=video%2Fone&utm_term=wash%2Biron&utm_id=campaign-7&utm_custom=%E0%AE%A4%E0%AE%AE%E0%AE%BF%E0%AE%B4%E0%AF%8D&phone=7200232473&id=wrong"));
  assert.equal(result.pathname, "/r/examplecode");
  assert.equal(result.hash, "#download");
  assert.equal(result.searchParams.get("utm_source"), "instagram");
  assert.equal(result.searchParams.get("utm_medium"), "paid social");
  assert.equal(result.searchParams.get("utm_campaign"), "BTM & Ulsoor");
  assert.equal(result.searchParams.get("utm_content"), "video/one");
  assert.equal(result.searchParams.get("utm_term"), "wash+iron");
  assert.equal(result.searchParams.get("utm_id"), "campaign-7");
  assert.equal(result.searchParams.get("utm_custom"), "தமிழ்");
  assert.equal(result.searchParams.has("phone"), false);
  assert.equal(result.searchParams.has("id"), false);
});

test("carries duplicate and empty UTM values without retaining an old default", () => {
  const result = new URL(withUtmParameters(
    "https://go.wringg.in/r/examplecode?utm_content=default",
    "utm_content=one&utm_content=two&utm_term=&UTM_SOURCE=qr",
  ));
  assert.deepEqual(result.searchParams.getAll("utm_content"), ["one", "two"]);
  assert.equal(result.searchParams.get("utm_term"), "");
  assert.equal(result.searchParams.get("UTM_SOURCE"), "qr");
});

test("encodes Google Play install-referrer UTMs and preserves the app and click token", () => {
  const destination = new URL("https://play.google.com/store/apps/details?id=in.wringg.partner");
  destination.searchParams.set("referrer", "wr_click=existing-token&utm_source=old");
  const result = new URL(withUtmParameters(destination.toString(),
    "utm_source=meta&utm_campaign=BTM+%26+Ulsoor&id=in.wringg.app&referrer=wrong"));
  const referrer = new URLSearchParams(result.searchParams.get("referrer"));
  assert.equal(result.searchParams.get("id"), "in.wringg.partner");
  assert.equal(referrer.get("wr_click"), "existing-token");
  assert.equal(referrer.get("utm_source"), "meta");
  assert.equal(referrer.get("utm_campaign"), "BTM & Ulsoor");
  assert.equal(referrer.has("id"), false);
});
