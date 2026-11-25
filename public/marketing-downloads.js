import { withUtmParameters } from "/marketing-download-links.js";

const downloadHosts = new Set(["go.wringg.in", "play.google.com", "testflight.apple.com"]);
const opening = new Map();
function updateHref(link) {
  const href = link.getAttribute("href");
  if (!href || href.startsWith("#")) return;
  const url = new URL(href, location.href);
  if (downloadHosts.has(url.hostname) || (url.origin === location.origin && url.pathname !== location.pathname)) {
    const updated = withUtmParameters(url.href, location.search);
    if (updated !== link.href) link.href = updated;
  }
}
for (const link of document.querySelectorAll("a[href]")) updateHref(link);

function reset(link) {
  const state = opening.get(link);
  if (!state) return;
  clearTimeout(state.timeout);
  link.innerHTML = state.html;
  link.classList.remove("download-opening");
  link.removeAttribute("aria-busy");
  link.removeAttribute("aria-disabled");
  opening.delete(link);
}
function resetAll() { for (const link of opening.keys()) reset(link); }
window.addEventListener("pageshow", resetAll);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") resetAll(); });

document.addEventListener("click", event => {
  const link = event.target.closest("a[href]");
  if (!link) return;
  updateHref(link);
  const android = navigator.userAgentData?.platform === "Android" || /Android/i.test(navigator.userAgent);
  const destination = new URL(link.href);
  const appHandoff = destination.hostname === "go.wringg.in" || destination.hostname === "play.google.com";
  if (!android || !appHandoff || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (opening.has(link)) { event.preventDefault(); return; }
  const html = link.innerHTML;
  const content = document.createElement("span");
  content.className = "download-original";
  content.innerHTML = html;
  const status = document.createElement("span");
  status.className = "download-status";
  status.setAttribute("role", "status");
  status.textContent = "Opening app…";
  link.replaceChildren(content, status);
  link.classList.add("download-opening");
  link.setAttribute("aria-busy", "true");
  link.setAttribute("aria-disabled", "true");
  opening.set(link, { html, timeout: setTimeout(() => reset(link), 15_000) });
});
