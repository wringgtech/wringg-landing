import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { withUtmParameters } from "../src/app/download-links.ts";

const out = path.resolve("out");
const routes = ["index.html", "pricing/index.html", "our-story/index.html", "commercial-laundry/index.html"];
const read = file => fs.readFileSync(path.join(out, file), "utf8");
function resolveLocal(url) {
  const file = path.join(out, decodeURIComponent(new URL(url, "https://wringg.in").pathname));
  return [file, path.join(file, "index.html"), `${file}.html`].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

test("approved marketing pages ship without preview-host or stale Next hydration references", () => {
  for (const route of routes) {
    const html = read(route);
    assert.match(html, /<title>[^<]+<\/title>/, route);
    assert.doesNotMatch(html, /chatgpt\.site|127\.0\.0\.1|self\.__next_f|<script[^>]+src="\/_next\//, route);
    assert.doesNotMatch(html, /<meta\b[^>]*\bname=["'](?:robots|googlebot)["'][^>]*\bcontent=["'][^"']*(?:noindex|nofollow|none)/i, `${route}: production pages must allow indexing`);
    const canonical = `https://wringg.in/${route.replace(/index\.html$/, "")}`;
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `${route}: production canonical URL`);
    assert.match(html, /wringg-logo-original-v13\.svg/, route);
    assert.doesNotMatch(html, /918438508211|84385\s*08211/, route);
  }
});

test("marketing local assets and linked website pages exist in the final export", () => {
  const styles = new Set();
  for (const route of routes) {
    for (const match of read(route).matchAll(/(?:src|href)=["'](\/[^"']*)["']/g)) {
      const url = match[1];
      if (url.startsWith("//")) continue;
      const file = resolveLocal(url);
      assert.ok(file, `${route}: ${url}`);
      if (file.endsWith(".css")) styles.add(file);
    }
  }
  for (const file of styles) {
    for (const match of fs.readFileSync(file, "utf8").matchAll(/url\(["']?(\/[^)"']+)["']?\)/g)) {
      assert.ok(resolveLocal(match[1]), `${path.basename(file)}: ${match[1]}`);
    }
  }
});

test("current legal, support, and app privacy routes remain exported", () => {
  for (const route of ["privacy", "terms", "refund", "shipping", "contact", "delete-account", "user-privacy"]) {
    const file = resolveLocal(`/${route}`);
    assert.ok(file, route);
    assert.match(fs.readFileSync(file, "utf8"), /<h1\b/, route);
  }
});

test("marketing downloads use the current production campaign and shared UTM behavior", async () => {
  assert.match(read("index.html"), /https:\/\/go\.wringg\.in\/r\/7f48272933034476b52ba92c90f53907/);
  const generated = await import(pathToFileURL(path.join(out, "marketing-download-links.js")));
  const samples = [
    ["https://go.wringg.in/r/7f48272933034476b52ba92c90f53907", "utm_source=instagram&utm_campaign=BTM+wash&phone=private"],
    ["https://play.google.com/store/apps/details?id=in.wringg.partner&referrer=wr_click%3Dexisting", "utm_source=meta&utm_content=a&utm_content=b"],
    ["#network", "utm_source=test"],
  ];
  for (const [destination, search] of samples) {
    assert.equal(generated.withUtmParameters(destination, search), withUtmParameters(destination, search));
  }
});
